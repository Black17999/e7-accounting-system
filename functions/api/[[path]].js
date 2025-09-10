/*
 * =================================================================
 *         E7 统一记账系统 - API 功能处理器
 *
 *  文件名: functions/api/[[path]].js
 *  职责: 仅负责前端的数据 API 服务 (/api/data)
 * =================================================================
 */

/**
 * 核心API请求处理函数 (Fetch Handler)
 * Cloudflare Pages 会将所有匹配 /api/* 的 HTTP 请求发送到这里。
 */
export async function onRequest(context) {
    const { request, env } = context;
    // 注意：Pages Functions 的路径参数解析方式不同，我们直接用 URL
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');

    // --- CORS 预检请求处理 ---
    if (request.method === 'OPTIONS') {
        return handleOptions(request);
    }

    // --- 路由逻辑中心 ---
    switch (path) {
        case 'data':
            if (request.method === 'GET') {
                return handleGetData(request, env);
            }
            if (request.method === 'POST') {
                return handlePostData(request, env);
            }
            break;
        case 'export':
            if (request.method === 'GET') {
                return handleExport(request, env);
            }
            break;
        case 'import':
            if (request.method === 'POST') {
                return handleImport(request, env);
            }
            break;
        // 备份和恢复的端点已移除，将由独立的 Worker 处理
        default:
            return new Response(`API 端点未找到: /api/${path}`, { status: 404, headers: corsHeaders });
    }

    return new Response('不支持的请求方法。', { status: 405, headers: corsHeaders });
}

// =================================================================
//                      功能模块实现区域
// =================================================================

// --- 模块一: API 数据处理 ---

async function handleGetData(request, env) {
    try {
        const history = await env.DB.get('history');
        const debts = await env.DB.get('debts');
        const tobacco = await env.DB.get('tobacco');
        const data = {
            history: history ? JSON.parse(history) : {},
            debts: debts ? JSON.parse(debts) : null,
            tobacco: tobacco ? JSON.parse(tobacco) : [],
        };
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (e) {
        console.error("API Get Error:", e);
        return new Response(e.message, { status: 500, headers: corsHeaders });
    }
}

async function handlePostData(request, env) {
    try {
        const { history, debts, tobacco } = await request.json();
        if (history === undefined || debts === undefined) {
            return new Response('请求体中缺少 history 或 debts 数据', { status: 400, headers: corsHeaders });
        }
        const promises = [
            env.DB.put('history', JSON.stringify(history)),
            env.DB.put('debts', JSON.stringify(debts)),
        ];
        
        // 如果有烟草数据，则也存储
        if (tobacco !== undefined) {
            promises.push(env.DB.put('tobacco', JSON.stringify(tobacco)));
        }
        
        await Promise.all(promises);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (e) {
        console.error("API Post Error:", e);
        return new Response(e.message, { status: 500, headers: corsHeaders });
    }
}

// --- 模块三: 数据导出/导入 ---

/**
 * 从 KV 中获取所有指定前缀的数据
 * @param {KVNamespace} db - KV 命名空间
 * @param {string} prefix - 键前缀
 * @returns {Promise<Array<object>>}
 */
async function getAllDataByPrefix(db, prefix) {
    const list = await db.list({ prefix });
    const promises = list.keys.map(key => db.get(key.name));
    const values = await Promise.all(promises);
    // 过滤掉空的或无效的JSON值
    return values.filter(v => v).map(val => JSON.parse(val));
}

/**
 * 处理数据导出请求 (GET /export)
 */
async function handleExport(request, env) {
    try {
        const [accounts, categories, transactions] = await Promise.all([
            getAllDataByPrefix(env.DB, 'acct:'),
            getAllDataByPrefix(env.DB, 'cat:'),
            getAllDataByPrefix(env.DB, 'txn:')
        ]);

        const exportedAt = new Date().toISOString();
        const exportData = {
            app: "MyPWA",
            schemaVersion: 1,
            exportedAt,
            data: {
                accounts,
                categories,
                transactions
            }
        };

        const filenameTimestamp = exportedAt.replace(/[:.]/g, '');
        const headers = {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="export-${filenameTimestamp}.json"`
        };

        return new Response(JSON.stringify(exportData, null, 2), { headers });
    } catch (e) {
        console.error("API Export Error:", e);
        return new Response(e.message, { status: 500, headers: corsHeaders });
    }
}

/**
 * 处理数据导入请求 (POST /import)
 */
async function handleImport(request, env) {
    try {
        const importData = await request.json();

        if (importData.app !== 'MyPWA' || !importData.data) {
            return new Response('无效的导入文件格式。', { status: 400, headers: corsHeaders });
        }

        const { accounts = [], categories = [], transactions = [] } = importData.data;
        const results = { inserted: 0, updated: 0, errors: [] };
        
        const processData = async (items, prefix, type) => {
            for (const item of items) {
                if (!item.id) {
                    results.errors.push({ where: type, id: 'unknown', message: '记录缺少 id 字段' });
                    continue;
                }
                try {
                    await env.DB.put(`${prefix}:${item.id}`, JSON.stringify(item));
                    results.updated++; // 无法区分 insert/update，统一计为 updated
                } catch (e) {
                    results.errors.push({ where: type, id: item.id, message: e.message });
                }
            }
        };

        await Promise.all([
            processData(accounts, 'acct', 'accounts'),
            processData(categories, 'cat', 'categories'),
            processData(transactions, 'txn', 'transactions')
        ]);

        return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (e) {
        console.error("API Import Error:", e);
        return new Response(e.message, { status: 500, headers: corsHeaders });
    }
}

// --- 模块二: CORS 辅助功能 ---

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function handleOptions(request) {
    if (
        request.headers.get('Origin') !== null &&
        request.headers.get('Access-Control-Request-Method') !== null &&
        request.headers.get('Access-Control-Request-Headers') !== null
    ) {
        return new Response(null, { headers: corsHeaders });
    } else {
        return new Response(null, { headers: { Allow: 'GET, POST, OPTIONS' } });
    }
}
