/**
 * 这是Cloudflare Pages项目的后端计划任务函数。
 * 它会在wrangler.toml中定义的时间被自动触发。
 * @param {object} context - 函数上下文，包含env等环境变量
 */
export async function onScheduled(context) {
  console.log("开始执行每日KV->R2备份任务 (Cloudflare Pages Function)...");

  // 从环境变量中安全地获取绑定
  const { env } = context;

  try {
    // 1. 从KV中读取数据
    // 使用Promise.all并行获取，提高效率
    const historyPromise = env.DB.get('history', { type: 'json' });
    const debtsPromise = env.DB.get('debts', { type: 'json' });

    const [history, debts] = await Promise.all([historyPromise, debtsPromise]);

    // 2. 准备备份数据对象
    // [重要] 这里进行了健壮性处理，如果KV中没有数据（返回null），则使用空对象{}
    // 这将彻底解决您截图中的 "Cannot read properties of undefined" 错误。
    const backupData = {
      backupTimestampUTC: new Date().toISOString(),
      history: history || {},
      debts: debts || [], // 假设debts是一个数组
    };

    // 3. 生成基于UTC日期的文件名 (例如: "backup-2024-07-15.json")
    // Cloudflare所有操作都基于UTC，使用UTC日期作为文件名是最可靠的做法。
    const utcDateString = new Date().toISOString().split('T')[0];
    const fileName = `backup-${utcDateString}.json`;

    // 4. 将备份数据写入R2存储桶
    await env.DB_BACKUPS.put(fileName, JSON.stringify(backupData, null, 2));

    console.log(`备份成功！文件已保存至R2: ${fileName}`);

    // 5. 发送心跳信号到 Healthchecks.io
    // 我们从环境变量中获取URL，而不是硬编码
    if (env.HEALTHCHECK_URL) {
      // 使用context.waitUntil确保即使主函数返回，这个请求也能完成
      context.waitUntil(fetch(env.HEALTHCHECK_URL).catch(e => console.error("心跳发送失败:", e)));
      console.log("已成功发送心跳信号。");
    } else {
      console.warn("未配置HEALTHCHECK_URL环境变量，跳过心跳发送。");
    }

  } catch (err) {
    console.error('备份过程中发生严重错误:', err);
    // 如果发生错误，心跳信号不会被发送，Healthchecks.io就会在宽限期后报警
    // 可以在这里集成更主动的错误上报，比如发送一个失败信号
    if (env.HEALTHCHECK_URL) {
        context.waitUntil(fetch(`${env.HEALTHCHECK_URL}/fail`).catch(e => console.error("发送失败心跳时出错:", e)));
    }
  }
}
