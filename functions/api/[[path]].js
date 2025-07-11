/*
 * =================================================================
 *              E7 统一记账系统 - 后端核心 (完整版)
 *
 *  文件名: functions/api/[[path]].js
 *  职责:
 *  1. API 服务 (/api/data): 响应前端的数据请求。
 *  2. 手动任务 (/api/run-backup-now, /api/restore-from-backup): 处理手动触发的备份和恢复。
 *  3. 自动任务 (scheduled): 由 Cloudflare Cron 触发器调用，执行每日备份。
 *  4. 统一路由: 捕获所有 /api/* 的请求并分发到正确的处理逻辑。
 * =================================================================
 */

/**
 * 核心请求处理函数 (Fetch Handler)
 * Cloudflare Pages 会将所有匹配 /api/* 的 HTTP 请求发送到这里。
 */
export async function onRequest(context) {
    const { request, env, params, waitUntil } = context;
    // `params.path` 是一个数组，包含了 /api/ 后面的所有路径部分。
    // 例如 /api/data -> ['data'], /api/run-backup-now -> ['run-backup-now']
    const path = Array.isArray(params.path) ? params.path[0] : '';
    const url = new URL(request.url);

    // --- CORS 预检请求处理 (直接从您的 worker.js 迁移) ---
    if (request.method === 'OPTIONS') {
        return handleOptions(request);
    }

    // --- 路由逻辑中心 ---
    switch (path) {
        // 对应您原先 worker.js 的功能
        case 'data':
            if (request.method === 'GET') {
                return handleGetData(request, env);
            }
            if (request.method === 'POST') {
                return handlePostData(request, env);
            }
            break; // 如果方法不匹配，则会走到下面的默认情况

        // 对应您原先 e7-backup-worker 的手动触发功能
        case 'run-backup-now':
            // 使用 waitUntil 确保备份任务在后台完成，即使响应已经发送
            waitUntil(doBackup(env));
            return new Response('备份任务已成功启动！请稍后检查 R2 存储桶。', { status: 200, headers: corsHeaders });

        // 我们设计的新功能：手动恢复
        case 'restore-from-backup':
            const fileName = url.searchParams.get('file');
            if (!fileName) {
                return new Response('错误：“file”查询参数缺失。请提供如 ?file=backup-2023-10-27.json 的参数。', { status: 400, headers: corsHeaders });
            }
            waitUntil(doRestore(env, fileName));
            return new Response(`已从文件: ${fileName} 启动恢复任务。请稍后刷新您的应用查看结果。`, { status: 200, headers: corsHeaders });

        default:
            return new Response('API 端点未找到。', { status: 404, headers: corsHeaders });
    }

    // 如果路径匹配但请求方法不匹配（例如向 /api/data 发送 PUT 请求）
    return new Response('不支持的请求方法。', { status: 405, headers: corsHeaders });
}

/**
 * 计划任务处理器 (Scheduled Handler)
 * 这部分代码从 e7-backup-worker 迁移而来，由 Cloudflare 的 Cron 触发器自动调用。
 */
export async function scheduled(controller, env, ctx) {
    console.log("计划任务已触发，开始执行每日备份流程...");
    ctx.waitUntil(doBackup(env));
}


// =================================================================
//                      功能模块实现区域
//  (以下函数是从您提供的两个 worker 文件中完整迁移和整合的)
// =================================================================

// --- 模块一: API 数据处理 (来自您的 worker.js) ---

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
        console.error("获取数据失败:", e);
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
        console.error("保存数据失败:", e);
        return new Response(e.message, { status: 500, headers: corsHeaders });
    }
}


// --- 模块二: 备份与恢复 (来自您的 e7-backup-worker.txt 和我们的新设计) ---

async function doBackup(env) {
    try {
        console.log("开始执行备份任务...");
        const historyData = await env.DB.get('history');
        const debtsData = await env.DB.get('debts');

        const backupData = {
            backupTimestamp: new Date().toISOString(),
            history: historyData ? JSON.parse(historyData) : {},
            debts: debtsData ? JSON.parse(debtsData) : [],
        };

        const today = new Date();
        const fileName = `backup-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.json`;

        await env.R2_BUCKET.put(fileName, JSON.stringify(backupData, null, 2));
        console.log(`成功创建备份文件: ${fileName}`);

        // --- 心跳机制 ---
        // !! 重要: 请将下面的 URL 替换为您从 Healthchecks.io 获取的真实 URL !!
        const heartbeatUrl = "https://hc-ping.com/f312605c-191d-41c9-8878-06d8f860ca6c";
        await fetch(heartbeatUrl, { method: 'POST', body: `成功备份文件: ${fileName}` });
        console.log("心跳信号已成功发送。");

    } catch (err) {
        console.error("备份过程中发生严重错误:", err);
        // 如果有监控服务，可以在这里发送失败的心跳或通知
        const heartbeatUrl = "https://hc-ping.com/YOUR-UNIQUE-ID-HERE/fail"; // Healthchecks.io 支持失败URL
        await fetch(heartbeatUrl, { method: 'POST', body: `备份失败: ${err.message}` });
    }
}

async function doRestore(env, fileName) {
    try {
        console.log(`正在从文件: ${fileName} 执行恢复任务...`);
        const backupObject = await env.R2_BUCKET.get(fileName);

        if (backupObject === null) {
            console.error(`恢复失败：文件 "${fileName}" 在 R2 存储桶中未找到。`);
            return;
        }

        const backupData = await backupObject.json();

        // 检查并恢复 history 和 debts 数据
        // 使用 Promise.all 来并行执行，提高效率
        const restorePromises = [];
        if (backupData.history !== undefined) {
             restorePromises.push(env.DB.put('history', JSON.stringify(backupData.history)));
        }
        if (backupData.debts !== undefined) {
             restorePromises.push(env.DB.put('debts', JSON.stringify(backupData.debts)));
        }

        await Promise.all(restorePromises);
        
        console.log(`从文件 ${fileName} 的恢复操作已成功完成。`);
    } catch (err) {
        console.error(`从文件 ${fileName} 恢复数据时发生严重错误:`, err);
    }
}


// --- 模块三: CORS 辅助功能 (来自您的 worker.js) ---

// For production, you might want to restrict this to your app's domain
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // 在生产环境中建议替换为您的前端域名, 例如: 'https://your-domain.pages.dev'
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function handleOptions(request) {
    if (
        request.headers.get('Origin') !== null &&
        request.headers.get('Access-Control-Request-Method') !== null &&
        request.headers.get('Access-Control-Request-Headers') !== null
    ) {
        // Handle CORS preflight requests.
        return new Response(null, { headers: corsHeaders });
    } else {
        // Handle standard OPTIONS request.
        return new Response(null, { headers: { Allow: 'GET, POST, OPTIONS' } });
    }
}
