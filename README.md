# 🧾 E7棋牌室记账系统 | E7 Chess Room Accounting System

<div align="center">

[![E7 Accounting System](https://img.shields.io/badge/💰-E7%20Accounting%20System-blue)](#)
[![Vue.js](https://img.shields.io/badge/💚-Vue.js-green)](#)
[![PWA](https://img.shields.io/badge/📱-PWA-orange)](#)
[![Cloudflare](https://img.shields.io/badge/☁️-Cloudflare-yellow)](#)

</div>

---

## 🌐 语言选择 | Language

- [中文](#-e7棋牌室记账系统) • [English](#-e7-chess-room-accounting-system)

---

## 📖 项目简介 | Project Overview

<div align="center">

### 🇨🇳 中文版本

**E7棋牌室记账系统** 是一个专为棋牌室设计的现代化记账解决方案。该系统具有直观的用户界面、强大的数据同步功能和离线支持，帮助您轻松管理日常收支记录。

### 🇬🇧 English Version

**E7 Chess Room Accounting System** is a modern accounting solution designed specifically for chess rooms. This system features an intuitive user interface, powerful data synchronization capabilities, and offline support to help you easily manage daily income and expense records.

</div>

---

## ✨ 主要特性 | Key Features

### 🇨🇳 中文版本

- 📱 **响应式设计** - 完美适配手机和平板设备
- 🌐 **PWA支持** - 可安装为原生应用，支持离线使用
- 💾 **数据同步** - 自动在云端和本地之间同步数据
- 📊 **统计分析** - 提供详细的收支统计和图表展示
- 🎤 **语音识别** - 支持语音快速记账
- 🌙 **暗黑模式** - 保护您的眼睛，夜间使用更舒适
- 📸 **截图分享** - 一键生成记账记录图片
- 🧮 **债务管理** - 智能计算和跟踪债务情况

### 🇬🇧 English Version

- 📱 **Responsive Design** - Perfectly adapts to mobile and tablet devices
- 🌐 **PWA Support** - Can be installed as a native app with offline support
- 💾 **Data Synchronization** - Automatically syncs data between cloud and local storage
- 📊 **Statistical Analysis** - Provides detailed income/expense statistics and chart visualization
- 🎤 **Voice Recognition** - Supports voice-activated quick accounting
- 🌙 **Dark Mode** - Protects your eyes with comfortable night-time usage
- 📸 **Screenshot Sharing** - One-click generation of accounting record images
- 🧮 **Debt Management** - Intelligent calculation and tracking of debt situations

---

## 🏗️ 系统架构 | System Architecture

### 🇨🇳 中文版本

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

### 🇬🇧 English Version

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Data Storage  │
│  (Vue.js PWA)   │◄──►│ (Cloudflare API)│◄──►│ (KV + R2)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Offline       │    │   Data Sync     │    │   Auto Backup   │
│ (LocalStorage)  │    │ (Online/Offline)│    │ (Scheduled)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🛠️ 技术栈 | Tech Stack

### 🇨🇳 中文版本

- **前端框架**: Vue.js 2.6
- **样式**: CSS3 + Flexbox
- **图标**: Font Awesome 6.4
- **图表**: Chart.js 3.9
- **截图**: html2canvas 1.4
- **后端**: Cloudflare Pages Functions
- **数据库**: Cloudflare KV
- **存储**: Cloudflare R2
- **部署**: Cloudflare Pages

### 🇬🇧 English Version

- **Frontend Framework**: Vue.js 2.6
- **Styling**: CSS3 + Flexbox
- **Icons**: Font Awesome 6.4
- **Charts**: Chart.js 3.9
- **Screenshot**: html2canvas 1.4
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare KV
- **Storage**: Cloudflare R2
- **Deployment**: Cloudflare Pages

---

## 🚀 安装与部署 | Installation & Deployment

### 🇨🇳 中文版本

#### 本地开发 | Local Development

1. 克隆项目仓库
```bash
git clone https://github.com/Black17999/e7-accounting-system.git
cd e7-accounting-system
```

2. 启动本地开发服务器
```bash
# 使用任何静态服务器工具
npx serve
# 或者使用 Python
python -m http.server 8000
```

3. 访问应用
打开浏览器访问 `http://localhost:8000`

#### 部署到Cloudflare | Deploy to Cloudflare

1. 在Cloudflare仪表板中创建Pages项目
2. 连接您的GitHub仓库
3. 配置构建设置：
   - 构建命令: `npm run build` (如果需要)
   - 输出目录: `/`
4. 添加环境变量：
   - `DB`: KV命名空间绑定
   - `DB_BACKUPS`: R2存储桶绑定

### 🇬🇧 English Version

#### Local Development

1. Clone the repository
```bash
git clone https://github.com/Black17999/e7-accounting-system.git
cd e7-accounting-system
```

2. Start the local development server
```bash
# Using any static server tool
npx serve
# Or using Python
python -m http.server 8000
```

3. Access the application
Open your browser and visit `http://localhost:8000`

#### Deploy to Cloudflare

1. Create a Pages project in the Cloudflare dashboard
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `npm run build` (if needed)
   - Output directory: `/`
4. Add environment variables:
   - `DB`: KV namespace binding
   - `DB_BACKUPS`: R2 bucket binding

---

## 📚 使用指南 | Usage Guide

### 🇨🇳 中文版本

#### 记账功能 | Accounting Features

1. **添加收入** - 点击底部"+"按钮，选择收入图标
2. **添加支出** - 点击底部"+"按钮，选择支出图标
3. **语音记账** - 点击底部麦克风图标，说出记账指令
4. **编辑记录** - 左右滑动记录项，点击编辑按钮
5. **删除记录** - 左右滑动记录项，点击删除按钮

#### 债务管理 | Debt Management

1. **添加债务** - 在债务页面输入姓名和表达式
2. **更新债务** - 点击债务项进行编辑
3. **删除债务** - 左右滑动债务项，点击删除按钮

#### 统计分析 | Statistical Analysis

1. **查看统计** - 点击底部统计图标
2. **切换时间范围** - 使用周视图、月视图或自定义日期
3. **查看图表** - 点击图表区域可全屏查看

### 🇬🇧 English Version

#### Accounting Features

1. **Add Income** - Click the bottom "+" button and select the income icon
2. **Add Expense** - Click the bottom "+" button and select the expense icon
3. **Voice Accounting** - Click the microphone icon at the bottom and speak accounting commands
4. **Edit Records** - Swipe left/right on a record item and click the edit button
5. **Delete Records** - Swipe left/right on a record item and click the delete button

#### Debt Management

1. **Add Debt** - Enter name and expression on the debt page
2. **Update Debt** - Click on a debt item to edit
3. **Delete Debt** - Swipe left/right on a debt item and click the delete button

#### Statistical Analysis

1. **View Statistics** - Click the statistics icon at the bottom
2. **Switch Time Range** - Use weekly view, monthly view, or custom dates
3. **View Charts** - Click on the chart area to view in full screen

---

## 🔧 开发说明 | Development Notes

### 🇨🇳 中文版本

#### 项目结构 | Project Structure

```
e7-accounting-system/
├── index.html          # 主页面
├── main.js             # Vue应用主文件
├── style.css           # 样式文件
├── sw.js               # Service Worker
├── manifest.json       # PWA配置文件
├── splash.html         # 启动页
├── splash.css          # 启动页样式
├── functions/          # Cloudflare Functions
│   └── api/
│       └── [[path]].js # API处理函数
├── wrangler.toml       # 部署配置文件
├── icon-192.png        # 应用图标
├── icon-512.png        # 应用图标
└── README.md           # 项目说明文件
```

#### 核心功能模块 | Core Modules

1. **数据同步模块** - 处理在线/离线数据同步
2. **记账模块** - 管理收入和支出记录
3. **债务模块** - 管理债务计算和跟踪
4. **统计模块** - 生成图表和统计数据
5. **UI模块** - 处理用户界面和交互

### 🇬🇧 English Version

#### Project Structure

```
e7-accounting-system/
├── index.html          # Main page
├── main.js             # Vue app main file
├── style.css           # Stylesheet
├── sw.js               # Service Worker
├── manifest.json       # PWA configuration file
├── splash.html         # Splash screen
├── splash.css          # Splash screen styles
├── functions/          # Cloudflare Functions
│   └── api/
│       └── [[path]].js # API handler functions
├── wrangler.toml       # Deployment configuration file
├── icon-192.png        # App icon
├── icon-512.png        # App icon
└── README.md           # Project documentation
```

#### Core Modules

1. **Data Sync Module** - Handles online/offline data synchronization
2. **Accounting Module** - Manages income and expense records
3. **Debt Module** - Manages debt calculation and tracking
4. **Statistics Module** - Generates charts and statistical data
5. **UI Module** - Handles user interface and interactions

---

## 🤝 贡献 | Contributing

### 🇨🇳 中文版本

欢迎任何形式的贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 🇬🇧 English Version

Contributions of any kind are welcome! Please follow these steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 许可证 | License

### 🇨🇳 中文版本

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

### 🇬🇧 English Version

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

## 👤 作者 | Author

**Black17999**

- GitHub: [@Black17999](https://github.com/Black17999)
- 项目链接: [https://github.com/Black17999/e7-accounting-system](https://github.com/Black17999/e7-accounting-system)

---

<div align="center">

### 🙏 感谢使用 E7 棋牌室记账系统！ | Thank you for using E7 Chess Room Accounting System!

</div>
