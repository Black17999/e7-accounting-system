/**
 * =================================================================
 *          E7 统一记账系统 - 自动备份计划任务
 * 
 *  文件名: functions/backup.js
 *  职责: 
 *  1. 响应由 wrangler.toml 中 crons 定义的计划任务。
 *  2. 从 KV (DB) 读取数据。
 *  3. 将数据备份到 R2 (DB_BACKUPS)。
 *  4. 向 Healthchecks.io (HEARTBEAT_URL) 发送心跳信号。
 * 
 *  这是一个独立的、职责单一的模块，专用于自动化后台任务。
 *
 * *  触发方式: 
 *  本文件由 wrangler.toml 中定义的 cron 触发器通过模拟 HTTP 请求到 /backup 路径来调用。
 *  因此，它导出 onRequest 函数，而不是 onScheduled。
 * =================================================================
 */

/**
 * Cloudflare Pages 会在 `wrangler.toml` 定义的 Cron 时间自动调用此函数。
 * @param {object} context - 函数上下文，包含env(环境变量和绑定)和waitUntil等。
 */
export async function onRequest(context) {
  console.log("通过模拟请求 /backup 触发自动备份任务...");
 
  // 从上下文中安全地获取环境变量和绑定
  // onRequest 的 context 对象同样包含 env 和 waitUntil
  const { env, waitUntil } = context;
 
  const heartbeatUrl = env.HEARTBEAT_URL;
 
  // 完整的备份逻辑与之前完全相同
  try {
    console.log("1/4: 开始从KV读取数据...");
    const historyPromise = env.DB.get('history', { type: 'json' });
    const debtsPromise = env.DB.get('debts', { type: 'json' });
    const [history, debts] = await Promise.all([historyPromise, debtsPromise]);
    console.log("✓ KV数据读取完成。");
 
    const backupData = {
      backupTimestampUTC: new Date().toISOString(),
      trigger: 'scheduled_http', // 标记为通过模拟HTTP请求触发
      history: history || {},
      debts: debts || [],
    };
 
    const utcDateString = new Date().toISOString().split('T')[0];
    const fileName = `backup-${utcDateString}.json`;
    console.log(`2/4: 准备写入R2，文件名为: ${fileName}`);
 
    await env.DB_BACKUPS.put(fileName, JSON.stringify(backupData, null, 2));
    console.log(`✓ 备份成功！文件已保存至R2: ${fileName}`);
 
    if (heartbeatUrl) {
      waitUntil(fetch(heartbeatUrl).catch(e => console.error("发送成功心跳时出错:", e.message)));
      console.log("✓ 已成功发送心跳信号。");
    } else {
      console.warn("警告：未配置HEARTBEAT_URL环境变量，跳过发送心跳。");
    }
    
    console.log("4/4: 自动备份任务圆满完成。");
    // [重要] 作为HTTP请求的响应，我们必须返回一个 Response 对象
    return new Response("Backup task completed successfully.", { status: 200 });
 
  } catch (err) {
    console.error('自动备份过程中发生严重错误:', err.message, err.stack);
    
    if (heartbeatUrl) {
        waitUntil(fetch(`${heartbeatUrl}/fail`,{ method: 'POST', body: err.message }).catch(e => console.error("发送失败心跳时出错:", e.message)));
        console.log("已发送失败心死信号。");
    }
    
    // 返回一个表示错误的 Response 对象
    return new Response(`Backup task failed: ${err.message}`, { status: 500 });
  }
}
