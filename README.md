# e7-accounting-system
# E7 记账系统 AI 助手指南

这是一个基于 Vue.js 的单页面记账应用，具有在线/离线同步功能。以下是关键信息，帮助你快速理解和开发此项目。

## 项目架构

### 前端 (SPA)
- 主要文件: `index.html`、`main.js`、`style.css`
- 使用 Vue.js 构建，无需构建工具
- PWA 支持：`manifest.json`、`sw.js`(Service Worker)

### 后端 (Serverless)
- 基于 Cloudflare Pages Functions
- 入口: `functions/api/[[path]].js`
- 主要功能:
  - `/api/data`: GET/POST 数据同步
  - `/api/run-backup-now`: 手动备份
  - `/api/restore-from-backup`: 恢复备份

## 核心数据流

1. 数据结构
```js
{
  history: {
    "YYYY-MM-DD": {
      incomes: [{amount: number, id: string}],
      expenses: [{name: string, amount: number, id: string}]
    }
  },
  debts: [{name: string, calculation: string, result: number}]
}
```

2. 数据同步机制:
- `loadData()`: 启动时加载数据
- `scheduleSave()`: 延迟1.5秒自动保存
- `saveDataToCloud()`: 同步到云端
- `saveDataToLocal()`: 离线备份
- 自动在线/离线模式切换

## 关键开发模式

### 编辑记录
```js
// 添加记录示例
addIncome(amount)
addExpense({name, amount})

// 编辑记录示例
saveRecord(editRecord: {type, index, name?, amount})
```

### 日期操作
```js
// 切换日期
changeDate(sync = true) // sync: 是否先保存当前视图
loadRecordsForDate(dateKey) // 加载指定日期记录
```

### 债务计算
```js
// 添加/更新债务
addOrUpdateDebt({name, expression})
calculateExpression(expression) // 计算债务表达式结果
```

## 重要约定

1. ID 生成规则:
```js
id = type + '_' + Date.now() + Math.random()
// type: 'income' 或 'expense'
```

2. 日期格式:
- 存储: `YYYY-MM-DD`
- 显示: `YYYY年MM月DD日 星期X`

3. 数据验证:
- 收入/支出金额必须为有效数字
- 支出必须包含名称
- 债务必须包含名称和有效表达式

## 调试提示

1. 网络问题排查:
- 检查 `isOffline` 状态
- 查看 localStorage 是否有待同步数据
- 网络请求超时默认为 8 秒

2. 数据同步问题:
- 确保 `syncCurrentViewToHistory()` 在切换日期前调用
- 使用 `normalizeDataIds()` 确保所有记录有唯一ID

3. Service Worker:
- 开发时可通过控制台检查注册状态
- 新版本激活时会提示用户刷新

## 扩展开发

添加新功能时建议:

1. 在现有模块中扩展:
- 收支记录管理: `main.js` (230-450行)
- 债务管理: `main.js` (450-520行)
- 统计分析: `main.js` (550-650行)

2. 保持数据同步模式:
- 使用 `scheduleSave()` 触发保存
- 维护在线/离线状态一致性
- 遵循既有的数据结构

## 部署流程

1. Cloudflare Pages 部署:
- 将代码推送到 GitHub 仓库
- 在 Cloudflare Pages 中配置部署
- 环境变量配置:
  - `DB`: KV 命名空间绑定
  - `R2_BUCKET`: R2 存储桶绑定
  - `HEARTBEAT_URL`: 心跳检测 URL

2. 自动备份配置:
- 在 Pages 项目设置中配置 Cron 触发器
- 默认每日执行 `scheduled()` 函数
- 备份保存在 R2 存储桶中

## 测试策略

1. 功能测试重点:
- 收支记录的增删改查
- 债务计算的准确性
- 日期切换和数据同步
- 离线模式的数据持久化

2. 网络弹性测试:
- 在线/离线切换场景
- 网络延迟和超时处理
- 数据冲突解决

3. UI/UX 测试关注点:
- 移动端适配
- PWA 功能完整性
- 动画流畅度

## 安全考虑

1. 数据安全:
- 使用 localStorage 加密存储敏感数据
- 定期备份重要数据
- R2 存储访问控制

2. API 安全:
- 所有请求使用 HTTPS
- 实施适当的 CORS 策略
- 请求频率限制

3. 错误处理:
- 妥善处理和记录错误
- 避免暴露敏感信息
- 提供用户友好的错误提示

