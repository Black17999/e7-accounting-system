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
            { name: '卢总', calculation: '2020+2000-2020-60-1190+1160-610-320', result: 980 },
            { name: '啊华', calculation: '500+1120-500-500', result: 620 },
            { name: '胖子', calculation: '4640+520', result: 5160 },
            { name: '吹毛', calculation: '1200', result: 1200 },
            { name: '啊涛', calculation: '600', result: 600 },
            { name: 'H', calculation: '600', result: 600 },
            { name: '白毛', calculation: '2330-530-100-200-1000+860', result: 1360 },
            { name: '小轩', calculation: '4045+220+100+30+470+100-60', result: 4905 },
            { name: '阿福', calculation: '860', result: 860 },
            { name: '老王', calculation: '1000', result: 1000 },
            { name: '小吴', calculation: '1450', result: 1450 },
            { name: '浩云', calculation: '2010-500', result: 1510 },
            { name: '秋莲', calculation: '1640-640', result: 1000 },
            { name: '李刚', calculation: '4820-2000+2620', result: 5440 },
            { name: '阿光', calculation: '3850+1200', result: 5050 },
            { name: '啊波', calculation: '4890+1230+3020', result: 9140 },
            { name: '阿冯', calculation: '1500+930', result: 2430 },
            { name: '老计', calculation: '3730-800', result: 2930 },
            { name: '厨师', calculation: '100', result: 100 },
            { name: '湖南佬', calculation: '2000', result: 2000 }
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
            saveTimeout: null,
            isLoading: true,
            isOffline: false, // 网络状态标志
            activeView: 'records', // 新增：控制当前显示的视图
            swipeState: { // 新增：滑动删除状态
                startX: 0,
                currentX: 0,
                swipingIndex: null,
                swipingType: null,
            },
            fabActive: false, // 新增：FAB激活状态
            addModal: { // 新增：新增记录模态框状态
                show: false,
                type: 'income',
                title: '',
                amount: ''
            },
        };
    },
    computed: {
        totalIncome() {
            const incomeSum = this.incomes.reduce((sum, income) => sum + Number(income.amount), 0);
            const expenseSum = this.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
            return incomeSum - expenseSum;
        }
    },
    watch: {
        incomes: { handler() { this.scheduleSave(); }, deep: true },
        expenses: { handler() { this.scheduleSave(); }, deep: true },
        debts: { handler() { this.scheduleSave(); }, deep: true }
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
            const existingIndex = this.debts.findIndex(d => d.name === this.newDebt.name);
            if (existingIndex >= 0) {
                const debt = this.debts.splice(existingIndex, 1)[0];
                const newExpression = `${debt.calculation}${this.newDebt.expression}`;
                const result = this.calculateExpression(newExpression);
                this.debts.unshift({ name: this.newDebt.name, calculation: newExpression, result: result, isNew: true });
            } else {
                const result = this.calculateExpression(this.newDebt.expression);
                this.debts.unshift({ name: this.newDebt.name, calculation: this.newDebt.expression, result: result, isNew: true });
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
                const updatedDebt = {
                    name: this.editDebt.name,
                    calculation: this.editDebt.expression,
                    result: this.calculateExpression(this.editDebt.expression),
                    isNew: true
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
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '480px';
            document.body.appendChild(container);
            const textRecord = document.getElementById('textRecord');
            const clone = textRecord.cloneNode(true);
            clone.style.display = 'block';
            clone.classList.add('plain-text-mode');
            container.appendChild(clone);
            setTimeout(() => {
                const contentHeight = clone.scrollHeight;
                container.style.height = contentHeight + 'px';
                clone.style.height = 'auto';
                clone.style.width = '480px';
                clone.style.background = '#142133';
                html2canvas(clone, { scale: 2, backgroundColor: '#142133', width: 480, height: contentHeight, scrollY: -window.scrollY, useCORS: true, logging: false, allowTaint: true })
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
            }, 100);
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
            this.renderChart();
        },
        renderChart() {
            // 确保图表容器存在
            const canvas = document.getElementById('statsChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if (this.chart) { this.chart.destroy(); }
            this.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: this.statistics.chartData.labels,
                    datasets: [
                        { label: '收入', data: this.statistics.chartData.incomeData, backgroundColor: 'rgba(46, 204, 113, 0.7)' },
                        { label: '支出', data: this.statistics.chartData.expenseData, backgroundColor: 'rgba(231, 76, 60, 0.7)' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#e0e1dd' } },
                        x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#e0e1dd' } }
                    },
                    plugins: { legend: { labels: { color: '#e0e1dd' } } }
                }
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
        // 滑动删除
        // =========================================================
        onTouchStart(event, index, type) {
            // 如果已经有其他项处于滑动状态，则重置
            if (this.swipeState.swipingIndex !== null && this.swipeState.swipingIndex !== index) {
                this.resetSwipeState();
            }
            this.swipeState.startX = event.touches[0].clientX;
            this.swipeState.currentX = this.swipeState.startX;
            this.swipeState.swipingIndex = index;
            this.swipeState.swipingType = type;
        },
        onTouchMove(event, index, type) {
            if (this.swipeState.swipingIndex !== index) return;
            this.swipeState.currentX = event.touches[0].clientX;
        },
        onTouchEnd(event, index, type) {
            if (this.swipeState.swipingIndex !== index) return;
            const diffX = this.swipeState.currentX - this.swipeState.startX;
            const swipeThreshold = -50; // 滑动超过50px触发

            if (diffX < swipeThreshold) {
                // 保持打开状态
                this.swipeState.currentX = this.swipeState.startX - 80; // 80是删除按钮宽度
            } else {
                // 重置
                this.resetSwipeState();
            }
        },
        getSwipeStyle(index, type) {
            if (this.swipeState.swipingIndex === index && this.swipeState.swipingType === type) {
                const diffX = this.swipeState.currentX - this.swipeState.startX;
                const translateX = Math.max(-80, Math.min(0, diffX));
                return {
                    transform: `translateX(${translateX}px)`,
                    transition: 'transform 0.1s linear' // 移动时快速响应
                };
            }
            return {
                transform: 'translateX(0px)',
                transition: 'transform 0.3s ease' // 恢复时平滑
            };
        },
        resetSwipeState() {
            this.swipeState.swipingIndex = null;
            this.swipeState.swipingType = null;
            this.swipeState.startX = 0;
            this.swipeState.currentX = 0;
        },

        // =========================================================
        // 浮动操作按钮 (FAB)
        // =========================================================
        toggleFab() {
            this.fabActive = !this.fabActive;
        },
        openAddModal(type) {
            this.addModal.type = type;
            this.addModal.title = type === 'income' ? '新增进账' : '新增支出';
            this.addModal.amount = '';
            this.newExpense.name = ''; // 清空可能残留的支出项目名
            document.getElementById('addRecordModal').style.display = 'flex';
            this.fabActive = false; // 关闭FAB菜单
        },
        closeAddModal() {
            document.getElementById('addRecordModal').style.display = 'none';
        },
        addRecord() {
            const amount = parseFloat(this.addModal.amount);
            if (isNaN(amount) || amount <= 0) {
                alert('请输入有效的金额');
                return;
            }

            if (this.addModal.type === 'income') {
                const newIncome = { id: 'income_' + Date.now() + Math.random(), amount: amount };
                this.incomes.push(newIncome);
            } else if (this.addModal.type === 'expense') {
                if (!this.newExpense.name.trim()) {
                    alert('请输入支出项目');
                    return;
                }
                const newExpense = { id: 'expense_' + Date.now() + Math.random(), name: this.newExpense.name, amount: amount };
                this.expenses.push(newExpense);
            }
            
            this.closeAddModal();
            this.resetSwipeState(); // 重置滑动状态
        }
    }
});
