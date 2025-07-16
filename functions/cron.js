/*
 * =================================================================
 *         E7 统一记账系统 - 专用计划任务触发器
 *
 *  文件名: functions/cron.js
 *  职责:
 *  1. 唯一的 onScheduled 入口: 响应 wrangler.toml 中的 Cron 配置。
 *  2. 任务委托: 调用 backup.js 中的独立备份逻辑来完成实际工作。
 * =================================================================
 */
import { runBackupTask } from './backup.js'; // [重要] 导入备份任务函数

/**
 * 计划任务触发器 (Cron Trigger)
 * Cloudflare 的调度器会调用此函数。
 */
export async function onScheduled(context) {
    console.log("专用cron.js文件: onScheduled 触发器被调用，准备执行备份任务...");
    // 调用我们从 backup.js 导入的独立函数
    await runBackupTask(context);
}
