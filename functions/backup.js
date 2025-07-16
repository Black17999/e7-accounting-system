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
// 导出一个可重用的函数，而不是一个HTTP处理器
export async function runBackupTask(context) {
  console.log("正在执行独立的 runBackupTask 逻辑...");
 
  const { env, waitUntil } = context;
  const heartbeatUrl = env.HEARTBEAT_URL;
 
  try {
    console.log("1/4: 开始从KV读取数据...");
    const historyPromise = env.DB.get('history', { type: 'json' });
    const debtsPromise = env.DB.get('debts', { type: 'json' });
    const [history, debts] = await Promise.all([historyPromise, debtsPromise]);
    console.log("✓ KV数据读取完成。");
 
    const backupData = {
      backupTimestampUTC: new Date().toISOString(),
      trigger: 'onScheduled', // 触发类型
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
  } catch (err) {
    console.error('自动备份过程中发生严重错误:', err.message, err.stack);
    
    if (heartbeatUrl) {
        waitUntil(fetch(`${heartbeatUrl}/fail`,{ method: 'POST', body: err.message }).catch(e => console.error("发送失败心跳时出错:", e.message)));
        console.log("已发送失败心跳信号。");
    }
  }
}
