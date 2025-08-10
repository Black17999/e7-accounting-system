// 增强的 Service Worker 注册逻辑
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
                        // 这避免了“发现新版本”的确认框
                        newWorker.postMessage({ action: 'skipWaiting' });
                    }
                });
            });
        }).catch(error => {
            console.log('ServiceWorker 注册失败: ', error);
        });
    });
}

// 在此添加 fetchWithTimeout 辅助函数
async function fetchWithTimeout(resource, options = {}, timeout = 8000) { // 设置8秒超时
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

new Vue({
    el: '#app',
    data() {
        // !! 重要更改 !!
        // 将 API 地址从一个固定的外部域名更改为相对路径。
        // 这使得前端可以自动与我们新建的、部署在同一域名下的后端 (`/functions`) 进行通信。
        const CLOUD_API_URL = '/api/data';
        const LOCAL_HISTORY_KEY = 'e7-local-history';
        const LOCAL_DEBTS_KEY = 'e7-local-debts';

        // 默认债务记录
        const defaultDebts = [
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
        ];

        // 日期初始化
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = weekdays[now.getDay()];
        const currentDate = `${year}年${month}月${day}日 ${weekday}`;
        const selectedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);

        return {
            cloudApiUrl: CLOUD_API_URL,
            localHistoryKey: LOCAL_HISTORY_KEY,
            localDebtsKey: LOCAL_DEBTS_KEY,
            history: {},
            incomes: [],
            expenses: [],
            newIncome: '',
            newExpense: { name: '', amount: '' },
            expenseOptions: ['矿泉水', '糖果', '纸巾', '洗手液', '擦手纸'],
            debts: defaultDebts,
            defaultDebts: defaultDebts,
            newDebt: { name: '', expression: '' },
            editDebt: { index: -1, name: '', expression: '' },
            editRecord: { show: false, type: null, index: -1, title: '', name: '', amount: '' },
            currentDate: currentDate,
            selectedDate: selectedDate,
            statsStartDate: this.formatDateForInput(firstDayOfMonth),
            statsEndDate: this.formatDateForInput(lastDayOfMonth),
            statsView: 'monthly',
            statistics: { totalIncome: 0, totalExpense: 0, netIncome: 0, avgDailyIncome: 0, chartData: [] },
            chart: null,
            expenseChart: null, // 新增：用于支出环形图的实例
            expenseBreakdown: [], // 新增：用于存储支出项目分析数据
            expandedExpenseItem: null, // 新增：记录当前展开详情的支出项目
            saveTimeout: null,
            isLoading: true,
            isOffline: false, // 网络状态标志
            activeView: 'records', // 新增：控制当前显示的视图
            swipeState: { // 滑动删除状态
                startX: 0,
                startY: 0,
                currentX: 0,
                swipingIndex: null,
                swipingType: null,
                directionLock: null, // 新增：滑动方向锁 ('vertical' or 'horizontal')
            },
            fabActive: false, // 新增：FAB激活状态
            addModal: { // 新增：新增记录模态框状态
                show: false,
                type: 'income',
                title: '',
                amount: ''
            },
            isChartModalVisible: false, // 控制图表全屏模态框的显示
            isListening: false, // 语音识别状态
        };
    },
    computed: {
        totalIncome() {
            const incomeSum = this.incomes.reduce((sum, income) => sum + Number(income.amount), 0);
            const expenseSum = this.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
            return incomeSum - expenseSum;
        },
        totalDebtAmount() {
            return this.debts.reduce((sum, debt) => sum + Number(debt.result), 0);
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
        if (window.matchMedia('(display-mode: standalone)').matches) {
            document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
        }
        this.loadData();
        // 如果初始视图是统计视图，自动加载统计数据
        if (this.activeView === 'stats') {
            this.$nextTick(() => {
                this.loadStatistics();
            });
        }
    },
    methods: {
        // =========================================================
        // 数据同步核心方法 (含离线备用)
        // =========================================================
        formatAmount(amount) {
            // 如果是整数，直接返回；如果是小数，保留两位
            return Number.isInteger(amount) ? amount : amount.toFixed(2);
        },
        async loadData() {
            this.isLoading = true;
            try {
                // 尝试从云端加载
                const response = await fetchWithTimeout(this.cloudApiUrl);
                if (!response.ok) throw new Error(`网络错误: ${response.statusText}`);
                const cloudData = await response.json();
                
                this.isOffline = false;
                console.log('成功连接到 Cloudflare。');

                // 检查本地是否有待上传的离线数据
                const localHistory = this.loadDataFromLocal('history');
                const localDebts = this.loadDataFromLocal('debts');

                if (localHistory || localDebts) {
                    console.log('发现本地离线数据，准备同步到云端...');
                    // 以本地数据为准，覆盖云端
                    this.history = localHistory || cloudData.history || {};
                    this.debts = localDebts || cloudData.debts || this.defaultDebts;
                    await this.saveDataToCloud(true); // 强制立即保存
                    // 同步成功后，清除本地备份
                    localStorage.removeItem(this.localHistoryKey);
                    localStorage.removeItem(this.localDebtsKey);
                    console.log('离线数据同步成功，已清除本地备份。');
                } else {
                    // 没有离线数据，正常加载云端数据
                    this.history = cloudData.history || {};
                    this.debts = cloudData.debts || this.defaultDebts;
                }

            } catch (error) {
                console.warn('无法连接到 Cloudflare 或请求超时，切换到离线模式。', error);
                if (!this.isOffline) {
                    alert('网络连接缓慢或中断，已启用离线模式。所有更改将保存在本地，联网后会自动同步。');
                }
                this.isOffline = true;
                this.history = this.loadDataFromLocal('history') || {};
                this.debts = this.loadDataFromLocal('debts') || this.defaultDebts;
            } finally {
                this.isLoading = false;
                this.normalizeDataIds(); // 清洗数据，确保都有ID
                this.loadRecordsForDate(this.selectedDate);
                this.loadStatistics();
            }
        },

    goToYesterday() {
        this.syncCurrentViewToHistory();
        const today = new Date(this.selectedDate);
        today.setDate(today.getDate() - 1);
        this.selectedDate = this.formatDateForInput(today);
        this.changeDate(false);
    },

    goToNextDay() {
        this.syncCurrentViewToHistory();
        const today = new Date(this.selectedDate);
        today.setDate(today.getDate() + 1);
        this.selectedDate = this.formatDateForInput(today);
        this.changeDate(false);
    },

        // 确保所有收支记录都有唯一的ID，用于动画
        normalizeDataIds() {
            for (const dateKey in this.history) {
                const dayRecord = this.history[dateKey];
                if (dayRecord.incomes) {
                    dayRecord.incomes.forEach(item => {
                        if (!item.id) {
                            item.id = 'income_' + Date.now() + Math.random();
                        }
                    });
                }
                if (dayRecord.expenses) {
                    dayRecord.expenses.forEach(item => {
                        if (!item.id) {
                            item.id = 'expense_' + Date.now() + Math.random();
                        }
                    });
                }
            }
        },

        scheduleSave() {
            if (this.isLoading) return;
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.isOffline ? this.saveDataToLocal() : this.saveDataToCloud();
            }, 1500);
        },

        async saveDataToCloud(force = false) {
            if (this.isOffline && !force) return; // 离线状态下不尝试保存到云端，除非是强制同步
            console.log('正在保存数据到 Cloudflare...');
            this.syncCurrentViewToHistory();

            try {
                const response = await fetchWithTimeout(this.cloudApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ history: this.history, debts: this.debts }),
                });
                if (!response.ok) throw new Error(`网络错误: ${response.statusText}`);
                const result = await response.json();
                if (result.success) {
                    console.log('数据成功保存到 Cloudflare!');
                    // 如果之前是离线状态，现在保存成功了，就更新状态
                    if (this.isOffline) this.isOffline = false;
                }
            } catch (error) {
                console.error('保存到 Cloudflare 失败，转为本地保存:', error);
                this.isOffline = true;
                this.saveDataToLocal(); // 保存失败时，自动存到本地
            }
        },

        saveDataToLocal() {
            console.log('正在保存数据到本地...');
            this.syncCurrentViewToHistory();
            localStorage.setItem(this.localHistoryKey, JSON.stringify(this.history));
            localStorage.setItem(this.localDebtsKey, JSON.stringify(this.debts));
        },

        loadDataFromLocal(type) {
            const key = type === 'history' ? this.localHistoryKey : this.localDebtsKey;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        },

        syncCurrentViewToHistory() {
            const dateKey = this.selectedDate;
            if (!this.history[dateKey]) {
                this.history[dateKey] = {};
            }
            // 只有在有数据时才同步，避免不必要的响应式更新
            if (this.incomes.length > 0) {
                this.history[dateKey].incomes = JSON.parse(JSON.stringify(this.incomes));
            } else {
                delete this.history[dateKey].incomes;
            }
            if (this.expenses.length > 0) {
                this.history[dateKey].expenses = JSON.parse(JSON.stringify(this.expenses));
            } else {
                delete this.history[dateKey].expenses;
            }
            // 如果一个日期的所有记录都被删除了，就移除这个日期键
            if (Object.keys(this.history[dateKey]).length === 0) {
                delete this.history[dateKey];
            }
        },

        // =========================================================
        // 日结和记录加载
        // =========================================================
        clearDayRecords() {
            const dateKey = this.selectedDate;
            if (this.incomes.length === 0 && this.expenses.length === 0) {
                alert('没有需要清空的记录。');
                return;
            }
            if (confirm(`确定要清空 ${this.currentDate} 的所有进账和支出记录吗？此操作不可撤销！`)) {
                this.incomes = [];
                this.expenses = [];
                this.scheduleSave();
                alert('清空成功！');
            }
        },

        loadRecordsForDate(dateKey) {
            const records = this.history[dateKey];
            if (records) {
                const newIncomes = JSON.parse(JSON.stringify(records.incomes || []));
                const newExpenses = JSON.parse(JSON.stringify(records.expenses || []));
                Vue.set(this, 'incomes', newIncomes);
                Vue.set(this, 'expenses', newExpenses);
            } else {
                Vue.set(this, 'incomes', []);
                Vue.set(this, 'expenses', []);
            }
        },

        // =========================================================
        // 日期选择器
        // =========================================================
        isViewingHistory() {
            return this.selectedDate !== this.formatDateForInput(new Date());
        },

        changeDate(sync = true) {
            if (sync) {
                this.syncCurrentViewToHistory();
            }
            const dateParts = this.selectedDate.split('-');
            if (dateParts.length === 3) {
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);
                const date = new Date(year, month - 1, day);
                const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                const weekday = weekdays[date.getDay()];
                this.currentDate = `${year}年${month}月${day}日 ${weekday}`;
                this.loadRecordsForDate(this.selectedDate);
                this.hideDatePicker();
            }
        },

        deleteIncome(index) {
            if (confirm('确定要删除这条进账记录吗？')) {
                const newIncomes = this.incomes.filter((_, i) => i !== index);
                Vue.set(this, 'incomes', newIncomes);
            }
        },
        deleteExpense(index) {
            if (confirm('确定要删除这条支出记录吗？')) {
                const newExpenses = this.expenses.filter((_, i) => i !== index);
                Vue.set(this, 'expenses', newExpenses);
                this.syncCurrentViewToHistory();
                this.loadStatistics();
            }
        },
        saveRecord() {
            const { type, index, name, amount } = this.editRecord;
            if (amount === '' || isNaN(parseFloat(amount))) {
                alert('请输入有效的金额');
                return;
            }
            if (type === 'income') {
                this.incomes[index].amount = parseFloat(amount);
            } else if (type === 'expense') {
                if (name.trim() === '') {
                    alert('请输入支出项目名称');
                    return;
                }
                this.expenses[index].name = name;
                this.expenses[index].amount = parseFloat(amount);
                this.syncCurrentViewToHistory();
                this.loadStatistics();
            }
            this.scheduleSave();
            this.closeEditRecordModal();
        },
        exportData() {
            this.syncCurrentViewToHistory();
            const dataToExport = {
                history: this.history,
                debts: this.debts,
                exportDate: new Date().toISOString()
            };
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `e7-accounting-backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('数据导出成功！');
        },
        importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (confirm('确定要导入备份数据吗？当前云端所有历史记录和债务都将被覆盖！')) {
                        this.history = data.history || {};
                        this.debts = data.debts || [];
                        await this.saveDataToCloud(true);
                        alert('数据导入并上传成功！');
                        this.loadRecordsForDate(this.selectedDate);
                    }
                } catch (error) {
                    alert('导入失败：文件格式不正确或已损坏');
                    console.error('导入错误', error);
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        },
        showDatePicker() { document.getElementById('datePickerModal').style.display = 'flex'; },
        hideDatePicker() { document.getElementById('datePickerModal').style.display = 'none'; },
        deleteDebt(index) { if (confirm('确定要删除这条债务记录吗？此操作不可撤销！')) { this.debts.splice(index, 1); } },
        addOrUpdateDebt() {
            if (!this.newDebt.name || !this.newDebt.expression) { alert('请输入债务名称和表达式'); return; }
            const now = new Date().toISOString();
            const existingIndex = this.debts.findIndex(d => d.name === this.newDebt.name);
            if (existingIndex >= 0) {
                const debt = this.debts.splice(existingIndex, 1)[0];
                const newExpression = `${debt.calculation}${this.newDebt.expression}`;
                const result = this.calculateExpression(newExpression);
                this.debts.unshift({ 
                    name: this.newDebt.name, 
                    calculation: newExpression, 
                    result: result, 
                    isNew: true,
                    createdAt: debt.createdAt || now,
                    updatedAt: now
                });
            } else {
                const result = this.calculateExpression(this.newDebt.expression);
                this.debts.unshift({ 
                    name: this.newDebt.name, 
                    calculation: this.newDebt.expression, 
                    result: result, 
                    isNew: true,
                    createdAt: now,
                    updatedAt: now
                });
            }
            this.newDebt = { name: '', expression: '' };
            setTimeout(() => {
                const newDebt = this.debts.find(d => d.isNew);
                if (newDebt) {
                    Vue.set(newDebt, 'isNew', false);
                }
            }, 3000);
        },
        calculateExpression(expression) {
            try {
                const expr = String(expression).replace(/=/g, '').replace(/＋/g, '+').replace(/－/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
                return Function(`"use strict"; return (${expr})`)();
            } catch (e) { console.error('表达式计算错误', e); alert('表达式格式错误'); return 0; }
        },
        openEditModal(index) {
            this.editDebt = { index: index, name: this.debts[index].name, expression: this.debts[index].calculation };
            document.getElementById('editModal').style.display = 'flex';
        },
        saveDebt() {
            if (this.editDebt.index >= 0) {
                const now = new Date().toISOString();
                const existingDebt = this.debts[this.editDebt.index];
                const updatedDebt = {
                    name: this.editDebt.name,
                    calculation: this.editDebt.expression,
                    result: this.calculateExpression(this.editDebt.expression),
                    isNew: true,
                    createdAt: existingDebt.createdAt || now,
                    updatedAt: now
                };
                this.debts.splice(this.editDebt.index, 1);
                this.debts.unshift(updatedDebt);
                this.closeModal();
                setTimeout(() => {
                    const newDebt = this.debts.find(d => d.isNew);
                    if (newDebt) {
                        Vue.set(newDebt, 'isNew', false);
                    }
                }, 3000);
            }
        },
        closeModal() {
            document.getElementById('editModal').style.display = 'none';
            this.editDebt = { index: -1, name: '', expression: '' };
        },
        openEditIncomeModal(index) {
            const income = this.incomes[index];
            this.editRecord = { show: true, type: 'income', index: index, title: `编辑第 ${index + 1} 场进账`, amount: income.amount };
            document.getElementById('editRecordModal').style.display = 'flex';
        },
        openEditExpenseModal(index) {
            const expense = this.expenses[index];
            this.editRecord = { show: true, type: 'expense', index: index, title: `编辑支出：${expense.name}`, name: expense.name, amount: expense.amount };
            document.getElementById('editRecordModal').style.display = 'flex';
        },
        closeEditRecordModal() {
            document.getElementById('editRecordModal').style.display = 'none';
            this.editRecord = { show: false, type: null, index: -1, title: '', name: '', amount: '' };
        },
        generateTextImage() {
            // 1. 创建一个临时容器，绝对定位到屏幕外
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-99999px';
            container.style.top = '0';
            container.style.width = '480px';
            container.style.zIndex = '9999';
            container.style.background = 'transparent';
            container.style.opacity = '1';
            container.style.display = 'block';
            container.style.overflow = 'visible';
            document.body.appendChild(container);

            // 2. 克隆内容，正常可见但用户看不到
            const textRecord = document.getElementById('textRecord');
            const clone = textRecord.cloneNode(true);
            clone.style.display = 'block';
            clone.style.position = 'static';
            clone.style.opacity = '1';
            clone.style.visibility = 'visible';
            clone.style.pointerEvents = 'none';
            clone.style.height = 'auto';
            clone.style.maxHeight = 'none';
            clone.style.overflow = 'visible';
            clone.style.width = '480px';
            clone.style.background = '#142133';
            clone.style.boxShadow = '0 0 24px 0 rgba(0,0,0,0.15)';
            clone.classList.add('plain-text-mode');
            clone.style.paddingBottom = '30px';
            container.appendChild(clone);

            // 强制reflow，确保渲染
            void clone.offsetHeight;
            setTimeout(() => {
                const realHeight = clone.scrollHeight + 30;
                html2canvas(clone, {
                    scale: 2,
                    backgroundColor: '#142133',
                    width: 480,
                    height: realHeight,
                    scrollY: 0,
                    useCORS: true,
                    logging: false,
                    allowTaint: true
                })
                    .then(canvas => {
                        const link = document.createElement('a');
                        link.download = `E7棋牌室记账记录_${this.currentDate.replace(/[年月日\s]/g, '-')}.png`;
                        link.href = canvas.toDataURL('image/png', 1.0);
                        link.click();
                        document.body.removeChild(container);
                    }).catch(err => {
                        console.error('截图生成失败', err);
                        alert('截图生成失败');
                        document.body.removeChild(container);
                    });
            }, 400);
        },
        formatDateForInput(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        loadStatistics() {
            if (!this.statsStartDate || !this.statsEndDate) {
                // 如果没有日期，自动设置为当月
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                this.statsStartDate = this.formatDateForInput(firstDay);
                this.statsEndDate = this.formatDateForInput(lastDay);
            }
            const startDate = new Date(this.statsStartDate);
            const endDate = new Date(this.statsEndDate);
            endDate.setHours(23, 59, 59, 999);
            let totalIncome = 0, totalExpense = 0, daysInRange = 0;
            const dailyData = {};
            for (const dateKey in this.history) {
                const recordDate = new Date(dateKey);
                if (recordDate >= startDate && recordDate <= endDate) {
                    const record = this.history[dateKey];
                    const dayIncome = (record.incomes || []).reduce((sum, item) => sum + Number(item.amount), 0);
                    const dayExpense = (record.expenses || []).reduce((sum, item) => sum + Number(item.amount), 0);
                    totalIncome += dayIncome;
                    totalExpense += dayExpense;
                    dailyData[dateKey] = { income: dayIncome, expense: dayExpense };
                }
            }
            const labels = [], incomeData = [], expenseData = [];
            const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
            daysInRange = sortedDates.length;
            sortedDates.forEach(dateKey => {
                const date = new Date(dateKey);
                labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
                incomeData.push(dailyData[dateKey].income);
                expenseData.push(dailyData[dateKey].expense);
            });
            const netIncome = totalIncome - totalExpense;
            const avgDailyIncome = daysInRange > 0 ? (totalIncome / daysInRange).toFixed(2) : 0;
            this.statistics = {
                totalIncome: totalIncome.toFixed(2),
                totalExpense: totalExpense.toFixed(2),
                netIncome: netIncome.toFixed(2),
                avgDailyIncome: avgDailyIncome,
                chartData: { labels, incomeData, expenseData }
            };
            this.calculateExpenseBreakdown(startDate, endDate);
            this.renderChart('statsChart');
            this.renderExpenseChart();
        },

        calculateExpenseBreakdown(startDate, endDate) {
            const expenseMap = {};
            let totalExpense = 0;

            for (const dateKey in this.history) {
                const recordDate = new Date(dateKey);
                if (recordDate >= startDate && recordDate <= endDate) {
                    const record = this.history[dateKey];
                    if (record.expenses) {
                        record.expenses.forEach(expense => {
                            const name = expense.name.trim();
                            const amount = Number(expense.amount);
                            if (!expenseMap[name]) {
                                expenseMap[name] = { total: 0, details: [] };
                            }
                            expenseMap[name].total += amount;
                            expenseMap[name].details.push({
                                date: dateKey,
                                amount: amount
                            });
                            totalExpense += amount;
                        });
                    }
                }
            }

            if (totalExpense === 0) {
                this.expenseBreakdown = [];
                return;
            }
            
            const colors = ['#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#2ecc71', '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#d35400'];
            let colorIndex = 0;

            this.expenseBreakdown = Object.entries(expenseMap)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([name, data]) => ({
                    name,
                    amount: data.total,
                    details: data.details.sort((a, b) => new Date(b.date) - new Date(a.date)), // 按日期降序排列
                    percentage: ((data.total / totalExpense) * 100).toFixed(2),
                    color: colors[colorIndex++ % colors.length]
                }));
        },

        toggleExpenseDetail(itemName) {
            if (this.expandedExpenseItem === itemName) {
                this.expandedExpenseItem = null;
            } else {
                this.expandedExpenseItem = itemName;
            }
        },

        renderExpenseChart() {
            const canvas = document.getElementById('expenseChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if (this.expenseChart) {
                this.expenseChart.destroy();
            }

            if (this.expenseBreakdown.length === 0) {
                return; // 如果没有数据，不渲染图表
            }

            this.expenseChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: this.expenseBreakdown.map(item => item.name),
                    datasets: [{
                        data: this.expenseBreakdown.map(item => item.amount),
                        backgroundColor: this.expenseBreakdown.map(item => item.color),
                        borderColor: '#1b263b',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // 我们有自定义的列表，所以隐藏默认图例
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        const percentage = context.dataset.data.length > 0 ? (context.parsed / context.dataset.data.reduce((a, b) => a + b, 0) * 100).toFixed(2) : 0;
                                        label += `${context.raw.toFixed(2)}元 (${percentage}%)`;
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        },

        _getChartConfig(isFullScreen = false) {
            const labels = this.statistics.chartData.labels || [];
            // 全屏模式下，为了显示更多标签，可以减少标签旋转角度
            const maxTicksRotation = isFullScreen ? 45 : 90;
            const autoSkip = labels.length > 15 && !isFullScreen;

            return {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: '收入', data: this.statistics.chartData.incomeData, backgroundColor: 'rgba(46, 204, 113, 0.7)' },
                        { label: '支出', data: this.statistics.chartData.expenseData, backgroundColor: 'rgba(231, 76, 60, 0.7)' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }, 
                            ticks: { color: '#e0e1dd' } 
                        },
                        x: { 
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }, 
                            ticks: { 
                                color: '#e0e1dd',
                                maxRotation: maxTicksRotation,
                                minRotation: 0,
                                autoSkip: autoSkip, // 在非全屏且数据多时自动跳过部分标签
                                maxTicksLimit: isFullScreen ? 31 : 10 // 全屏时显示更多刻度
                            } 
                        }
                    },
                    plugins: { 
                        legend: { labels: { color: '#e0e1dd' } } 
                    }
                }
            };
        },
        renderChart(canvasId, isFullScreen = false) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if (this.chart) { this.chart.destroy(); }

            const config = this._getChartConfig(isFullScreen);
            this.chart = new Chart(ctx, config);
        },

        openChartModal() {
            if (!this.statistics.chartData.labels.length) return;
            this.isChartModalVisible = true;
            
            this.$nextTick(() => {
                const modalContainer = document.getElementById('modalChartContainer');
                if (!modalContainer) return;

                // 销毁旧图表
                if (this.chart) {
                    this.chart.destroy();
                    this.chart = null;
                }
                
                // 创建一个新的 canvas 用于模态框
                const modalCanvas = document.createElement('canvas');
                modalCanvas.id = 'modal-chart';
                modalContainer.innerHTML = ''; // 清空容器
                modalContainer.appendChild(modalCanvas);

                // 在新 canvas 上渲染全屏图表
                this.renderChart('modal-chart', true);
            });
        },

        closeChartModal() {
            this.isChartModalVisible = false;
            
            // 销毁模态框中的图表
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }

            this.$nextTick(() => {
                // 在原始位置重建图表
                this.renderChart('statsChart', false);
            });
        },

        changeStatsView(view) {
            this.statsView = view;
            const today = new Date();
            if (view === 'weekly') {
                const dayOfWeek = today.getDay();
                const startDate = new Date(today);
                startDate.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Week starts on Monday
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                this.statsStartDate = this.formatDateForInput(startDate);
                this.statsEndDate = this.formatDateForInput(endDate);
            } else if (view === 'monthly') {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                this.statsStartDate = this.formatDateForInput(firstDay);
                this.statsEndDate = this.formatDateForInput(lastDay);
            } else { return; }
            this.loadStatistics();
        },

        // =========================================================
        // 视图切换
        // =========================================================
        changeView(viewName) {
            this.activeView = viewName;
            // 当切换到统计视图时，自动加载统计数据
            if (viewName === 'stats') {
                // 确保在下一个 tick 执行，等待 DOM 更新
                this.$nextTick(() => {
                    this.loadStatistics();
                });
            }
        },

        // =========================================================
        // 滑动删除 (优化版，解决垂直滚动冲突)
        // =========================================================
        onTouchStart(event, index, type) {
            if (this.swipeState.swipingIndex !== null && this.swipeState.swipingIndex !== index) {
                this.resetSwipeState();
            }
            this.swipeState.startX = event.touches[0].clientX;
            this.swipeState.startY = event.touches[0].clientY; // 记录Y坐标
            this.swipeState.currentX = this.swipeState.startX;
            this.swipeState.swipingIndex = index;
            this.swipeState.swipingType = type;
            this.swipeState.directionLock = null; // 重置方向锁
            document.addEventListener('touchstart', this.handleGlobalTouch, { passive: true });
        },

        onTouchMove(event, index, type) {
            if (this.swipeState.swipingIndex !== index) return;

            const currentX = event.touches[0].clientX;
            const currentY = event.touches[0].clientY;
            const diffX = currentX - this.swipeState.startX;
            const diffY = currentY - this.swipeState.startY;

            // 只有在方向锁未设置时才进行判断
            if (!this.swipeState.directionLock) {
                // 如果垂直滑动距离大于水平滑动距离，则锁定为垂直滚动
                if (Math.abs(diffY) > Math.abs(diffX) + 3) { // 增加一个小的阈值，避免误判
                    this.swipeState.directionLock = 'vertical';
                } else {
                    this.swipeState.directionLock = 'horizontal';
                }
            }

            // 如果方向锁定为水平，则更新X坐标并阻止页面滚动
            if (this.swipeState.directionLock === 'horizontal') {
                this.swipeState.currentX = currentX;
                // 阻止默认的滚动行为
                event.preventDefault();
            }
        },

        onTouchEnd(event, index, type) {
            if (this.swipeState.swipingIndex !== index || this.swipeState.directionLock !== 'horizontal') {
                // 如果不是当前滑动项，或者方向是垂直，则不执行任何操作
                if (this.swipeState.directionLock === 'vertical') {
                    this.resetSwipeState();
                }
                return;
            }

            const diffX = this.swipeState.currentX - this.swipeState.startX;
            const swipeThreshold = -40;
            const itemWrapper = event.target.closest('.record-item-wrapper');

            if (itemWrapper) {
                if (diffX < swipeThreshold) {
                    // 完全划开
                    itemWrapper.style.transform = 'translateX(-80px)';
                } else {
                    // 未达到阈值，弹回
                    itemWrapper.style.transform = 'translateX(0)';
                }
                itemWrapper.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';
            }
        },

        getSwipeStyle(index, type) {
            if (this.swipeState.swipingIndex === index && this.swipeState.swipingType === type && this.swipeState.directionLock === 'horizontal') {
                const diffX = this.swipeState.currentX - this.swipeState.startX;
                const translateX = Math.max(-80, Math.min(0, diffX));
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
        resetSwipeState() {
            // 复位所有滑动项
            const wrappers = document.querySelectorAll('.record-item-wrapper');
            wrappers.forEach(w => {
                w.style.transform = 'translateX(0)';
                w.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';
            });
            this.swipeState.swipingIndex = null;
            this.swipeState.swipingType = null;
            this.swipeState.startX = 0;
            this.swipeState.currentX = 0;
            document.removeEventListener('touchstart', this.handleGlobalTouch, { passive: true });
        },
        handleGlobalTouch(e) {
            // 如果点击的是删除按钮或其父容器（swipe-action-delete），不复位滑动状态
            if (e.target.closest('.swipe-action-delete')) {
                return;
            }
            if (!e.target.closest('.record-item-wrapper')) {
                this.resetSwipeState();
            }
        },

        // =========================================================
        // 浮动操作按钮 (FAB)
        // =========================================================
        toggleFab() {
            this.fabActive = !this.fabActive;
        },
        openAddModal(type) {
            this.addModal.type = type;
            this.addModal.amount = '';
            this.newExpense.name = '';
            document.getElementById('addRecordModal').style.display = 'flex';
            this.fabActive = false;

            // 自动聚焦到金额输入框
            this.$nextTick(() => {
                if (this.$refs.addAmountInput) {
                    this.$refs.addAmountInput.focus();
                }
            });
        },
        closeAddModal() {
            document.getElementById('addRecordModal').style.display = 'none';
        },
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
                this.syncCurrentViewToHistory();
                this.loadStatistics();
            }
            
            this.closeAddModal();
            this.resetSwipeState(); // 重置滑动状态
        },
        
        // 格式化债务时间显示
        formatDebtTime(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const now = new Date();
            
            // 如果是今天，显示时间
            if (date.toDateString() === now.toDateString()) {
                return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
            // 否则直接显示月/日
            else {
                return `${date.getMonth() + 1}/${date.getDate()}`;
            }
        },

        // =========================================================
        // 语音识别功能
        // =========================================================
        startVoiceRecognition() {
            // 检查浏览器是否支持语音识别
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert('您的浏览器不支持语音识别功能，请使用Chrome或Safari浏览器。');
                return;
            }

            // 创建语音识别实例
            const recognition = new SpeechRecognition();
            recognition.lang = 'zh-CN'; // 设置为中文识别
            recognition.continuous = false; // 只识别一次
            recognition.interimResults = false; // 不返回中间结果
            recognition.maxAlternatives = 1; // 只返回一个最佳结果
            
            // 增强识别准确性
            if (recognition.continuous !== undefined) {
                recognition.continuous = false;
            }
            
            // 设置语音识别参数以提高准确性
            try {
                // 尝试设置额外参数（某些浏览器可能不支持）
                recognition.grammars = null;
            } catch (e) {
                // 忽略不支持的参数
            }
            
            // 开始识别
            this.isListening = true;
            this.fabActive = false; // 关闭FAB菜单
            
            // 视觉反馈
            console.log('请开始说话...');
            // 添加一个toast提示
            const toast = document.createElement('div');
            toast.textContent = '正在聆听...';
            toast.style.position = 'fixed';
            toast.style.bottom = '100px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(27, 38, 59, 0.9)';
            toast.style.color = '#ffd700';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '20px';
            toast.style.zIndex = '1000';
            toast.style.fontSize = '16px';
            toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            toast.style.transition = 'all 0.3s ease';
            toast.style.opacity = '1';
            toast.id = 'voice-toast';
            document.body.appendChild(toast);

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('识别结果:', transcript);
                // 移除提示
                const toastElement = document.getElementById('voice-toast');
                if (toastElement) {
                    // 添加成功提示
                    toastElement.textContent = '识别成功';
                    toastElement.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
                    toastElement.style.transform = 'translateX(-50%) scale(1.1)';
                    setTimeout(() => {
                        if (toastElement.parentNode) {
                            toastElement.style.opacity = '0';
                            setTimeout(() => {
                                if (toastElement.parentNode) {
                                    document.body.removeChild(toastElement);
                                }
                            }, 300);
                        }
                    }, 1000);
                }
                this.processVoiceCommand(transcript);
                this.isListening = false;
            };

            recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                // 移除提示
                const toastElement = document.getElementById('voice-toast');
                if (toastElement) {
                    toastElement.style.opacity = '0';
                    setTimeout(() => {
                        if (toastElement.parentNode) {
                            document.body.removeChild(toastElement);
                        }
                    }, 300);
                }
                // 显示错误信息
                const errorToast = document.createElement('div');
                errorToast.textContent = '识别失败: ' + event.error;
                errorToast.style.position = 'fixed';
                errorToast.style.bottom = '100px';
                errorToast.style.left = '50%';
                errorToast.style.transform = 'translateX(-50%)';
                errorToast.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
                errorToast.style.color = 'white';
                errorToast.style.padding = '10px 20px';
                errorToast.style.borderRadius = '20px';
                errorToast.style.zIndex = '1000';
                errorToast.style.fontSize = '16px';
                errorToast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                errorToast.style.opacity = '1';
                errorToast.style.transition = 'opacity 0.3s ease';
                document.body.appendChild(errorToast);
                setTimeout(() => {
                    errorToast.style.opacity = '0';
                    setTimeout(() => {
                        if (errorToast.parentNode) {
                            document.body.removeChild(errorToast);
                        }
                    }, 300);
                }, 3000);
                this.isListening = false;
            };

            recognition.onend = () => {
                console.log('语音识别结束');
                // 移除提示
                const toastElement = document.getElementById('voice-toast');
                if (toastElement) {
                    // 如果没有错误也没有结果，显示结束提示
                    if (toastElement.textContent === '正在聆听...') {
                        toastElement.textContent = '识别结束';
                        toastElement.style.backgroundColor = 'rgba(52, 152, 219, 0.9)';
                        setTimeout(() => {
                            toastElement.style.opacity = '0';
                            setTimeout(() => {
                                if (toastElement.parentNode) {
                                    document.body.removeChild(toastElement);
                                }
                            }, 300);
                        }, 1000);
                    }
                }
                this.isListening = false;
            };

            try {
                recognition.start();
            } catch (error) {
                console.error('启动语音识别失败:', error);
                // 移除提示
                const toastElement = document.getElementById('voice-toast');
                if (toastElement) {
                    toastElement.style.opacity = '0';
                    setTimeout(() => {
                        if (toastElement.parentNode) {
                            document.body.removeChild(toastElement);
                        }
                    }, 300);
                }
                // 显示错误信息
                const errorToast = document.createElement('div');
                errorToast.textContent = '启动语音识别失败，请检查麦克风权限';
                errorToast.style.position = 'fixed';
                errorToast.style.bottom = '100px';
                errorToast.style.left = '50%';
                errorToast.style.transform = 'translateX(-50%)';
                errorToast.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
                errorToast.style.color = 'white';
                errorToast.style.padding = '10px 20px';
                errorToast.style.borderRadius = '20px';
                errorToast.style.zIndex = '1000';
                errorToast.style.fontSize = '16px';
                errorToast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                errorToast.style.opacity = '1';
                errorToast.style.transition = 'opacity 0.3s ease';
                document.body.appendChild(errorToast);
                setTimeout(() => {
                    errorToast.style.opacity = '0';
                    setTimeout(() => {
                        if (errorToast.parentNode) {
                            document.body.removeChild(errorToast);
                        }
                    }, 300);
                }, 3000);
                this.isListening = false;
            }
        },

        // 中文数字转阿拉伯数字
        chineseToNumber(chinese) {
            const chineseNumMap = {
                '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, 
                '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
                '百': 100, '千': 1000, '万': 10000, '亿': 100000000
            };
            
            // 如果已经是数字，直接返回
            if (!isNaN(chinese)) {
                return parseFloat(chinese);
            }
            
            // 处理简单的中文数字
            let result = 0;
            let temp = 0;
            let unit = 1;
            
            for (let i = 0; i < chinese.length; i++) {
                const char = chinese[i];
                if (chineseNumMap[char] !== undefined) {
                    const num = chineseNumMap[char];
                    if (num >= 10) {
                        if (num === 10 || num === 100 || num === 1000) {
                            if (temp === 0) temp = 1;
                            temp *= num;
                            result += temp;
                            temp = 0;
                        } else {
                            // 万或亿
                            result = (result + temp) * num;
                            temp = 0;
                        }
                    } else {
                        temp = num;
                    }
                }
            }
            result += temp;
            
            return result > 0 ? result : 0;
        },

        processVoiceCommand(command) {
            // 移除空格和特殊字符
            let cleanCommand = command.trim().replace(/[，。、]/g, '');
            console.log('处理命令:', cleanCommand);
            
            // 增强中文数字识别
            const enhancedCommand = this.enhanceChineseNumbers(cleanCommand);
            console.log('增强后命令:', enhancedCommand);

            // 匹配"进账"命令 - 改进匹配模式（支持多笔记录）
            const incomePatterns = [
                /进账(\d+(?:\.\d+)?)元?/,
                /收入(\d+(?:\.\d+)?)元?/,
                /进账(\d+(?:\.\d+)?)/,
                /收入(\d+(?:\.\d+)?)/,
                /赚了(\d+(?:\.\d+)?)元?/,
                /收到(\d+(?:\.\d+)?)元?/
            ];
            
            // 匹配多笔记录模式（例如："两笔60"、"三笔100"）
            const multiIncomePatterns = [
                /([一二两三四五六七八九]\s*)笔.*?(\d+(?:\.\d+)?)元?/,
                /([一二两三四五六七八九]\s*)笔.*?(\d+(?:\.\d+)?)/,
                /(\d+)\s*笔.*?(\d+(?:\.\d+)?)元?/,
                /(\d+)\s*笔.*?(\d+(?:\.\d+)?)/
            ];
            
            // 检查是否为多笔记录命令
            for (const pattern of multiIncomePatterns) {
                const match = enhancedCommand.match(pattern);
                if (match) {
                    // 获取笔数和金额
                    const countStr = match[1];
                    const amountStr = match[2];
                    const count = this.chineseToNumber(countStr);
                    const amount = parseFloat(amountStr);
                    if (!isNaN(count) && count > 0 && !isNaN(amount) && amount > 0) {
                        // 添加多笔进账记录
                        let addedCount = 0;
                        for (let i = 0; i < count; i++) {
                            const newIncome = { id: 'income_' + Date.now() + Math.random(), amount: amount };
                            this.incomes.push(newIncome);
                            addedCount++;
                        }
                        this.scheduleSave();
                        alert(`成功添加${addedCount}笔进账记录，每笔${amount}元`);
                        return;
                    }
                }
            }
            
            // 检查单笔记录命令
            for (const pattern of incomePatterns) {
                const match = enhancedCommand.match(pattern);
                if (match) {
                    // 获取金额（第一个捕获组）
                    const amountStr = match[1];
                    const amount = parseFloat(amountStr);
                    if (!isNaN(amount) && amount > 0) {
                        // 添加进账记录
                        const newIncome = { id: 'income_' + Date.now() + Math.random(), amount: amount };
                        this.incomes.push(newIncome);
                        this.scheduleSave();
                        alert(`成功添加进账记录：${amount}元`);
                        return;
                    }
                }
            }

            // 匹配"支出"命令 - 改进匹配模式（支持多笔记录）
            const expensePatterns = [
                /支出(.+?)(\d+(?:\.\d+)?)元/,
                /支出(.+?)(\d+(?:\.\d+)?)$/,
                /花了(.+?)(\d+(?:\.\d+)?)元/,
                /消费(.+?)(\d+(?:\.\d+)?)元/,
                /买了(.+?)(\d+(?:\.\d+)?)元/,
                /支出(.+?)(\d+(?:\.\d+)?)[元块块钱]/,
                /花了(.+?)(\d+(?:\.\d+)?)[元块块钱]/,
                /消费(.+?)(\d+(?:\.\d+)?)[元块块钱]/,
                /买了(.+?)(\d+(?:\.\d+)?)[元块块钱]/
            ];
            
            // 匹配多笔支出记录模式
            const multiExpensePatterns = [
                /([一二两三四五六七八九]\s*)笔(.+?)(\d+(?:\.\d+)?)元/,
                /(\d+)\s*笔(.+?)(\d+(?:\.\d+)?)元/,
                /([一二两三四五六七八九]\s*)笔(.+?)(\d+(?:\.\d+)?)[元块块钱]/,
                /(\d+)\s*笔(.+?)(\d+(?:\.\d+)?)[元块块钱]/
            ];
            
            // 检查是否为多笔支出记录命令
            for (const pattern of multiExpensePatterns) {
                const match = enhancedCommand.match(pattern);
                if (match) {
                    // 获取笔数、项目名称和金额
                    const countStr = match[1];
                    let itemName = match[2].trim().replace(/[元块块钱]/g, '');
                    const amountStr = match[3];
                    const count = this.chineseToNumber(countStr);
                    const amount = parseFloat(amountStr);
                    if (!isNaN(count) && count > 0 && !isNaN(amount) && amount > 0 && itemName) {
                        // 特殊处理项目名称
                        itemName = itemName.replace(/\d+[元块块钱]?/g, '').trim();
                        if (!itemName) {
                            itemName = '未命名支出';
                        }
                        
                        // 添加多笔支出记录
                        let addedCount = 0;
                        for (let i = 0; i < count; i++) {
                            const newExpense = { id: 'expense_' + Date.now() + Math.random(), name: itemName, amount: amount };
                            this.expenses.push(newExpense);
                            addedCount++;
                        }
                        this.scheduleSave();
                        alert(`成功添加${addedCount}笔支出记录，项目：${itemName}，每笔${amount}元`);
                        return;
                    }
                }
            }
            
            // 检查单笔支出记录命令
            for (const pattern of expensePatterns) {
                const match = enhancedCommand.match(pattern);
                if (match) {
                    let itemName = match[1].trim().replace(/[元块块钱]/g, '');
                    const amountStr = match[2];
                    const amount = parseFloat(amountStr);
                    if (!isNaN(amount) && amount > 0 && itemName) {
                        // 特殊处理一些常见项目名称
                        // 移除可能的数字和单位
                        itemName = itemName.replace(/\d+[元块块钱]?/g, '').trim();
                        
                        // 如果项目名称为空，使用默认名称
                        if (!itemName) {
                            itemName = '未命名支出';
                        }
                        
                        // 添加支出记录
                        const newExpense = { id: 'expense_' + Date.now() + Math.random(), name: itemName, amount: amount };
                        this.expenses.push(newExpense);
                        this.scheduleSave();
                        alert(`成功添加支出记录：${itemName} ${amount}元`);
                        return;
                    }
                }
            }

            // 匹配另一种"支出"命令格式（金额在前，支持多笔）
            const expensePatterns2 = [
                /(\d+(?:\.\d+)?)元?.*支出(.+)/,
                /(\d+(?:\.\d+)?)元?.*花了(.+)/,
                /(\d+(?:\.\d+)?)元?.*消费(.+)/,
                /(\d+(?:\.\d+)?)元?.*买了(.+)/,
                /(\d+(?:\.\d+)?)[元块块钱]?.*支出(.+)/,
                /(\d+(?:\.\d+)?)[元块块钱]?.*花了(.+)/,
                /(\d+(?:\.\d+)?)[元块块钱]?.*消费(.+)/,
                /(\d+(?:\.\d+)?)[元块块钱]?.*买了(.+)/
            ];
            
            // 检查另一种格式的多笔支出记录命令
            const multiExpensePatterns2 = [
                /([一二两三四五六七八九]\s*)笔.*?(\d+(?:\.\d+)?)元?.*支出(.+)/,
                /([一二两三四五六七八九]\s*)笔.*?(\d+(?:\.\d+)?)元?.*花了(.+)/,
                /(\d+)\s*笔.*?(\d+(?:\.\d+)?)元?.*支出(.+)/,
                /(\d+)\s*笔.*?(\d+(?:\.\d+)?)元?.*花了(.+)/,
                /([一二两三四五六七八九]\s*)笔.*?(\d+(?:\.\d+)?)[元块块钱]?.*支出(.+)/,
                /([一二两三四五六七八九]\s*)笔.*?(\d+(?:\.\d+)?)[元块块钱]?.*花了(.+)/,
                /(\d+)\s*笔.*?(\d+(?:\.\d+)?)[元块块钱]?.*支出(.+)/,
                /(\d+)\s*笔.*?(\d+(?:\.\d+)?)[元块块钱]?.*花了(.+)/
            ];
            
            // 检查另一种格式的多笔支出记录命令
            for (const pattern of multiExpensePatterns2) {
                const match = enhancedCommand.match(pattern);
                if (match) {
                    // 获取笔数、金额和项目名称
                    const countStr = match[1];
                    const amountStr = match[2];
                    let itemName = match[3].trim();
                    const count = this.chineseToNumber(countStr);
                    const amount = parseFloat(amountStr);
                    if (!isNaN(count) && count > 0 && !isNaN(amount) && amount > 0 && itemName) {
                        // 特殊处理项目名称
                        itemName = itemName.replace(/\d+[元块块钱]?/g, '').trim();
                        if (!itemName) {
                            itemName = '未命名支出';
                        }
                        
                        // 添加多笔支出记录
                        let addedCount = 0;
                        for (let i = 0; i < count; i++) {
                            const newExpense = { id: 'expense_' + Date.now() + Math.random(), name: itemName, amount: amount };
                            this.expenses.push(newExpense);
                            addedCount++;
                        }
                        this.scheduleSave();
                        alert(`成功添加${addedCount}笔支出记录，项目：${itemName}，每笔${amount}元`);
                        return;
                    }
                }
            }
            
            // 检查另一种格式的单笔支出记录命令
            for (const pattern of expensePatterns2) {
                const match = enhancedCommand.match(pattern);
                if (match) {
                    const amountStr = match[1];
                    let itemName = match[2].trim();
                    const amount = parseFloat(amountStr);
                    if (!isNaN(amount) && amount > 0 && itemName) {
                        // 特殊处理一些常见项目名称
                        // 移除可能的数字和单位
                        itemName = itemName.replace(/\d+[元块块钱]?/g, '').trim();
                        
                        // 如果项目名称为空，使用默认名称
                        if (!itemName) {
                            itemName = '未命名支出';
                        }
                        
                        // 添加支出记录
                        const newExpense = { id: 'expense_' + Date.now() + Math.random(), name: itemName, amount: amount };
                        this.expenses.push(newExpense);
                        this.scheduleSave();
                        alert(`成功添加支出记录：${itemName} ${amount}元`);
                        return;
                    }
                }
            }

            // 如果没有匹配到任何命令
            alert('无法识别的命令，请说"进账金额"或"支出项目金额"，例如："进账60"或"支出矿泉水160元"');
        },
        
        // 增强中文数字识别
        enhanceChineseNumbers(text) {
            // 中文数字映射
            const chineseDigits = {
                '零': '0', '一': '1', '二': '2', '三': '3', '四': '4', 
                '五': '5', '六': '6', '七': '7', '八': '8', '九': '9'
            };
            
            // 简单的中文数字替换
            let result = text;
            
            // 处理常见的中文数字组合（按长度降序排列，避免部分替换影响）
            result = result.replace(/一百/g, '100');
            result = result.replace(/二十/g, '20');
            result = result.replace(/三十/g, '30');
            result = result.replace(/四十/g, '40');
            result = result.replace(/五十/g, '50');
            result = result.replace(/六十/g, '60');
            result = result.replace(/七十/g, '70');
            result = result.replace(/八十/g, '80');
            result = result.replace(/九十/g, '90');
            result = result.replace(/十/g, '10');
            
            // 替换单个中文数字
            for (const [chinese, digit] of Object.entries(chineseDigits)) {
                result = result.replace(new RegExp(chinese, 'g'), digit);
            }
            
            return result;
        }
    }
});
