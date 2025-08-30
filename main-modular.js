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

// 模块化应用主类
class E7AccountingApp {
    constructor() {
        this.moduleLoader = null;
        this.dataManager = null;
        this.statisticsManager = null;
        this.tobaccoManager = null;
        this.uiManager = null;
        this.voiceRecognitionManager = null;
        
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
            statsView: 'monthly',
            
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
            addModal: { show: false, type: 'income', title: '', amount: '' },
            isChartModalVisible: false,
            isListening: false,
            isDarkMode: false,
            dataLoaded: false,
            
            // 滑动状态
            swipeState: { startX: 0, startY: 0, currentX: 0, swipingIndex: null, swipingType: null, directionLock: null },
            tobaccoSwipeState: { startX: 0, currentX: 0, swipingRecord: null, directionLock: null }
        };
        
        this.init();
    }
    
    async init() {
        try {
            // 初始化模块加载器
            const { ModuleLoader } = await import('./modules/moduleLoader.js');
            this.moduleLoader = new ModuleLoader();
            
            // 加载核心模块
            this.dataManager = await this.moduleLoader.loadModule('dataManager');
            this.uiManager = await this.moduleLoader.loadModule('ui');
            
            // 初始化日期
            this.initDates();
            
            // 初始化Vue应用
            this.initVueApp();
            
            // 加载暗黑模式设置
            this.uiManager.loadDarkMode();
            
            // 显示开屏页
            this.uiManager.showSplashScreen();
            
            // 加载数据
            await this.dataManager.loadData();
            
            // 更新Vue数据
            this.updateVueData();
            
            // 加载当前日期的记录
            this.loadRecordsForDate(this.vueData.selectedDate);
            
            // 隐藏开屏页
            setTimeout(() => {
                this.uiManager.hideSplashScreen();
            }, 1000);
            
        } catch (error) {
            console.error('应用初始化失败:', error);
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
        
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);
        
        this.vueData.statsStartDate = this.formatDateForInput(firstDayOfMonth);
        this.vueData.statsEndDate = this.formatDateForInput(lastDayOfMonth);
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
        
        // 创建Vue实例
        this.vueApp = new Vue({
            el: '#app',
            data: this.vueData,
            computed: {
                totalIncome() {
                    const incomeSum = this.incomes.reduce((sum, income) => sum + Number(income.amount), 0);
                    const expenseSum = this.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
                    return incomeSum - expenseSum;
                },
                totalDebtAmount() {
                    return this.debts.reduce((sum, debt) => sum + Number(debt.result), 0);
                },
                totalTobaccoAmount() {
                    return this.tobaccoStats.reduce((sum, brand) => sum + brand.totalAmount, 0);
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
                    if (this.fabActive) {
                        const fabContainer = event.target.closest('.fab-in-bar');
                        const fabOptions = event.target.closest('.fab-options');
                        
                        if (!fabContainer && !fabOptions) {
                            this.fabActive = false;
                        }
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
                    
                    // 当切换到统计视图时，自动加载统计数据
                    if (viewName === 'stats') {
                        this.$nextTick(async () => {
                            this.loadStatistics();
                            
                            // 同时加载烟草模块
                            if (!this.tobaccoManager) {
                                this.tobaccoManager = await moduleLoader.loadModule('tobacco');
                                this.tobaccoManager.initTobaccoPeriod();
                                this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                                
                                // 重置新烟草记录表单，设置默认日期为今天
                                this.tobaccoManager.resetNewTobaccoRecord();
                                
                                // 更新Vue数据
                                this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                                this.tobaccoBrandHistory = this.tobaccoManager.tobaccoBrandHistory;
                                this.newTobaccoRecord = { ...this.tobaccoManager.newTobaccoRecord };
                            }
                        });
                    }
                    
                    // 当切换到烟草视图时，加载烟草模块
                    if (viewName === 'tobacco' && !this.tobaccoManager) {
                        this.tobaccoManager = await moduleLoader.loadModule('tobacco');
                        this.tobaccoManager.initTobaccoPeriod();
                        this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                        
                        // 重置新烟草记录表单，设置默认日期为今天
                        this.tobaccoManager.resetNewTobaccoRecord();
                        
                        // 更新Vue数据
                        this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                        this.tobaccoBrandHistory = this.tobaccoManager.tobaccoBrandHistory;
                        this.newTobaccoRecord = { ...this.tobaccoManager.newTobaccoRecord };
                    }
                },
                
                // 添加记录
                addRecord() {
                    const amount = parseFloat(this.addModal.amount);
                    if (isNaN(amount)) {
                        alert('请输入有效的金额');
                        return;
                    }

                    if (this.addModal.type === 'income') {
                        const newIncome = { id: 'income_' + Date.now() + Math.random(), amount: amount };
                        this.incomes.push(newIncome);
                    } else if (this.addModal.type === 'expense') {
                        if (amount <= 0) {
                            alert('支出金额必须为正数');
                            return;
                        }
                        if (!this.newExpense.name.trim()) {
                            alert('请输入支出项目');
                            return;
                        }
                        const newExpense = { id: 'expense_' + Date.now() + Math.random(), name: this.newExpense.name, amount: amount };
                        this.expenses.push(newExpense);
                    }
                    
                    uiManager.hideAddModal();
                    this.resetSwipeState();
                },
                
                // 重置滑动状态
                resetSwipeState() {
                    uiManager.resetSwipeState();
                },
                
                // 切换FAB按钮状态
                toggleFab() {
                    this.fabActive = !this.fabActive;
                },
                
                // 显示添加模态框
                showAddModal(type) {
                    this.addModal.type = type;
                    this.addModal.amount = '';
                    this.newExpense.name = '';
                    uiManager.showAddModal(type);
                },
                
                // 开始语音识别
                async startVoiceRecognition() {
                    if (!this.voiceRecognitionManager) {
                        this.voiceRecognitionManager = await moduleLoader.loadModule('voiceRecognition');
                    }
                    
                    this.voiceRecognitionManager.startVoiceRecognition();
                    this.voiceRecognitionManager.processVoiceCommand = (command) => {
                        this.voiceRecognitionManager.processVoiceCommand(command, (result) => {
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
                                this.scheduleSave();
                            }
                        });
                    };
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
                
                // 返回昨天
                goToYesterday() {
                    const currentDate = new Date(this.selectedDate);
                    currentDate.setDate(currentDate.getDate() - 1);
                    this.selectedDate = currentDate.toISOString().split('T')[0];
                    this.loadRecordsForDate(this.selectedDate);
                },
                
                // 前进一天
                goToNextDay() {
                    const currentDate = new Date(this.selectedDate);
                    currentDate.setDate(currentDate.getDate() + 1);
                    this.selectedDate = currentDate.toISOString().split('T')[0];
                    this.loadRecordsForDate(this.selectedDate);
                },
                
                // 显示日期选择器
                showDatePicker() {
                    uiManager.showDatePicker();
                },
                
                // 隐藏日期选择器
                hideDatePicker() {
                    uiManager.hideDatePicker();
                },
                
                // 更改日期
                changeDate() {
                    this.loadRecordsForDate(this.selectedDate);
                    uiManager.hideDatePicker();
                },
                
                // 打开添加模态框
                openAddModal(type) {
                    this.addModal.type = type;
                    this.addModal.amount = '';
                    this.newExpense.name = '';
                    uiManager.showAddModal(type);
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
                    this.incomes.splice(index, 1);
                },
                
                // 删除支出记录
                deleteExpense(index) {
                    this.expenses.splice(index, 1);
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
                saveDebt() {
                    const index = this.editDebt.index;
                    if (index >= 0 && index < this.debts.length) {
                        this.debts[index].name = this.editDebt.name;
                        this.debts[index].calculation = this.editDebt.expression;
                        // 重新计算结果
                        try {
                            // 简化的表达式计算（实际应用中可能需要更复杂的解析）
                            const result = eval(this.editDebt.expression);
                            this.debts[index].result = isNaN(result) ? 0 : result;
                        } catch (e) {
                            this.debts[index].result = 0;
                        }
                        this.debts[index].updatedAt = new Date().toISOString();
                    }
                    uiManager.hideEditDebtModal();
                    this.editDebt = { index: -1, name: '', expression: '' };
                },
                
                // 删除债务记录
                deleteDebt(index) {
                    this.debts.splice(index, 1);
                },
                
                // 添加或更新债务
                addOrUpdateDebt() {
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
                        const updatedDebts = dataManager.addOrUpdateDebt(this.newDebt);
                        this.debts = updatedDebts; // 更新 Vue 实例的债务列表
                        
                        // 清空输入框
                        this.newDebt = { name: '', expression: '' };
                    } catch (e) {
                        alert(e.message);
                    }
                },
                
                // 格式化债务时间显示
                formatDebtTime(timeString) {
                    const date = new Date(timeString);
                    const now = new Date();
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
                
                // 更改统计视图
                changeStatsView(view) {
                    this.statsView = view;
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    
                    if (view === 'weekly') {
                        // 设置最近一周
                        const endDate = new Date(now);
                        const startDate = new Date(now);
                        startDate.setDate(startDate.getDate() - 6);
                        this.statsStartDate = this.formatDateForInput(startDate);
                        this.statsEndDate = this.formatDateForInput(endDate);
                    } else if (view === 'monthly') {
                        // 设置当前月
                        const startDate = new Date(year, month, 1);
                        const endDate = new Date(year, month + 1, 0);
                        this.statsStartDate = this.formatDateForInput(startDate);
                        this.statsEndDate = this.formatDateForInput(endDate);
                    } else if (view === 'custom') {
                        // 自定义视图保持当前选择的日期
                    }
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
                        this.tobaccoManager.addTobaccoRecord(this.newTobaccoRecord, dataManager.history); // 传递 history
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
                        this.tobaccoManager = await this.moduleLoader.loadModule('tobacco');
                    }
                    
                    this.editTobaccoRecordData = { ...record };
                    uiManager.showEditTobaccoModal();
                },
                
                // 保存烟草记录
                async saveTobaccoRecord() {
                    if (!this.tobaccoManager) {
                        this.tobaccoManager = await this.moduleLoader.loadModule('tobacco');
                    }
                    
                    this.tobaccoManager.saveTobaccoRecord(dataManager.history); // 传递 history
                    uiManager.hideEditTobaccoModal();
                    this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                    this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                    this.tobaccoBrandHistory = this.tobaccoManager.tobaccoBrandHistory;
                },
                
                // 删除烟草记录
                async deleteTobaccoRecord(record) {
                    if (!this.tobaccoManager) {
                        this.tobaccoManager = await this.moduleLoader.loadModule('tobacco');
                    }
                    
                    if (confirm('确定要删除这条烟草记录吗？')) {
                        this.tobaccoManager.deleteTobaccoRecord(record, dataManager.history); // 传递 record 和 history
                        this.tobaccoManager.loadTobaccoStatistics(dataManager.history);
                        this.tobaccoStats = this.tobaccoManager.tobaccoStats;
                        this.tobaccoBrandHistory = this.tobaccoManager.tobaccoBrandHistory;
                    }
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
                    // 可以添加自动填充价格等逻辑
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
                    // 可以添加滑动删除相关逻辑
                },
                
                // 烟草滑动移动
                onTobaccoTouchMove(event, record) {
                    // 可以添加滑动删除相关逻辑
                },
                
                // 烟草滑动结束
                onTobaccoTouchEnd(event, record) {
                    // 可以添加滑动删除相关逻辑
                },
                
                // 获取烟草滑动样式
                getTobaccoSwipeStyle(record) {
                    // 可以添加滑动删除相关逻辑
                    return {};
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
                
                // 格式化金额显示
                formatAmount(amount) {
                    // 如果是整数，不显示小数点
                    if (Number.isInteger(amount)) {
                        return amount.toString();
                    }
                    // 如果是小数，保留两位小数
                    return amount.toFixed(2);
                },
                
                // 格式化日期显示
                formatDate(dateString) {
                    const date = new Date(dateString);
                    return `${date.getMonth() + 1}-${date.getDate()}`;
                },
                
                // 关闭编辑烟草记录模态框
                closeEditTobaccoModal() {
                    this.uiManager.hideEditTobaccoModal();
                }
            }
        });
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new E7AccountingApp();
});
