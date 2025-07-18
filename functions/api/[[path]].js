/*
 * =================================================================
 *         E7 统一记账系统 - 统一功能处理器
 *
 *  文件名: functions/api/[[path]].js
 *  职责 (已整合):
 *  1. API 服务 (/api/data): 响应前端的数据获取和保存请求。
 *  2. 手动任务 (/api/run-backup-now, /api/restore-from-backup): 处理手动触发的备份和恢复。
 *  3. 【新增】自动计划任务 (onScheduled): 由Cloudflare根据计划自动调用，执行数据备份。
 *  4. 统一路由: 捕获所有 /api/* 的请求并分发到正确的处理逻辑。
 * =================================================================
 */

/**
 * 核心API请求处理函数 (Fetch Handler)
 * Cloudflare Pages 会将所有匹配 /api/* 的 HTTP 请求发送到这里。
 */
export async function onRequest(context) {
    const { request, env, params, waitUntil } = context;
    // 从路径中解析出请求的端点
    const path = Array.isArray(params.path) ? params.path.join('/') : params.path;
    const url = new URL(request.url);

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

        case 'run-backup-now':
            // 注意: 此API仅用于手动触发备份。
            waitUntil(doBackup(env, 'manual')); // 标记为手动触发
            return new Response('手动备份任务已成功启动！请稍后检查 R2 存储桶。', { status: 200, headers: corsHeaders });

        case 'restore-from-backup':
            const fileName = url.searchParams.get('file');
            if (!fileName) {
                return new Response('错误：“file”查询参数缺失。请提供如 ?file=backup-2023-10-27.json 的参数。', { status: 400, headers: corsHeaders });
            }
            waitUntil(doRestore(env, fileName));
            return new Response(`已从文件: ${fileName} 启动恢复任务。请稍后刷新您的应用查看结果。`, { status: 200, headers: corsHeaders });

        default:
            return new Response(`API 端点未找到: /api/${path}`, { status: 404, headers: corsHeaders });
    }

    return new Response('不支持的请求方法。', { status: 405, headers: corsHeaders });
}


/**
 * =================================================================
 *         【新增】自动计划任务 (Cron Trigger)
 *
 * Cloudflare 的调度器会自动调用这个导出的 onScheduled 函数。
 * =================================================================
 */
export async function onScheduled(context) {
    console.log("onScheduled: 计划任务触发，开始执行自动备份...");
    const { env, waitUntil } = context;
    // 调用通用的备份函数，并标记为自动触发
    await doBackup(env, 'scheduled', waitUntil);
    console.log("onScheduled: 自动备份任务已提交执行。");
}


// =================================================================
//                      功能模块实现区域
// =================================================================

// --- 模块一: API 数据处理 ---

async function handleGetData(request, env) {
    try {
        const history = await env.DB.get('history');
        const debts = await env.DB.get('debts');
        const data = {
            history: history ? JSON.parse(history) : {},
            debts: debts ? JSON.parse(debts) : null,
        };
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (e) {
        console.error("API Get Error:", e);
        return new Response(e.message, { status: 500, headers: corsHeaders });
    }
}

async function handlePostData(request, env) {
    try {
        const { history, debts } = await request.json();
        if (history === undefined || debts === undefined) {
            return new Response('请求体中缺少 history 或 debts 数据', { status: 400, headers: corsHeaders });
        }
        await Promise.all([
            env.DB.put('history', JSON.stringify(history)),
            env.DB.put('debts', JSON.stringify(debts)),
        ]);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    } catch (e) {
        console.error("API Post Error:", e);
        return new Response(e.message, { status: 500, headers: corsHeaders });
    }
}


// --- 模块二: 通用备份与恢复功能 ---

// 通用备份函数，可以被手动或自动触发
async function doBackup(env, triggerType = 'manual', waitUntil) {
    const heartbeatUrl = env.HEARTBEAT_URL; // 注意：env 来自调用者传入的 context.env

    try {
        console.log(`doBackup: 开始执行备份任务 (触发方式: ${triggerType})...`);

        const historyPromise = env.DB.get('history', { type: 'json' });
        const debtsPromise = env.DB.get('debts', { type: 'json' });
        const [history, debts] = await Promise.all([historyPromise, debtsPromise]);

        const backupData = {
            backupTimestampUTC: new Date().toISOString(),
            trigger: triggerType,
            history: history || {},
            debts: debts || [],
        };

        const utcDateString = new Date().toISOString().split('T')[0];
        const fileName = `backup-${utcDateString}.json`;
        
        await env.DB_BACKUPS.put(fileName, JSON.stringify(backupData, null, 2));
        console.log(`doBackup: 备份成功！文件已保存至R2: ${fileName}`);

        // 仅在自动计划任务时发送心跳
        if (triggerType === 'scheduled' && heartbeatUrl && waitUntil) {
            waitUntil(fetch(heartbeatUrl).catch(e => console.error("发送成功心跳时出错:", e.message)));
            console.log("doBackup: 已成功发送心跳信号。");
        }
    } catch (err) {
        console.error(`doBackup: 备份过程中发生严重错误 (触发方式: ${triggerType}):`, err);
        // 仅在自动计划任务时发送失败心跳
        if (triggerType === 'scheduled' && heartbeatUrl && waitUntil) {
            waitUntil(fetch(`${heartbeatUrl}/fail`,{ method: 'POST', body: err.message }).catch(e => console.error("发送失败心跳时出错:", e.message)));
            console.log("doBackup: 已发送失败心跳信号。");
        }
    }
}

async function doRestore(env, fileName) {
    try {
        console.log(`doRestore: 正在从文件: ${fileName} 执行恢复任务...`);
        const backupObject = await env.DB_BACKUPS.get(fileName);

        if (backupObject === null) {
            console.error(`doRestore: 恢复失败：文件 "${fileName}" 在 R2 存储桶中未找到。`);
            return;
        }

        const backupData = await backupObject.json();
        const restorePromises = [];
        if (backupData.history !== undefined) {
             restorePromises.push(env.DB.put('history', JSON.stringify(backupData.history)));
        }
        if (backupData.debts !== undefined) {
             restorePromises.push(env.DB.put('debts', JSON.stringify(backupData.debts)));
        }
        await Promise.all(restorePromises);
        console.log(`doRestore: 从文件 ${fileName} 的恢复操作已成功完成。`);
    } catch (err) {
        console.error(`doRestore: 从文件 ${fileName} 恢复数据时发生严重错误:`, err);
    }
}


// --- 模块三: CORS 辅助功能 ---

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