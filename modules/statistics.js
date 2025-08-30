// 统计管理模块
export class StatisticsManager {
    constructor() {
        this.chart = null;
        this.expenseChart = null;
        this.statistics = { 
            totalIncome: 0, 
            totalExpense: 0, 
            netIncome: 0, 
            avgDailyIncome: 0, 
            chartData: [] 
        };
        this.expenseBreakdown = [];
        this.expandedExpenseItem = null;
    }

    // 格式化日期输入
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 加载统计数据
    loadStatistics(history, statsStartDate, statsEndDate) {
        if (!statsStartDate || !statsEndDate) {
            // 如果没有日期，自动设置为当月
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            statsStartDate = this.formatDateForInput(firstDay);
            statsEndDate = this.formatDateForInput(lastDay);
        }
        
        const startDate = new Date(statsStartDate);
        const endDate = new Date(statsEndDate);
        endDate.setHours(23, 59, 59, 999);
        
        let totalIncome = 0, totalExpense = 0, daysInRange = 0;
        const dailyData = {};
        
        for (const dateKey in history) {
            const recordDate = new Date(dateKey);
            if (recordDate >= startDate && recordDate <= endDate) {
                const record = history[dateKey];
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
        
        this.calculateExpenseBreakdown(history, startDate, endDate);
        
        return this.statistics;
    }

    // 计算支出项目分析
    calculateExpenseBreakdown(history, startDate, endDate) {
        const expenseMap = {};
        let totalExpense = 0;

        for (const dateKey in history) {
            const recordDate = new Date(dateKey);
            if (recordDate >= startDate && recordDate <= endDate) {
                const record = history[dateKey];
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
                details: data.details.sort((a, b) => new Date(b.date) - new Date(a.date)),
                percentage: ((data.total / totalExpense) * 100).toFixed(2),
                color: colors[colorIndex++ % colors.length]
            }));
    }

    // 切换支出详情展开状态
    toggleExpenseDetail(itemName) {
        if (this.expandedExpenseItem === itemName) {
            this.expandedExpenseItem = null;
        } else {
            this.expandedExpenseItem = itemName;
        }
    }

    // 渲染主统计图表
    renderChart(canvasId, isFullScreen = false) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (this.chart) { 
            this.chart.destroy(); 
        }

        const config = this.getChartConfig(isFullScreen);
        this.chart = new Chart(ctx, config);
    }

    // 获取图表配置
    getChartConfig(isFullScreen = false) {
        const labels = this.statistics.chartData.labels || [];
        const maxTicksRotation = isFullScreen ? 45 : 90;
        const autoSkip = labels.length > 15 && !isFullScreen;

        return {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { 
                        label: '收入', 
                        data: this.statistics.chartData.incomeData, 
                        backgroundColor: 'rgba(46, 204, 113, 0.7)' 
                    },
                    { 
                        label: '支出', 
                        data: this.statistics.chartData.expenseData, 
                        backgroundColor: 'rgba(231, 76, 60, 0.7)' 
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }, 
                        ticks: { color: '#666666' }
                    },
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }, 
                        ticks: { 
                            color: '#666666',
                            maxRotation: maxTicksRotation,
                            minRotation: 0,
                            autoSkip: autoSkip,
                            maxTicksLimit: isFullScreen ? 31 : 10
                        } 
                    }
                },
                plugins: { 
                    legend: { labels: { color: '#666666' } }
                }
            }
        };
    }

    // 渲染支出环形图
    renderExpenseChart() {
        const canvas = document.getElementById('expenseChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (this.expenseChart) {
            this.expenseChart.destroy();
        }

        if (this.expenseBreakdown.length === 0) {
            return;
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
                        display: false
                    },
                    tooltip: {
                        position: 'nearest',
                        intersect: false,
                        padding: 8,
                        backgroundColor: 'rgba(27, 38, 59, 0.9)',
                        titleColor: '#ffd700',
                        bodyColor: '#FFFFFF',
                        borderColor: '#415a77',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: true,
                        bodyFont: {
                            size: 12
                        },
                        titleFont: {
                            size: 14
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    const value = context.raw.toFixed(2);
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? (context.parsed / total * 100).toFixed(2) : 0;
                                    label += `${value}元 (${percentage}%)`;
                                }
                                return label;
                            }
                        },
                        external: function(context) {
                            const tooltip = context.tooltip;
                            const el = tooltip.el;
                            
                            if (el && el.style) {
                                el.style.overflow = 'visible';
                                el.style.whiteSpace = 'nowrap';
                            }
                        }
                    }
                },
                elements: {
                    arc: {
                        borderWidth: 0
                    }
                }
            }
        });
    }

    // 切换统计视图
    changeStatsView(view, statsStartDate, statsEndDate) {
        const today = new Date();
        if (view === 'weekly') {
            const dayOfWeek = today.getDay();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            statsStartDate = this.formatDateForInput(startDate);
            statsEndDate = this.formatDateForInput(endDate);
        } else if (view === 'monthly') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            statsStartDate = this.formatDateForInput(firstDay);
            statsEndDate = this.formatDateForInput(lastDay);
        }
        
        return { statsStartDate, statsEndDate };
    }

    // 打开图表模态框
    openChartModal() {
        if (!this.statistics.chartData.labels.length) return;
        // 显示模态框的逻辑应该在UI层处理
    }

    // 关闭图表模态框
    closeChartModal() {
        // 关闭模态框的逻辑应该在UI层处理
    }

    // 渲染模态框中的图表
    renderModalChart() {
        // 销毁旧图表
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // 创建一个新的 canvas 用于模态框
        const modalContainer = document.getElementById('modalChartContainer');
        if (!modalContainer) return;

        // 清空容器
        modalContainer.innerHTML = '';
        
        // 创建新canvas
        const modalCanvas = document.createElement('canvas');
        modalCanvas.id = 'modal-chart';
        modalContainer.appendChild(modalCanvas);

        // 在新 canvas 上渲染全屏图表
        this.renderChart('modal-chart', true);
    }

    // 清理资源
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        if (this.expenseChart) {
            this.expenseChart.destroy();
            this.expenseChart = null;
        }
    }
}
