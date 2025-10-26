// 增强的 Service Worker 注册逻辑
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(registration => {
            console.log('ServiceWorker 注册成功，作用域: ', registration.scope);

            // --- 解决问题三：优化更新提示 ---
            let refreshing;
            // 监听 controllerchange 事件，一旦新的 SW 控制了页面，就刷新
            /*
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                window.location.reload();
                refreshing = true;
            });
            */

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    // 当新 SW 安装成功并等待激活时
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // 自动激活新 SW，而不是等待用户下次访问
                        // 这避免了"发现新版本"的确认框
                        newWorker.postMessage({ action: 'skipWaiting' });
                    }
                });
            });
        }).catch(error => {
            console.log('ServiceWorker 注册失败: ', error);
        });
    });
}

import { createTitleBadge } from '../components/TitleBadge.js';
import { createTotalDebtBadge } from '../components/TotalDebtBadge.js';
import { CategoryManager, BottomSheetCategoryPicker, SwipeCategoryPicker } from './modules/categoryManager.js';
import { SupabaseManager } from './modules/supabase.js';
import { SupabaseDataManager } from './modules/supabaseData.js';

// 模块化应用主类
class E7AccountingApp {
    constructor() {
        this.moduleLoader = null;
        this.dataManager = null;
        this.statisticsManager = null;
        this.tobaccoManager = null;
        this.uiManager = null;
        this.voiceRecognitionManager = null;
        this.categoryManager = null;
        this.supabaseManager = null;
        this.supabaseDataManager = null;
        
        // Vue 实例数据
        this.vueData = {
            // 基础数据
            incomes: [],
            expenses: [],
            newIncome: '',
            newExpense: { name: '', amount: '' },
            expenseOptions: ['矿泉水', '糖果', '纸巾', '洗手液', '擦手纸'],
            debts: [],
            defaultDebts: [
                { name: '卢总', calculation: '2020+2000-2020-60-1190+1160-610-320', result: 980, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '啊华', calculation: '500+1120-500-500', result: 620, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '胖子', calculation: '4640+520', result: 5160, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '吹毛', calculation: '1200', result: 1200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '啊涛', calculation: '600', result: 600, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: 'H', calculation: '600', result: 600, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '白毛', calculation: '2330-530-100-200-1000+860', result: 1360, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '小轩', calculation: '4045+220+100+30+470+100-60', result: 4905, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '阿福', calculation: '860', result: 860, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '老王', calculation: '1000', result: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '小吴', calculation: '1450', result: 1450, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '浩云', calculation: '2010-500', result: 1510, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '秋莲', calculation: '1640-640', result: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '李刚', calculation: '4820-2000+2620', result: 5440, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '阿光', calculation: '3850+1200', result: 5050, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '啊波', calculation: '4890+1230+3020', result: 9140, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '阿冯', calculation: '1500+930', result: 2430, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '老计', calculation: '3730-800', result: 2930, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '厨师', calculation: '100', result: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { name: '湖南佬', calculation: '2000', result: 2000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            ],
            newDebt: { name: '', expression: '' },
            editDebt: { index: -1, name: '', expression: '' },
            editRecord: { show: false, type: null, index: -1, title: '', name: '', amount: '' },
            
            // 日期相关
            currentDate: '',
            selectedDate: '',
            statsStartDate: '',
            statsEndDate: '',
            
            // 统计相关
            statistics: { totalIncome: 0, totalExpense: 0, netIncome: 0, avgDailyIncome: 0, chartData: [] },
            expenseBreakdown: [],
            expandedExpenseItem: null,
            
            // 烟草相关
            tobaccoRecords: [],
            tobaccoStats: [],
            tobaccoBrandHistory: [],
            tobaccoPeriodStart: null,
            tobaccoPeriodEnd: null,
            newTobaccoRecord: { date: new Date().toISOString().slice(0, 10), brand: '', quantity: 1, price: 0.00 },
            editTobaccoRecordData: { id: '', date: '', brand: '', quantity: 1, price: 0 },
            tobaccoPriceFocused: false,
            tobaccoPricePlaceholder: "0.00",
            
            // UI 状态
            isLoading: true,
            isOffline: false,
            activeView: 'records',
            fabActive: false,
            addModal: { show: false, type: 'income', title: '', amounts: [''] },
            editingIncomeCategory: { index: -1, value: '' },
            isChartModalVisible: false,
            infoModal: { show: false, title: '', content: '' },
            isListening: false,
            isDarkMode: false,
            dataLoaded: false,
            ui: null,
            
            // 滑动状态
            swipeState: { startX: 0, startY: 0, currentX: 0, swipingIndex: null, swipingType: null, directionLock: null },
            tobaccoSwipeState: { startX: 0, startY: 0, currentX: 0, swipingRecordId: null, directionLock: null },
            
            // 我的模块菜单状态
            myMenuActive: false,
            // 个人中心统计数据
            totalDays: 0,
            totalRecords: 0,
            // 用户信息
            user: {
                name: '尊贵的用户',
                avatar: 'assets/icon-192.png'
            }
        };
        
        this.init();
    }
    
    async init() {
        try {
            // 初始化 Supabase
            this.supabaseManager = new SupabaseManager();
            this.supabaseDataManager = new SupabaseDataManager(this.supabaseManager);
            
            // 检查登录状态
            const isAuthenticated = await this.supabaseManager.checkAuth();
            if (!isAuthenticated) {
                // 未登录，隐藏开屏页后跳转到登录页
                const splashScreen = document.getElementById('splash-screen');
                if (splashScreen) {
                    splashScreen.style.display = 'none';
                }
                window.location.href = '/auth.html';
                return;
            }
            
            console.log('用户已登录:', this.supabaseManager.getCurrentUser().email);
            
            // 初始化模块加载器
            const { ModuleLoader } = await import('./modules/moduleLoader.js');
            this.moduleLoader = new ModuleLoader();
            
            // 加载核心模块
            this.dataManager = await this.moduleLoader.loadModule('dataManager');
            // 将 Supabase 管理器传递给 dataManager
            this.dataManager.supabaseManager = this.supabaseManager;
            this.dataManager.supabaseDataManager = this.supabaseDataManager;
            
            this.uiManager = await this.moduleLoader.loadModule('ui');
            this.statisticsManager = await this.moduleLoader.loadModule('statistics');
            
            // 初始化分类管理器
            this.categoryManager = new CategoryManager();
            
            // 初始化日期
            this.initDates();
            
            // 初始化Vue应用
            this.initVueApp();
            
            // 加载暗黑模式设置
            this.uiManager.loadDarkMode();
            
            // 开屏页已在 index.html 中显示，这里不再重复显示
            // 初始化默认分类（首次登录）
            await this.supabaseDataManager.initializeDefaultCategories();
            
            // 加载数据
            await this.dataManager.loadData();
            
            // 初始化备份管理器和自动备份
            this.dataManager.initBackupManager();

            // 加载用户信息
            await this.loadUser();
            
            // 加载用户的自定义分类
            await this.loadCategories();
            
            // 更新Vue数据
            this.updateVueData();

            // 数据加载后，计算初始总记录数
            this.vueApp.calculateInitialTotalRecords();
            this.vueApp.updateProfileStatistics();
            
            // 加载当前日期的记录
            this.loadRecordsForDate(this.vueData.selectedDate);
            
            // 数据加载完成后隐藏开屏页，显示主应用
            setTimeout(() => {
                this.uiManager.hideSplashScreen();
            }, 800);
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            // 隐藏开屏页
            const splashScreen = document.getElementById('splash-screen');
            if (splashScreen) {
                splashScreen.style.display = 'none';
            }
            alert('应用初始化失败，请刷新页面重试');
        }
    }
    
    // 初始化日期
    initDates() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = weekdays[now.getDay()];
        
        this.vueData.currentDate = `${year}年${month}月${day}日 ${weekday}`;
        this.vueData.selectedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const range = this.statisticsManager.getCustomMonthDateRange();
        this.vueData.statsStartDate = range.startDate;
        this.vueData.statsEndDate = range.endDate;
    }
    
    // 格式化日期输入
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 更新Vue数据
    updateVueData() {
        this.vueData.debts = this.dataManager.debts;
        this.vueData.isOffline = this.dataManager.isOffline;
        this.vueData.isLoading = this.dataManager.isLoading;
        this.vueData.dataLoaded = this.dataManager.dataLoaded;
    }

    // 新增金额格式化工具
    formatCNY(n, opts = {}) {
      const { showPlus = false, maxFractionDigits = 2 } = opts;
      const v = Number(n) || 0;
      const isNeg = v < 0;
      const abs = Math.abs(v);
      const num = abs.toLocaleString('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxFractionDigits
      });
      const sign = isNeg ? '−' : (showPlus ? '+' : '');
      return { sign, num, cur: '元', isNeg, isPos: !isNeg && v > 0 };
    }

    // 加载用户信息（从云端加载）
    async loadUser() {
        try {
            // 从 Supabase 加载用户配置
            const profile = await this.supabaseDataManager.getUserProfile();
            this.vueData.user = {
                name: profile.display_name,
                avatar: profile.avatar
            };
            console.log('成功加载用户配置:', this.vueData.user);
        } catch (error) {
            console.error('加载用户配置失败:', error);
            // 使用默认值
            this.vueData.user = {
                name: '尊贵的用户',
                avatar: 'assets/icon-192.png'
            };
        }
    }

    // 加载用户的分类设置
    async loadCategories() {
        try {
            // 从数据库加载分类
            const categories = await this.supabaseDataManager.getCategories();
            
            // 获取代码中定义的预设分类
            const presetIncomeCategories = [
                { id: 'default', name: '默认', icon: 'fa-circle-dot', favorite: true, isDefault: true },
                { id: 'self-service', name: '自助', icon: 'fa-coins', favorite: true },
                { id: 'zhuanzhuan', name: '转转', icon: 'fa-exchange-alt', favorite: true },
                { id: 'mahjong', name: '麻将', icon: 'fa-dice', favorite: false },
                { id: 'poker', name: '扑克', icon: 'fa-diamond', favorite: false }
            ];
            
            const presetExpenseCategories = [
                { id: 'water', name: '矿泉水', icon: 'fa-tint', favorite: false },
                { id: 'candy', name: '糖果', icon: 'fa-candy-cane', favorite: false },
                { id: 'tissue', name: '纸巾', icon: 'fa-toilet-paper', favorite: false },
                { id: 'soap', name: '洗手液', icon: 'fa-pump-soap', favorite: false },
                { id: 'paper-towel', name: '擦手纸', icon: 'fa-hand-paper', favorite: false }
            ];
            
            // 检查并同步预设分类到云端
            const existingCategoryNames = new Set(categories.map(cat => `${cat.type}-${cat.name}`));
            const categoriesToAdd = [];
            
            // 检查进账预设分类
            for (const preset of presetIncomeCategories) {
                if (!existingCategoryNames.has(`income-${preset.name}`)) {
                    categoriesToAdd.push({ type: 'income', name: preset.name, isDefault: preset.isDefault || false });
                }
            }
            
            // 检查支出预设分类
            for (const preset of presetExpenseCategories) {
                if (!existingCategoryNames.has(`expense-${preset.name}`)) {
                    categoriesToAdd.push({ type: 'expense', name: preset.name, isDefault: true });
                }
            }
            
            // 批量添加缺失的预设分类到云端
            if (categoriesToAdd.length > 0) {
                console.log('正在同步预设分类到云端:', categoriesToAdd);
                for (const cat of categoriesToAdd) {
                    try {
                        await this.supabaseDataManager.addCategory(cat.type, cat.name, cat.isDefault);
                    } catch (error) {
                        console.error(`同步预设分类失败 ${cat.type}-${cat.name}:`, error);
                    }
                }
                // 重新加载分类
                const updatedCategories = await this.supabaseDataManager.getCategories();
                categories.length = 0;
                categories.push(...updatedCategories);
            }
            
            // 清空现有分类，准备从云端重建
            this.categoryManager.incomeCategories = [];
            this.categoryManager.expenseCategories = [];
            
            // 从云端数据重建分类列表
            categories.forEach(cat => {
                // 根据分类名称匹配对应的图标
                let icon = 'fa-circle-dot';
                if (cat.type === 'income') {
                    const preset = presetIncomeCategories.find(p => p.name === cat.name);
                    if (preset) icon = preset.icon;
                } else {
                    const preset = presetExpenseCategories.find(p => p.name === cat.name);
                    if (preset) icon = preset.icon;
                }
                
                const category = {
                    id: cat.id,
                    name: cat.name,
                    icon: icon,
                    favorite: false,
                    custom: !cat.is_default,
                    isDefault: cat.type === 'income' && cat.is_default
                };
                
                if (cat.type === 'income') {
                    this.categoryManager.incomeCategories.push(category);
                } else {
                    this.categoryManager.expenseCategories.push(category);
                }
            });
            
            console.log('成功加载并同步用户分类');
        } catch (error) {
            console.error('加载分类失败:', error);
        }
    }
    
    // 加载指定日期的记录
    loadRecordsForDate(dateKey) {
        const records = this.dataManager.loadRecordsForDate(dateKey);
        this.vueData.incomes = records.incomes;
        this.vueData.expenses = records.expenses;
    }
    
    // 初始化Vue应用
    initVueApp() {
        // 保存对管理器的引用
        const dataManager = this.dataManager;
        const uiManager = this.uiManager;
        const moduleLoader = this.moduleLoader;
        const app = this;
        
        this.vueData.ui = this.uiManager;

        // 创建Vue实例
        Vue.component('title-badge', {
            props: ['type', 'index', 'category', 'locale'],
            render(createElement) {
                return createElement('span', {
                    domProps: {
                        innerHTML: createTitleBadge(this.$props).outerHTML
                    }
                });
            },
            mounted() {
                const badge = createTitleBadge(this.$props);
                this.$el.replaceWith(badge);
                this.badgeEl = badge; // Store reference to the new element
            },
            watch: {
                // Watch for changes in the index prop
                index: function(newVal, oldVal) {
                    if (this.badgeEl && this.badgeEl.parentElement) {
                        const newBadge = createTitleBadge(this.$props);
                        this.badgeEl.replaceWith(newBadge);
                        this.badgeEl = newBadge; // Update the reference
                    }
                }
            }
        });

        Vue.component('total-debt-badge', {
            props: ['amount', 'onPress'],
            render(createElement) {
                return createElement('span', { // 使用 span 作为占位符
                    domProps: {
                        innerHTML: createTotalDebtBadge(this.$props).outerHTML
                    }
                });
            },
            mounted() {
                const badge = createTotalDebtBadge(this.$props);
                this.$el.replaceWith(badge);
                // 保存对新元素的引用，以便将来更新
                this.badgeEl = badge;
            },
            // 监听 amount 变化，更新组件
            watch: {
                amount: function(newVal, oldVal) {
                    // 确保 badgeEl 存在并且仍在 DOM 中
                    if (this.badgeEl && this.badgeEl.parentElement) {
                        const newBadge = createTotalDebtBadge(this.$props);
                        this.badgeEl.replaceWith(newBadge);
                        // 更新引用到最新的元素
                        this.badgeEl = newBadge;
                    }
                }
            }
        });

        this.vueApp = new Vue({
            el: '#app',
            data: this.vueData,
            computed: {
                totalIncome() {
                    if (!Array.isArray(this.incomes) || !Array.isArray(this.expenses)) return 0;
                    const incomeSum = this.incomes.reduce((sum, income) => sum + Number(income.amount), 0);
                    const expenseSum = this.expenses.reduce((sum, expense) => sum + Math.abs(Number(expense.amount)), 0);
                    return incomeSum - expenseSum;
                },
                totalDebtAmount() {
                    if (!Array.isArray(this.debts)) return 0;
                    return this.debts.reduce((sum, debt) => sum + Number(debt.result), 0);
                },
                totalTobaccoAmount() {
                    if (!Array.isArray(this.tobaccoStats)) return 0;
                    return this.tobaccoStats.reduce((sum, brand) => sum + brand.totalAmount, 0);
                },
                totalIncomeClass() {
                    const isDark = document.body.classList.contains('dark-mode');
                    if (this.totalIncome > 0) {
                        return isDark ? 'dark-positive-bg' : 'positive-income-bg';
                    } else if (this.totalIncome < 0) {
                        return isDark ? 'dark-negative-bg' : 'negative-income-bg';
                    }
                    return '';
                }
            },
            watch: {
                incomes: { handler() { this.scheduleSave(); }, deep: true },
                expenses: { handler() { this.scheduleSave(); }, deep: true },
                debts: { handler() { this.scheduleSave(); }, deep: true },
                statsStartDate: { handler() { this.loadStatistics(); } },
                statsEndDate: { handler() { this.loadStatistics(); } }
            },
            mounted() {
                this.setupEventListeners();
            },
            beforeDestroy() {
                this.cleanupEventListeners();
            },
            methods: {
                // 设置事件监听器
                setupEventListeners() {
                    if (window.matchMedia('(display-mode: standalone)').matches) {
                        document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
                        document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
                    }
                    
                    // 添加全局点击事件监听器
                    document.addEventListener('click', this.handleGlobalClick);

                },
                
                // 清理事件监听器
                cleanupEventListeners() {
                    document.removeEventListener('click', this.handleGlobalClick);
                },
                
                // 处理全局点击事件
                handleGlobalClick(event) {
                    // 处理FAB按钮状态
                    const fabButton = this.$el.querySelector('.fab');
                    const fabOptions = this.$el.querySelector('.fab-options');

                    if (this.fabActive && !fabButton.contains(event.target) && !fabOptions.contains(event.target)) {
                        this.toggleFab();
                    }
                },
                
                // 调度保存
                scheduleSave() {
                    if (this.isLoading) return;
                    clearTimeout(this.saveTimeout);
                    this.saveTimeout = setTimeout(() => {
                        this.saveData();
                    }, 1500);
                },
                
                // 保存数据
                async saveData() {
                    // 同步当前视图到历史记录
                    dataManager.syncCurrentViewToHistory(this.selectedDate, this.incomes, this.expenses);
                    
                    // 保存数据
                    if (this.isOffline) {
                        dataManager.saveDataToLocal();
                    } else {
                        await dataManager.saveDataToCloud();
                    }
                },
                
                // 加载统计数据
                async loadStatistics() {
                    if (!this.statisticsManager) {
                        this.statisticsManager = await moduleLoader.loadModule('statistics');
                    }
                    
                    const stats = this.statisticsManager.loadStatistics(
                        dataManager.history, 
                        this.statsStartDate, 
                        this.statsEndDate
                    );
                    
                    this.statistics = stats;
                    this.expenseBreakdown = this.statisticsManager.expenseBreakdown;
                    
                    // 渲染图表
                    this.$nextTick(() => {
                        this.statisticsManager.renderChart('statsChart');
                        this.statisticsManager.renderExpenseChart();
                    });
                },
                
                // 切换视图
                async changeView(viewName) {
                    this.activeView = viewName;

                    // 确保DOM更新后再执行滚动操作
                    this.$nextTick(() => {
                        const mainContent = this.$el.querySelector('.main-content');
                        if (mainContent) {
                            mainContent.scrollTop = 0;
                        }
                    });
                    
                    // 当切换到统计视图时，自动加载统计数据
                    if (viewName === 'stats') {
                        this.$nextTick(async () => {
                            this.loadStatistics();
                        });
                    }
                    
                    // 当切换到烟草视图时，加载烟草模块
                    if (viewName === 'tobacco') {
                        this.$nextTick(async () => {
                            if (!this.tobaccoManager) {
                                this.tobaccoManager = await moduleLoader.loadModule('tobacco');
                                this.tobaccoManager.initTobaccoPeriod();
                            }
                            
                            // 每次切换到烟草视图时，都重新加载统计数据并重置表单
                            this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                            this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                            this.tobaccoBrandHistory = this.tobaccoManager.tobaccoBrandHistory;
                            
                            this.tobaccoManager.resetNewTobaccoRecord();
                            this.newTobaccoRecord = { ...this.tobaccoManager.newTobaccoRecord };
                        });
                    } else if (viewName === 'profile') {
                        // 当切换到个人中心视图时，计算统计数据
                        this.$nextTick(() => {
                            this.updateProfileStatistics();
                        });
                    }
                },
                
                // 更新个人中心统计数据
                updateProfileStatistics() {
                    const allDates = Object.keys(dataManager.history);
                    this.totalDays = allDates.length;
                },

                // 初始计算总记录数
                calculateInitialTotalRecords() {
                    const allDates = Object.keys(dataManager.history);
                    let recordCount = 0;
                    for (const dateKey of allDates) {
                        const records = dataManager.history[dateKey];
                        if (records.incomes) {
                            recordCount += records.incomes.length;
                        }
                        if (records.expenses) {
                            recordCount += records.expenses.length;
                        }
                    }
                    this.totalRecords = recordCount;
                },
                
                // 添加记录
                async addRecord() {
                    const isNewDay = this.incomes.length === 0 && this.expenses.length === 0;
                    let addedCount = 0;
                    if (this.addModal.type === 'income') {
                        this.addModal.amounts.forEach(amount => {
                            const parsedAmount = parseFloat(amount);
                            if (!isNaN(parsedAmount)) {
                                const newIncome = {
                                    id: 'income_' + Date.now() + Math.random(),
                                    amount: parsedAmount,
                                    category: '默认' // 默认分类
                                };
                                this.incomes.push(newIncome);
                                addedCount++;
                            }
                        });
                    } else if (this.addModal.type === 'expense') {
                        const amount = parseFloat(this.addModal.amounts[0]);
                        if (isNaN(amount) || amount <= 0) {
                            alert('请输入有效的正数金额');
                            return;
                        }
                        // 修复：确保 newExpense.name 已被正确设置（从分类选择器中选择）
                        const expenseName = (this.newExpense.name || '').trim();
                        if (!expenseName) {
                            alert('请选择支出分类');
                            return;
                        }
                        const newExpense = { id: 'expense_' + Date.now() + Math.random(), name: expenseName, amount: amount };
                        this.expenses.push(newExpense);
                        addedCount++;
                    }
                    
                    uiManager.hideAddModal();
                    this.resetSwipeState();
                    
                    // 优化统计数据更新，避免全量重算
                    if (isNewDay && addedCount > 0) {
                        this.totalDays++;
                    }
                    this.totalRecords += addedCount;
                    
                    // 立即保存数据，确保统计数据基于最新记录
                    await this.saveData();
                    await this.loadStatistics();
                },
                
                addAmountInput() {
                    this.addModal.amounts.push('');
                    this.$nextTick(() => {
                        const inputs = this.$el.querySelectorAll('#amount-inputs-container .modal-input');
                        if (inputs.length > 0) {
                            inputs[inputs.length - 1].focus();
                        }
                    });
                },

                removeAmountInput(index) {
                    this.addModal.amounts.splice(index, 1);
                },
                
                // 重置滑动状态
                resetSwipeState() {
                    uiManager.resetSwipeState();
                },
                
                // 切换FAB按钮状态
                toggleFab() {
                    this.fabActive = !this.fabActive;
                    
                    // 添加动态交互效果
                    const fabButton = this.$el.querySelector('.fab');
                    if (fabButton) {
                        if (this.fabActive) {
                            fabButton.classList.add('active');
                            // 添加波纹动画效果
                            this.addRippleEffect(fabButton);
                        } else {
                            fabButton.classList.remove('active');
                        }
                    }
                },
                
                // 添加波纹动画效果
                addRippleEffect(element) {
                    const ripple = document.createElement('span');
                    ripple.classList.add('fab-ripple');
                    element.appendChild(ripple);
                    
                    // 设置动画结束后移除元素
                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                },
                
                // 显示添加模态框
                showAddModal(type) {
                    this.addModal.type = type;
                    this.addModal.amount = '';
                    this.newExpense.name = '';
                    uiManager.showAddModal(type);
                    this.fabActive = false; // 关闭FAB菜单
                },
                
                // 开始语音识别
                async startVoiceRecognition() {
                    this.toggleFab(); // 切换FAB状态，使其关闭并旋转图标
                    if (!this.voiceRecognitionManager) {
                        this.voiceRecognitionManager = await moduleLoader.loadModule('voiceRecognition');
                    }
                    
                    this.voiceRecognitionManager.startVoiceRecognition(async (result) => {
                        if (result.success) {
                            if (result.type === 'income') {
                                for (let i = 0; i < result.count; i++) {
                                    this.incomes.push({
                                        id: 'income_' + Date.now() + Math.random(),
                                        amount: result.amount
                                    });
                                }
                                alert(`成功添加 ${result.count} 笔进账，每笔 ${result.amount}元`);
                            } else {
                                const expenseName = result.item || '未命名支出';
                                for (let i = 0; i < result.count; i++) {
                                    this.expenses.push({
                                        id: 'expense_' + Date.now() + Math.random(),
                                        name: expenseName,
                                        amount: result.amount
                                    });
                                }
                                alert(`成功添加 ${result.count} 笔支出: ${expenseName}，每笔 ${result.amount}元`);
                            }
                            this.totalRecords += result.count;
                            
                            // 立即保存数据，确保统计数据基于最新记录
                            await this.saveData();
                            await this.loadStatistics();
                        }
                    });
                },
                
                // 切换暗黑模式
                toggleDarkMode() {
                    uiManager.toggleDarkMode();
                    this.isDarkMode = uiManager.isDarkMode;
                },
                
                // 生成文字记录图片
                generateTextImage() {
                    uiManager.generateTextImage(
                        this.currentDate,
                        this.totalIncome,
                        this.incomes,
                        this.expenses,
                        this.debts
                    );
                },
                
                // 更新日期
                updateDate(newDate) {
                    const year = newDate.getFullYear();
                    const month = newDate.getMonth() + 1;
                    const day = newDate.getDate();
                    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                    const weekday = weekdays[newDate.getDay()];

                    this.currentDate = `${year}年${month}月${day}日 ${weekday}`;
                    this.selectedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    
                    this.loadRecordsForDate(this.selectedDate);
                },

                // 返回昨天
                goToYesterday() {
                    const currentDate = new Date(this.selectedDate);
                    currentDate.setDate(currentDate.getDate() - 1);
                    this.updateDate(currentDate);
                },
                
                // 前进一天
                goToNextDay() {
                    const currentDate = new Date(this.selectedDate);
                    currentDate.setDate(currentDate.getDate() + 1);
                    this.updateDate(currentDate);
                },
                
                // 显示日期选择器
                showDatePicker() {
                    // 传入当前日期和确认回调
                    const currentDate = new Date(this.selectedDate);
                    uiManager.showDatePicker(currentDate, (selectedDate) => {
                        // 日期选择器确认后的回调
                        this.updateDate(selectedDate);
                    });
                },

                // 隐藏日期选择器
                hideDatePicker() {
                    uiManager.hideDatePicker();
                },

                // 显示统计开始日期选择器
                showStatsStartDatePicker() {
                    const currentDate = this.statsStartDate ? new Date(this.statsStartDate) : new Date();
                    uiManager.showDatePicker(currentDate, (selectedDate) => {
                        this.statsStartDate = app.formatDateForInput(selectedDate);
                    });
                },

                // 显示统计结束日期选择器
                showStatsEndDatePicker() {
                    const currentDate = this.statsEndDate ? new Date(this.statsEndDate) : new Date();
                    uiManager.showDatePicker(currentDate, (selectedDate) => {
                        this.statsEndDate = app.formatDateForInput(selectedDate);
                    });
                },

                // 显示烟草日期选择器
                showTobaccoDatePicker() {
                    const currentDate = this.newTobaccoRecord.date ? new Date(this.newTobaccoRecord.date) : new Date();
                    uiManager.showDatePicker(currentDate, (selectedDate) => {
                        this.newTobaccoRecord.date = app.formatDateForInput(selectedDate);
                    });
                },

                // 显示编辑烟草记录日期选择器
                showEditTobaccoDatePicker() {
                    const currentDate = this.editTobaccoRecordData.date ? new Date(this.editTobaccoRecordData.date) : new Date();
                    uiManager.showDatePicker(currentDate, (selectedDate) => {
                        this.editTobaccoRecordData.date = app.formatDateForInput(selectedDate);
                    });
                },

                // 加载指定日期的记录
                loadRecordsForDate(dateKey) {
                    app.loadRecordsForDate(dateKey);
                },

                // 更改日期(保留此方法以兼容旧代码,但不再使用)
                changeDate() {
                    const newDate = new Date(this.selectedDate);
                    // newDate有时区问题，需要修正
                    newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
                    this.updateDate(newDate);
                    this.ui.hideDatePicker();
                },
                
                // 打开添加模态框
                openAddModal(type) {
                    // 先关闭FAB菜单，使用setTimeout确保动画完成
                    this.toggleFab();
                    
                    // 延迟打开模态框，避免与FAB关闭动画冲突
                    setTimeout(() => {
                        this.addModal.type = type;
                        this.addModal.amounts = [''];
                        this.newExpense.name = '';
                        uiManager.showAddModal(type);
                        
                        // 使用多次$nextTick确保DOM完全渲染
                        this.$nextTick(() => {
                            this.$nextTick(() => {
                                if (type === 'expense') {
                                    // 初始化手势滑动分类选择器
                                    this.initExpenseCategoryPicker();
                                } else {
                                    const firstInput = this.$el.querySelector('#amount-inputs-container .modal-input');
                                    if (firstInput) {
                                        firstInput.focus();
                                    }
                                }
                            });
                        });
                    }, 100); // 100ms延迟确保FAB动画完成
                },
                
                // 关闭添加模态框
                closeAddModal() {
                    uiManager.hideAddModal();
                },
                
                // 打开编辑记录模态框
                openEditRecordModal(type, index) {
                    const record = type === 'income' ? this.incomes[index] : this.expenses[index];
                    this.editRecord = { 
                        show: true, 
                        type: type, 
                        index: index, 
                        title: type === 'income' ? '编辑进账' : '编辑支出',
                        name: record.name || '',
                        amount: record.amount
                    };
                    uiManager.showEditRecordModal(type, index, type === 'income' ? '编辑进账' : '编辑支出', record);
                },
                
                // 关闭编辑记录模态框
                closeEditRecordModal() {
                    uiManager.hideEditRecordModal();
                },
                
                // 保存记录
                saveRecord() {
                    if (this.editRecord.type === 'income') {
                        this.incomes[this.editRecord.index].amount = parseFloat(this.editRecord.amount);
                    } else if (this.editRecord.type === 'expense') {
                        this.expenses[this.editRecord.index].name = this.editRecord.name;
                        this.expenses[this.editRecord.index].amount = parseFloat(this.editRecord.amount);
                    }
                    uiManager.hideEditRecordModal();
                    this.editRecord = { show: false, type: null, index: -1, title: '', name: '', amount: '' };
                },
                
                // 删除进账记录
                deleteIncome(index) {
                    uiManager.showConfirmDialog('确定要删除此记录吗？', () => {
                        this.incomes.splice(index, 1);
                        this.totalRecords--;
                        // 优化统计数据更新
                        if (this.incomes.length === 0 && this.expenses.length === 0) {
                            this.totalDays--;
                        }
                    });
                },

                // 编辑分类（使用底部弹窗选择器）
                editCategory(index) {
                    const picker = new BottomSheetCategoryPicker(
                        app.categoryManager,
                        'income',
                        (selectedCategory) => {
                            this.incomes[index].category = selectedCategory;
                        },
                        null, // 进账分类不需要刷新回调
                        (deletedCategoryName) => {
                            // 当分类被删除时，更新所有使用该分类的记录为默认分类
                            dataManager.updateRecordsWithCategory(deletedCategoryName, '默认');
                            // 重新加载当前日期的记录以更新视图
                            this.loadRecordsForDate(this.selectedDate);
                        },
                        dataManager.supabaseDataManager // 传递云端数据管理器
                    );
                    picker.show();
                },

                // 保存分类
                saveCategory(index) {
                    if (this.editingIncomeCategory.value.trim() === '') {
                        this.incomes[index].category = '默认'; // 恢复默认值
                    } else {
                        this.incomes[index].category = this.editingIncomeCategory.value;
                    }
                    this.cancelEditCategory();
                },

                // 取消编辑分类
                cancelEditCategory() {
                    this.editingIncomeCategory.index = -1;
                    this.editingIncomeCategory.value = '';
                },
                
                // 删除支出记录
                deleteExpense(index) {
                    uiManager.showConfirmDialog('确定要删除此记录吗？', () => {
                        this.expenses.splice(index, 1);
                        this.totalRecords--;
                        // 优化统计数据更新
                        if (this.incomes.length === 0 && this.expenses.length === 0) {
                            this.totalDays--;
                        }
                    });
                },
                
                // 打开编辑债务模态框
                openEditModal(index) {
                    const debt = this.debts[index];
                    this.editDebt = { 
                        index: index, 
                        name: debt.name, 
                        expression: debt.calculation 
                    };
                    uiManager.showEditDebtModal(index, debt);
                },
                
                // 关闭债务模态框
                closeModal() {
                    uiManager.hideEditDebtModal();
                },
                
                // 保存债务记录
                async saveDebt() {
                    try {
                        const updatedDebts = await dataManager.editDebt(this.editDebt);
                        // 确保返回的是数组
                        if (Array.isArray(updatedDebts)) {
                            this.debts = updatedDebts;
                        } else {
                            console.error('editDebt 返回的不是数组:', updatedDebts);
                            this.debts = [];
                        }
                        this.$forceUpdate();
                    } catch (e) {
                        alert(e.message);
                        console.error('保存债务失败:', e);
                    } finally {
                        uiManager.hideEditDebtModal();
                        this.editDebt = { index: -1, name: '', expression: '' };
                    }
                },
                
                // 删除债务记录
                async deleteDebt(index) {
                    // 防止重复删除：检查索引是否有效
                    if (index < 0 || index >= this.debts.length) {
                        console.error('无效的债务索引:', index, '当前债务数量:', this.debts.length);
                        return;
                    }
                    
                    uiManager.showConfirmDialog('确定要删除此记录吗？', async () => {
                        try {
                            // 再次验证索引（因为确认对话框是异步的，期间数据可能已变化）
                            if (index < 0 || index >= this.debts.length) {
                                alert('删除失败: 记录已不存在');
                                return;
                            }
                            
                            // 保存要删除的债务名称，用于日志
                            const debtName = this.debts[index].name;
                            
                            // 删除债务
                            await dataManager.deleteDebt(index);
                            
                            // 立即更新 Vue 的 debts 引用，确保响应式更新
                            this.debts = [...dataManager.debts];
                            
                            // 强制 Vue 更新视图
                            this.$forceUpdate();
                            
                            console.log(`成功删除债务: ${debtName}，剩余 ${this.debts.length} 条记录`);
                        } catch (e) {
                            alert('删除失败: ' + e.message);
                            console.error('删除债务失败:', e);
                        }
                    });
                },
                
                // 添加或更新债务
                async addOrUpdateDebt() {
                    if (!this.newDebt.name.trim()) {
                        alert('请输入名字');
                        return;
                    }

                    if (!this.newDebt.expression.trim()) {
                        alert('请输入表达式');
                        return;
                    }

                    try {
                        // 调用 dataManager 的方法来处理债务逻辑
                        const updatedDebts = await dataManager.addOrUpdateDebt(this.newDebt);
                        // 确保返回的是数组
                        if (Array.isArray(updatedDebts)) {
                            this.debts = updatedDebts;
                        } else {
                            console.error('addOrUpdateDebt 返回的不是数组:', updatedDebts);
                            this.debts = [];
                        }

                        // 清空输入框
                        this.newDebt = { name: '', expression: '' };

                        // 强制更新 Vue
                        this.$forceUpdate();

                        // 自动滚动到债务记录容器顶部
                        this.$nextTick(() => {
                            const mainContent = document.querySelector('.main-content');
                            if (mainContent) {
                                mainContent.scrollTo({
                                    top: 0,
                                    behavior: 'smooth'
                                });
                            }
                        });
                    } catch (e) {
                        alert(e.message);
                        console.error('添加债务失败:', e);
                    }
                },
                
                // 格式化债务时间显示
                formatDebtTime(timeString) {
                    const date = new Date(timeString);
                    const now = new Date();
                    
                    // 检查是否为久远数据（2020年及之前标记为"未知"）
                    if (date.getFullYear() <= 2020) {
                        return '未知';
                    }
                    
                    const diffTime = Math.abs(now - date);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        return '今天';
                    } else if (diffDays === 2) {
                        return '昨天';
                    } else if (diffDays <= 7) {
                        return `${diffDays - 1}天前`;
                    } else {
                        return `${date.getMonth() + 1}-${date.getDate()}`;
                    }
                },
                
                // 切换支出项目详情
                toggleExpenseDetail(itemName) {
                    this.expandedExpenseItem = this.expandedExpenseItem === itemName ? null : itemName;
                },
                
                
                // 增加烟草数量
                increaseQuantity() {
                    this.newTobaccoRecord.quantity++;
                },
                
                // 减少烟草数量
                decreaseQuantity() {
                    if (this.newTobaccoRecord.quantity > 1) {
                        this.newTobaccoRecord.quantity--;
                    }
                },
                
                // 计算烟草总价
                calculateTotalPrice() {
                    if (this.newTobaccoRecord.price && this.newTobaccoRecord.quantity) {
                        const total = this.newTobaccoRecord.price * this.newTobaccoRecord.quantity;
                        return total.toFixed(2);
                    }
                    return '0.00';
                },
                
                // 添加烟草记录
                async addTobaccoRecord() {
                    if (!this.tobaccoManager) {
                        this.tobaccoManager = await this.moduleLoader.loadModule('tobacco');
                    }
                    
                    if (this.newTobaccoRecord.price <= 0) {
                        alert('请输入有效的单价');
                        return;
                    }

                    try {
                        await this.tobaccoManager.addTobaccoRecord(
                            this.newTobaccoRecord,
                            dataManager.history,
                            dataManager.supabaseDataManager  // 添加 supabaseDataManager 参数
                        );
                        // 重置表单并设置默认日期为今天
                        this.tobaccoManager.resetNewTobaccoRecord();
                        this.newTobaccoRecord = { ...this.tobaccoManager.newTobaccoRecord };
                        this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                        this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                        this.tobaccoBrandHistory = this.tobaccoManager.tobaccoBrandHistory;
                    } catch (e) {
                        alert(e.message); // 显示错误信息给用户
                    }
                },
                
                // 编辑烟草记录
                async editTobaccoRecord(record) {
                    if (!this.tobaccoManager) {
                        this.tobaccoManager = await moduleLoader.loadModule('tobacco');
                    }
                    
                    // 调用 tobaccoManager 中的方法来处理编辑逻辑
                    this.tobaccoManager.editTobaccoRecord(record);
                    
                    // 从 tobaccoManager 同步数据到 Vue data
                    this.editTobaccoRecordData = { ...this.tobaccoManager.editTobaccoRecordData };
                    
                    uiManager.showEditTobaccoModal();
                },
                
                // 保存烟草记录
                async saveTobaccoRecord() {
                    if (!this.tobaccoManager) {
                        this.tobaccoManager = await moduleLoader.loadModule('tobacco');
                    }
                    
                    // 在保存前，将 Vue data 中的编辑数据同步回 tobaccoManager
                    this.tobaccoManager.updateEditTobaccoRecordData(this.editTobaccoRecordData);
                    
                    const saved = await this.tobaccoManager.saveTobaccoRecord(
                        dataManager.history,
                        dataManager.supabaseDataManager
                    );
                    
                    if (saved) {
                        uiManager.hideEditTobaccoModal();
                        this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                        this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                        this.tobaccoBrandHistory = this.tobaccoManager.tobaccoBrandHistory;
                        this.resetTobaccoSwipeState(); // 重置滑动状态
                    }
                },
                
                // 删除烟草记录
                async deleteTobaccoRecord(record) {
                    if (!this.tobaccoManager) {
                        this.tobaccoManager = await this.moduleLoader.loadModule('tobacco');
                    }
                    
                    await this.tobaccoManager.deleteTobaccoRecord(
                        record,
                        dataManager.history,
                        dataManager.supabaseDataManager
                    );
                    this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                    this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                    this.tobaccoBrandHistory = this.tobaccoManager.tobaccoBrandHistory;
                },
                
                // 上一个烟草周期
                async prevTobaccoPeriod() {
                    if (!this.tobaccoManager) {
                        this.tobaccoManager = await this.moduleLoader.loadModule('tobacco');
                    }
                    
                    this.tobaccoManager.prevTobaccoPeriod();
                    this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                    this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                },
                
                // 下一个烟草周期
                async nextTobaccoPeriod() {
                    if (!this.tobaccoManager) {
                        this.tobaccoManager = await this.moduleLoader.loadModule('tobacco');
                    }
                    
                    this.tobaccoManager.nextTobaccoPeriod();
                    this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                    this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                },
                
                // 烟草周期显示
                tobaccoPeriodDisplay() {
                    if (!this.tobaccoManager) return '';
                    return this.tobaccoManager.tobaccoPeriodDisplay();
                },
                
                // 切换品牌面板
                toggleBrandPanel(index) {
                    this.tobaccoStats[index].expanded = !this.tobaccoStats[index].expanded;
                },
                
                // 烟草品牌变化处理
                onTobaccoBrandChange() {
                    const currentBrand = (this.newTobaccoRecord.brand || '').trim();
                    if (!currentBrand) return;

                    const isPreset = this.tobaccoBrandHistory.some(opt => String(opt).trim() === currentBrand);
                    if (isPreset) {
                        // 延迟聚焦以确保DOM更新完成
                        this.$nextTick(() => {
                            if (this.$refs.tobaccoPriceInput) {
                                this.$refs.tobaccoPriceInput.focus();
                            }
                        });
                    }
                },
                
                // 烟草价格焦点处理
                onTobaccoPriceFocus() {
                    this.tobaccoPriceFocused = true;
                    if (this.newTobaccoRecord.price === 0) {
                        this.newTobaccoRecord.price = '';
                    }
                },
                
                // 烟草价格失焦处理
                onTobaccoPriceBlur() {
                    this.tobaccoPriceFocused = false;
                    if (this.newTobaccoRecord.price === '' || isNaN(this.newTobaccoRecord.price)) {
                        this.newTobaccoRecord.price = 0;
                    }
                },
                
                // 烟草总价焦点处理
                onTobaccoTotalFocus() {
                    // 可以添加相关逻辑
                },
                
                // 烟草总价失焦处理
                onTobaccoTotalBlur() {
                    // 可以添加相关逻辑
                },
                
                // 烟草滑动开始
                onTobaccoTouchStart(event, record) {
                    if (this.tobaccoSwipeState.swipingRecordId !== null && this.tobaccoSwipeState.swipingRecordId !== record.id) {
                        this.resetTobaccoSwipeState();
                    }
                    this.tobaccoSwipeState.startX = event.touches[0].clientX;
                    this.tobaccoSwipeState.startY = event.touches[0].clientY;
                    this.tobaccoSwipeState.currentX = this.tobaccoSwipeState.startX;
                    this.tobaccoSwipeState.swipingRecordId = record.id;
                    this.tobaccoSwipeState.directionLock = null;
                },
                
                // 烟草滑动移动
                onTobaccoTouchMove(event, record) {
                    if (this.tobaccoSwipeState.swipingRecordId !== record.id) return;

                    const currentX = event.touches[0].clientX;
                    const currentY = event.touches[0].clientY;
                    const diffX = currentX - this.tobaccoSwipeState.startX;
                    const diffY = currentY - this.tobaccoSwipeState.startY;

                    if (!this.tobaccoSwipeState.directionLock) {
                        if (Math.abs(diffY) > Math.abs(diffX) + 3) {
                            this.tobaccoSwipeState.directionLock = 'vertical';
                        } else {
                            this.tobaccoSwipeState.directionLock = 'horizontal';
                        }
                    }

                    if (this.tobaccoSwipeState.directionLock === 'horizontal') {
                        this.tobaccoSwipeState.currentX = currentX;
                        event.preventDefault();
                    }
                },
                
                // 烟草滑动结束
                onTobaccoTouchEnd(event, record) {
                    if (this.tobaccoSwipeState.swipingRecordId !== record.id || this.tobaccoSwipeState.directionLock !== 'horizontal') {
                        if (this.tobaccoSwipeState.directionLock === 'vertical') {
                            this.resetTobaccoSwipeState();
                        }
                        return;
                    }

                    const diffX = this.tobaccoSwipeState.currentX - this.tobaccoSwipeState.startX;
                    const swipeThreshold = -50; // 阈值为按钮宽度的一半

                    if (diffX < swipeThreshold) {
                        // 保持打开状态，由 getTobaccoSwipeStyle 处理
                        this.tobaccoSwipeState.currentX = this.tobaccoSwipeState.startX - 100;
                    } else {
                        // 关闭
                        this.resetTobaccoSwipeState();
                    }
                    // 强制 Vue 更新视图
                    this.$forceUpdate();
                },
                
                // 获取烟草滑动样式
                getTobaccoSwipeStyle(record) {
                    if (this.tobaccoSwipeState.swipingRecordId === record.id && this.tobaccoSwipeState.directionLock === 'horizontal') {
                        const diffX = this.tobaccoSwipeState.currentX - this.tobaccoSwipeState.startX;
                        const translateX = Math.max(-100, Math.min(0, diffX));
                        return {
                            transform: `translateX(${translateX}px)`,
                            transition: 'none'
                        };
                    }
                    return {
                        transform: 'translateX(0)',
                        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)'
                    };
                },

                resetTobaccoSwipeState() {
                    this.tobaccoSwipeState = { startX: 0, startY: 0, currentX: 0, swipingRecordId: null, directionLock: null };
                    this.$forceUpdate();
                },

                confirmDeleteTobaccoRecord(record) {
                    uiManager.showConfirmDialog('确定要删除这条烟草记录吗？', () => {
                        this.deleteTobaccoRecord(record);
                    }, () => {
                        this.resetTobaccoSwipeState();
                    });
                },
                
                // 支出项目名称变化处理
                onExpenseNameChange() {
                    // 当选择默认支出项目后，自动跳转到金额输入框
                    const currentName = (this.newExpense.name || '').trim();
                    if (!currentName) return;
                    const isPreset = this.expenseOptions.some(opt => String(opt).trim() === currentName);
                    if (isPreset) {
                        // 延迟聚焦以确保DOM更新完成
                        setTimeout(() => {
                            const amountInput = document.querySelector('#addRecordModal input[type="number"]');
                            if (amountInput) {
                                amountInput.focus();
                            }
                        }, 50);
                    }
                },
                
                // 滑动开始
                onTouchStart(event, index, type) {
                    uiManager.onTouchStart(event, index, type);
                },
                
                // 滑动移动
                onTouchMove(event, index, type) {
                    uiManager.onTouchMove(event, index, type);
                },
                
                // 滑动结束
                onTouchEnd(event, index, type) {
                    uiManager.onTouchEnd(event, index, type);
                },
                
                // 获取滑动样式
                getSwipeStyle(index, type) {
                    return uiManager.getSwipeStyle(index, type);
                },
                
                // 查看历史记录
                isViewingHistory() {
                    const today = new Date().toISOString().split('T')[0];
                    return this.selectedDate !== today;
                },
                
                // 打开图表模态框
                openChartModal() {
                    this.isChartModalVisible = true;
                    this.$nextTick(() => {
                        if (this.statisticsManager) {
                            this.statisticsManager.renderModalChart();
                        }
                    });
                },
                
                // 关闭图表模态框
                closeChartModal() {
                    this.isChartModalVisible = false;
                },
                
                // 打开编辑进账模态框
                openEditIncomeModal(index) {
                    this.openEditRecordModal('income', index);
                },
                
                // 打开编辑支出模态框
                openEditExpenseModal(index) {
                    this.openEditRecordModal('expense', index);
                },
                
                // 格式化金额显示 (旧)
                formatAmount(amount) {
                    // 如果是整数，不显示小数点
                    if (Number.isInteger(amount)) {
                        return amount.toString();
                    }
                    // 如果是小数，保留两位小数
                    return amount.toFixed(2);
                },

                // 调用新的金额格式化工具
                formatChip(amount, type) {
                    const opts = {};
                    if (type === 'income' || type === 'pos') {
                        opts.showPlus = true;
                    }
                    return app.formatCNY(amount, opts);
                },
                
                // 格式化日期显示
                formatDate(dateString) {
                    const date = new Date(dateString);
                    return `${date.getMonth() + 1}-${date.getDate()}`;
                },
                
                // 关闭编辑烟草记录模态框
                closeEditTobaccoModal() {
                    uiManager.hideEditTobaccoModal();
                    this.resetTobaccoSwipeState();
                },

                // 处理恢复按钮点击
                handleRestoreClick() {
                    // 调用 uiManager 中的方法来显示恢复菜单
                    uiManager.showRestoreMenu(dataManager);
                },

                // 编辑个人信息
                editProfile() {
                    uiManager.showUserProfileModal(this.user, (updatedUser) => {
                        this.updateUser(updatedUser);
                    });
                },

                // 更新用户信息（同步到云端）
                async updateUser(updatedUser) {
                    try {
                        // 更新本地
                        this.user = { ...this.user, ...updatedUser };
                        
                        // 同步到 Supabase
                        if (updatedUser.name) {
                            await dataManager.supabaseDataManager.saveUserProfile(updatedUser.name);
                            console.log('用户配置已同步到云端');
                        }
                        
                        // 同时保存到 localStorage 作为备份
                        localStorage.setItem('user', JSON.stringify(this.user));
                    } catch (error) {
                        console.error('保存用户配置失败:', error);
                        alert('保存失败，请稍后重试');
                    }
                },

                // 显示信息模态框
                showInfoModal(title, content) {
                    this.infoModal.title = title;
                    this.infoModal.content = content;
                    this.infoModal.show = true;
                },

                // 关闭信息模态框
                closeInfoModal() {
                    this.infoModal.show = false;
                },

                // 处理退出登录
                async handleLogout() {
                    // 显示确认对话框
                    uiManager.showConfirmDialog('确定要退出登录吗？', async () => {
                        try {
                            // 显示加载状态
                            this.isLoading = true;
                            
                            // 调用 Supabase 退出登录
                            const result = await app.supabaseManager.signOut();
                            
                            if (result.success) {
                                // 退出成功，跳转到登录页
                                window.location.href = '/auth.html';
                            } else {
                                // 退出失败，显示错误信息
                                alert('退出登录失败：' + (result.message || '未知错误'));
                                this.isLoading = false;
                            }
                        } catch (error) {
                            console.error('退出登录时发生错误:', error);
                            alert('退出登录失败，请重试');
                            this.isLoading = false;
                        }
                    });
                },
                
                // 初始化支出分类手势选择器
                initExpenseCategoryPicker() {
                    // 使用改进的重试机制确保DOM已准备好
                    const tryInit = (retryCount = 0) => {
                        const container = document.getElementById('expenseCategoryPicker');

                        if (container && app.categoryManager) {
                            // 强制容器显示，避免可见性检查导致的问题
                            container.style.display = 'block';
                            container.style.visibility = 'visible';
                            container.style.opacity = '1';
                            
                            // 确保容器已在DOM中渲染
                            const isInDOM = document.body.contains(container);
                            
                            if (!isInDOM && retryCount < 20) {
                                // 容器未在DOM中，继续重试（增加重试次数）
                                requestAnimationFrame(() => tryInit(retryCount + 1));
                                return;
                            }

                            // 如果已经有选择器实例，先销毁再重建，确保状态干净
                            if (this.expenseCategoryPicker) {
                                try {
                                    // 尝试刷新现有实例
                                    if (this.expenseCategoryPicker.refresh) {
                                        this.expenseCategoryPicker.refresh();
                                        console.log('分类选择器已刷新');
                                        return;
                                    }
                                } catch (e) {
                                    console.warn('刷新分类选择器失败，将重新创建:', e);
                                    this.expenseCategoryPicker = null;
                                }
                            }
                            
                            // 创建新的选择器实例
                            try {
                                this.expenseCategoryPicker = new SwipeCategoryPicker(
                                    app.categoryManager,
                                    (selectedCategory) => {
                                        // 更新选中的分类名称
                                        this.newExpense.name = selectedCategory;
                                        console.log('已选择分类:', selectedCategory);
                                        // 强制 Vue 更新视图
                                        this.$forceUpdate();
                                    }
                                );
                                this.expenseCategoryPicker.create(container);
                                console.log('分类选择器初始化成功');
                            } catch (e) {
                                console.error('创建分类选择器失败:', e);
                            }
                        } else if (retryCount < 20) {
                            // DOM尚未准备好,在下一帧再次尝试,最多重试20次
                            requestAnimationFrame(() => tryInit(retryCount + 1));
                        } else {
                            console.error('无法初始化支出分类选择器:容器未找到或不可见', {
                                containerExists: !!container,
                                categoryManagerExists: !!app.categoryManager,
                                retryCount: retryCount
                            });
                        }
                    };

                    // 使用双重延迟确保模态框已完全显示
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            tryInit();
                        });
                    });
                },

                // 打开支出分类编辑器
                openExpenseCategoryEditor() {
                    // 创建编辑器实例，提供添加和删除功能
                    const picker = new BottomSheetCategoryPicker(
                        app.categoryManager,
                        'expense',
                        (selectedCategory) => {
                            this.newExpense.name = selectedCategory;
                            // 刷新支出分类选择器显示
                            this.$nextTick(() => {
                                this.initExpenseCategoryPicker();
                            });
                        },
                        // 分类列表变化时的回调（添加或删除分类后）
                        () => {
                            // 刷新支出模态框中的分类选择器
                            this.$nextTick(() => {
                                this.initExpenseCategoryPicker();
                            });
                        },
                        // 分类删除时的回调
                        (deletedCategoryName) => {
                            // 当分类被删除时，更新所有使用该分类的记录为默认分类
                            dataManager.updateRecordsWithCategory(deletedCategoryName, '默认');
                            // 刷新支出模态框中的分类选择器
                            this.$nextTick(() => {
                                this.initExpenseCategoryPicker();
                            });
                        },
                        dataManager.supabaseDataManager // 传递云端数据管理器
                    );
                    picker.show();
                },

                // 检查是否应该显示"暂无进账记录"提示
                shouldShowEmptyIncomeMessage() {
                    // 只有在没有进账记录时才显示提示
                    return this.incomes.length === 0;
                }
            }
        });
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new E7AccountingApp();
});
