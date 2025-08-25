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
