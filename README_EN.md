# 🧾 E7 Chess Room Accounting System

<div align="center">

[![E7 Accounting System](https://img.shields.io/badge/💰-E7%20Accounting%20System-blue)](#)
[![Vue.js](https://img.shields.io/badge/💚-Vue.js-green)](#)
[![PWA](https://img.shields.io/badge/📱-PWA-orange)](#)
[![Cloudflare](https://img.shields.io/badge/☁️-Cloudflare-yellow)](#)

</div>

---

## Language Selection

- [中文](README.md) • [English](README_EN.md)

---

## 📖 Project Overview

**E7 Chess Room Accounting System** is a modern accounting solution designed specifically for chess rooms. This system features an intuitive user interface, powerful data synchronization capabilities, and offline support to help you easily manage daily income and expense records.

---

## 📸 Application Preview

![Application Preview](assets/preview.png)

---

## ✨ Key Features

- 📱 **Responsive Design** - Perfectly adapts to mobile and tablet devices
- 🌐 **PWA Support** - Can be installed as a native app with offline support
- 💾 **Data Synchronization** - Automatically syncs data between cloud and local storage
- 📊 **Statistical Analysis** - Provides detailed income/expense statistics and chart visualization
- 🎤 **Voice Recognition** - Supports voice-activated quick accounting
- 🌙 **Dark Mode** - Protects your eyes with comfortable night-time usage
- 📸 **Screenshot Sharing** - One-click generation of accounting record images
- 🧮 **Debt Management** - Intelligent calculation and tracking of debt situations

---

## 🏗️ System Architecture

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

## 🛠️ Tech Stack

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

## 🚀 Installation & Deployment

### Local Development

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

### Deploy to Cloudflare

1. Create a Pages project in the Cloudflare dashboard
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `npm run build` (if needed)
   - Output directory: `/`
4. Add environment variables:
   - `DB`: KV namespace binding
   - `DB_BACKUPS`: R2 bucket binding

---

## 📚 Usage Guide

### Accounting Features

1. **Add Income** - Click the bottom "+" button and select the income icon
2. **Add Expense** - Click the bottom "+" button and select the expense icon
3. **Voice Accounting** - Click the microphone icon at the bottom and speak accounting commands
4. **Edit Records** - Swipe left/right on a record item and click the edit button
5. **Delete Records** - Swipe left/right on a record item and click the delete button

### Debt Management

1. **Add Debt** - Enter name and expression on the debt page
2. **Update Debt** - Click on a debt item to edit
3. **Delete Debt** - Swipe left/right on a debt item and click the delete button

### Statistical Analysis

1. **View Statistics** - Click the statistics icon at the bottom
2. **Switch Time Range** - Use weekly view, monthly view, or custom dates
3. **View Charts** - Click on the chart area to view in full screen

---

## 🔧 Development Notes

### Project Structure

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
├── assets/             # Assets folder
│   ├── icon-192.png    # App icon
│   ├── icon-512.png    # App icon
│   └── preview.png     # Preview image
└── README_EN.md        # Project documentation
```

### Core Modules

1. **Data Sync Module** - Handles online/offline data synchronization
2. **Accounting Module** - Manages income and expense records
3. **Debt Module** - Manages debt calculation and tracking
4. **Statistics Module** - Generates charts and statistical data
5. **UI Module** - Handles user interface and interactions

---

## 🤝 Contributing

Contributions of any kind are welcome! Please follow these steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

## 👤 Author

**Black17999**

- GitHub: [@Black17999](https://github.com/Black17999)
- Project Link: [https://github.com/Black17999/e7-accounting-system](https://github.com/Black17999/e7-accounting-system)

---

<div align="center">

### 🙏 Thank you for using E7 Chess Room Accounting System!

</div>
