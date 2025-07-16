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
 * =================================================================
 */

/**
 * Cloudflare Pages 会在 `wrangler.toml` 定义的 Cron 时间自动调用此函数。
 * @param {object} context - 函数上下文，包含env(环境变量和绑定)和waitUntil等。
 */
export async function onScheduled(context) {
  console.log("准备执行自动备份任务 (onScheduled)...");

  // 从上下文中安全地获取环境变量和绑定
  const { env, waitUntil } = context;

  // 从环境变量中获取心跳URL，变量名与您在Pages设置中的名称匹配
  const heartbeatUrl = env.HEARTBEAT_URL;

  try {
    console.log("1/4: 开始从KV读取数据...");
    const historyPromise = env.DB.get('history', { type: 'json' });
    const debtsPromise = env.DB.get('debts', { type: 'json' });

    const [history, debts] = await Promise.all([historyPromise, debtsPromise]);
    console.log("✓ KV数据读取完成。");

    const backupData = {
      backupTimestampUTC: new Date().toISOString(),
      trigger: 'scheduled', // 标记为自动触发
      history: history || {}, // 如果KV为空，使用空对象，保证JSON结构完整
      debts: debts || [],     // 如果KV为空，使用空数组
    };

    const utcDateString = new Date().toISOString().split('T')[0];
    const fileName = `backup-${utcDateString}.json`;
    console.log(`2/4: 准备写入R2，文件名为: ${fileName}`);

    // 将备份数据写入R2存储桶，绑定名为 DB_BACKUPS
    await env.DB_BACKUPS.put(fileName, JSON.stringify(backupData, null, 2));
    console.log(`✓ 备份成功！文件已保存至R2: ${fileName}`);

    // 3/4: 检查并发送成功心跳信号
    if (heartbeatUrl) {
      // 使用waitUntil确保即使主函数提前返回，这个网络请求也能执行完毕
      waitUntil(fetch(heartbeatUrl).catch(e => console.error("发送成功心跳时出错:", e.message)));
      console.log("✓ 已成功发送心跳信号。");
    } else {
      console.warn("警告：未配置HEARTBEAT_URL环境变量，跳过发送心跳。");
    }
    
    console.log("4/4: 自动备份任务圆满完成。");

  } catch (err) {
    console.error('自动备份过程中发生严重错误:', err.message, err.stack);
    
    // 如果发生错误，尝试发送失败信号
    if (heartbeatUrl) {
        waitUntil(fetch(`${heartbeatUrl}/fail`,{ method: 'POST', body: err.message }).catch(e => console.error("发送失败心跳时出错:", e.message)));
        console.log("已发送失败心跳信号。");
    }
  }
}
