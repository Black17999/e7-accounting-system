<div align="center">

# 🧾 E7棋牌室记账系统

[![E7 Accounting System](https://img.shields.io/badge/💰-E7%20Accounting%20System-blue)](#)
[![Vue.js](https://img.shields.io/badge/💚-Vue.js-green)](#)
[![PWA](https://img.shields.io/badge/📱-PWA-orange)](#)
[![Cloudflare](https://img.shields.io/badge/☁️-Cloudflare-yellow)](#)

</div>

---

<div align="center">

## 语言选择 | Language

- [中文](README.md) • [English](README_EN.md)

</div>

---

## 📖 项目简介

**E7棋牌室记账系统** 是一个专为棋牌室设计的现代化记账解决方案。该系统具有直观的用户界面、强大的数据同步功能和离线支持，帮助您轻松管理日常收支记录。

---

## 🚀 功能更新

本次更新带来了多项重要改进：

- **核心记账功能代码重构**：优化了记账流程的底层代码，提升了性能和稳定性。
- **导航栏标签布局优化**：合并了部分冗余的导航标签项，使导航更加简洁高效。
- **新增数据管理模块**：引入了强大的数据管理功能，方便用户进行数据的导入、导出和批量处理。

---

## 📸 应用预览

<div align="center">
  <img src="./assets/开屏动画.jpg" width="300" alt="开屏动画">
  <img src="./assets/首页.jpg" width="300" alt="首页">
  <img src="./assets/我的.jpg" width="300" alt="我的">
  <img src="./assets/统计.jpg" width="300" alt="统计">
</div>

---

## ✨ 主要特性

- 📱 **响应式设计** - 完美适配手机和平板设备
- 🌐 **PWA支持** - 可安装为原生应用，支持离线使用
- 💾 **数据同步** - 自动在云端和本地之间同步数据
- 📊 **统计分析** - 提供详细的收支统计和图表展示
- 🎤 **语音识别** - 支持语音快速记账
- 🌙 **暗黑模式** - 保护您的眼睛，夜间使用更舒适
- 📸 **截图分享** - 一键生成记账记录图片
- 🧮 **债务管理** - 智能计算和跟踪债务情况
- 🗄️ **数据管理** - 支持数据导入导出及批量操作

---

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用       │    │   后端服务       │    │   数据存储       │
│  (Vue.js PWA)   │◄──►│ (Cloudflare API)│◄──►│ (KV + R2)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   离线支持       │    │   数据同步       │    │   自动备份       │
│ (LocalStorage)  │    │ (Online/Offline)│    │ (Scheduled)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🛠️ 技术栈

- **前端框架**: Vue.js 2.6
- **样式**: CSS3 + Flexbox
- **图标**: Font Awesome 6.4
- **图表**: Chart.js 3.9
- **截图**: html2canvas 1.4
- **后端**: Cloudflare Pages Functions
- **数据库**: Cloudflare KV
- **存储**: Cloudflare R2
- **部署**: Cloudflare Pages

---

## 🚀 安装与部署

### 依赖项

- **Node.js**: 请确保已安装 Node.js (推荐 LTS 版本)。
- **npm/yarn**: Node.js 包管理器，用于安装项目依赖。
- **Cloudflare CLI (可选)**: 如果您计划部署到 Cloudflare Pages，建议安装 Cloudflare CLI (`npm install -g @cloudflare/wrangler`)。

### 本地开发

1.  **克隆项目仓库**:
    ```bash
    git clone https://github.com/Black17999/e7-accounting-system.git
    cd e7-accounting-system
    ```
2.  **安装依赖**:
    ```bash
    npm install
    # 或者使用 yarn
    # yarn install
    ```
3.  **启动本地开发服务器**:
    ```bash
    # 使用 serve (如果未安装，请先全局安装: npm install -g serve)
    npx serve
    # 或者使用 Python 内置服务器 (Python 3)
    # python -m http.server 8000
    ```
4.  **访问应用**:
    在浏览器中打开 `http://localhost:8000` (或 serve 提供的端口)。

### 部署到Cloudflare

1.  在Cloudflare仪表板中创建Pages项目。
2.  连接您的GitHub仓库。
3.  配置构建设置：
    *   构建命令: `npm run build` (如果项目需要构建步骤)
    *   输出目录: `/` (或您的构建输出目录)
4.  添加环境变量：
    *   `DB`: KV命名空间绑定
    *   `DB_BACKUPS`: R2存储桶绑定

---

## 📚 使用指南

### 记账功能

1.  **添加收入** - 点击底部"+"按钮，选择收入图标。
2.  **添加支出** - 点击底部"+"按钮，选择支出图标。
3.  **语音记账** - 点击底部麦克风图标，说出记账指令。
4.  **编辑记录** - 左右滑动记录项，点击编辑按钮。
5.  **删除记录** - 左右滑动记录项，点击删除按钮。

### 债务管理

1.  **添加债务** - 在债务页面输入姓名和表达式。
2.  **更新债务** - 点击债务项进行编辑。
3.  **删除债务** - 左右滑动债务项，点击删除按钮。

### 统计分析

1.  **查看统计** - 点击底部统计图标。
2.  **切换时间范围** - 使用周视图、月视图或自定义日期。
3.  **查看图表** - 点击图表区域可全屏查看。

### 数据管理 (新增)

1.  **数据导入** - 在数据管理页面，选择本地文件进行导入。
2.  **数据导出** - 选择需要导出的数据范围，点击导出按钮生成文件。
3.  **批量操作** - 支持对多条记录进行批量删除或修改。

---

## 🔧 开发说明

### 项目结构

```
e7-accounting-system/
├── index.html          # 主页面
├── main-modular.js     # Vue应用主文件 (模块化)
├── style.css           # 样式文件
├── sw.js               # Service Worker
├── manifest.json       # PWA配置文件
├── splash.html         # 启动页
├── splash.css          # 启动页样式
├── functions/          # Cloudflare Functions
│   └── api/
│       └── [[path]].js # API处理函数
├── wrangler.toml       # 部署配置文件
├── assets/             # 资源文件夹
│   ├── icon-192.png    # 应用图标
│   ├── icon-512.png    # 应用图标
│   ├── 开屏动画.jpg    # 启动页截图
│   ├── 首页.jpg        # 主页截图
│   ├── 我的.jpg        # 我的页面截图
│   └── 统计.jpg        # 统计页面截图
└── README.md           # 项目说明文件
```

### 核心功能模块

1.  **数据同步模块** - 处理在线/离线数据同步。
2.  **记账模块** - 管理收入和支出记录。
3.  **债务模块** - 管理债务计算和跟踪。
4.  **统计模块** - 生成图表和统计数据。
5.  **UI模块** - 处理用户界面和交互。
6.  **数据管理模块** - 提供数据导入、导出和批量处理功能。

---

## ❓ 常见问题解答 (FAQ)

**Q: 如何安装项目依赖？**
A: 在项目根目录下运行 `npm install` 或 `yarn install`。

**Q: 如何启动本地开发服务器？**
A: 运行 `npx serve` 或使用 Python 的 `python -m http.server 8000`。

**Q: 新增的数据管理模块如何使用？**
A: 请参考“使用指南”中的“数据管理”章节，了解如何导入、导出数据以及进行批量操作。

**Q: 如果遇到部署问题怎么办？**
A: 请检查 Cloudflare 的构建日志和环境变量配置，确保正确性。如有疑问，可查阅 Cloudflare Pages 文档。

---

## 🤝 贡献

欢迎任何形式的贡献！请遵循以下步骤：

1.  Fork 项目
2.  创建功能分支 (`git checkout -b feature/AmazingFeature`)
3.  提交更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
