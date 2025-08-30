// 烟草管理模块
export class TobaccoManager {
    constructor() {
        this.tobaccoRecords = [];
        this.tobaccoStats = [];
        this.tobaccoBrandHistory = [];
        this.tobaccoPeriodStart = null;
        this.tobaccoPeriodEnd = null;
        this.newTobaccoRecord = {
            date: '',
            brand: '',
            quantity: 1,
            price: 0.00
        };
        this.editTobaccoRecordData = {
            id: '',
            date: '',
            brand: '',
            quantity: 1,
            price: 0
        };
        this.originalEditRecord = null;
        this.tobaccoPieChart = null;
        this.tobaccoLineChart = null;
        this.tobaccoSwipeState = {
            startX: 0,
            currentX: 0,
            swipingRecord: null,
            directionLock: null
        };
    }

    // 初始化烟草周期
    initTobaccoPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        
        // 确保日期初始化正确
        this.tobaccoPeriodStart = new Date(year, month - 1, 6);
        this.tobaccoPeriodEnd = new Date(year, month, 5);
    }

    // 计算总价
    calculateTotalPrice() {
        return Math.round(this.newTobaccoRecord.quantity * this.newTobaccoRecord.price);
    }

    // 增加数量
    increaseQuantity() {
        this.newTobaccoRecord.quantity++;
    }

    // 减少数量
    decreaseQuantity() {
        if (this.newTobaccoRecord.quantity > 1) {
            this.newTobaccoRecord.quantity--;
        }
    }

    // 添加烟草消费记录
    addTobaccoRecord(newTobaccoRecord, history) {
        // 验证输入
        if (!newTobaccoRecord.date || !newTobaccoRecord.brand || 
            newTobaccoRecord.quantity <= 0) { // 移除对 price <= 0 的验证
            throw new Error('请填写完整的烟草消费记录信息');
        }

        // 创建新的烟草消费记录
        const newRecord = {
            id: 'tobacco_' + Date.now() + Math.random(),
            date: newTobaccoRecord.date,
            brand: newTobaccoRecord.brand,
            quantity: newTobaccoRecord.quantity,
            price: newTobaccoRecord.price
        };

        // 将记录添加到历史记录中
        if (!history.tobacco) {
            history.tobacco = [];
        }
        history.tobacco.push(newRecord);

        // 更新品牌历史记录
        if (!this.tobaccoBrandHistory.includes(newTobaccoRecord.brand)) {
            this.tobaccoBrandHistory.push(newTobaccoRecord.brand);
        }

        alert('烟草消费记录添加成功！');
        return newRecord;
    }

    // 重置新烟草记录表单
    resetNewTobaccoRecord() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        this.newTobaccoRecord = {
            date: formattedDate,
            brand: '',
            quantity: 1,
            price: 0.00
        };
    }

    // 加载烟草统计数据
    loadTobaccoStatistics(history) {
        // 保存当前展开的品牌
        const expandedBrands = this.tobaccoStats
            .filter(stat => stat.expanded)
            .map(stat => stat.name);

        // 获取当前周期的开始和结束日期
        const periodStart = this.tobaccoPeriodStart;
        const periodEnd = this.tobaccoPeriodEnd;

        // 获取周期内的烟草消费记录
        const periodRecords = (history.tobacco || []).filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= periodStart && recordDate <= periodEnd;
        });

        // 按品牌分组统计
        const brandStats = {};
        periodRecords.forEach(record => {
            if (!brandStats[record.brand]) {
                brandStats[record.brand] = {
                    name: record.brand,
                    records: [],
                    totalQuantity: 0,
                    totalAmount: 0,
                    expanded: false
                };
            }
            brandStats[record.brand].records.push(record);
            brandStats[record.brand].totalQuantity += record.quantity;
            brandStats[record.brand].totalAmount += Math.round(record.quantity * record.price);
        });

        // 转换为数组并按总金额排序
        this.tobaccoStats = Object.values(brandStats).sort((a, b) => b.totalAmount - a.totalAmount);

        // 恢复展开状态
        this.tobaccoStats.forEach(stat => {
            if (expandedBrands.includes(stat.name)) {
                stat.expanded = true;
            }
        });

        // 更新品牌历史记录
        this.tobaccoBrandHistory = [...new Set((history.tobacco || []).map(record => record.brand))];

        // 渲染图表
        this.renderTobaccoCharts(history);
    }

    // 切换品牌面板展开/收起
    toggleBrandPanel(index) {
        this.tobaccoStats[index].expanded = !this.tobaccoStats[index].expanded;
    }

    // 格式化日期显示
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }

    // 上一个周期
    prevTobaccoPeriod() {
        // 将周期开始日期和结束日期都向前移动一个月
        this.tobaccoPeriodStart.setMonth(this.tobaccoPeriodStart.getMonth() - 1);
        this.tobaccoPeriodEnd.setMonth(this.tobaccoPeriodEnd.getMonth() - 1);
    }

    // 下一个周期
    nextTobaccoPeriod() {
        // 将周期开始日期和结束日期都向后移动一个月
        this.tobaccoPeriodStart.setMonth(this.tobaccoPeriodStart.getMonth() + 1);
        this.tobaccoPeriodEnd.setMonth(this.tobaccoPeriodEnd.getMonth() + 1);
    }

    // 计算周期显示文本
    tobaccoPeriodDisplay() {
        // 确保日期对象存在
        if (!this.tobaccoPeriodStart || !this.tobaccoPeriodEnd) {
            return '';
        }
        
        const startMonth = this.tobaccoPeriodStart.getMonth() + 1;
        const startDay = this.tobaccoPeriodStart.getDate();
        const endMonth = this.tobaccoPeriodEnd.getMonth() + 1;
        const endDay = this.tobaccoPeriodEnd.getDate();
        const year = this.tobaccoPeriodEnd.getFullYear();
        
        return `${year}年${startMonth}月${startDay}日-${endMonth}月${endDay}日`;
    }

    // 编辑烟草记录
    editTobaccoRecord(record) {
        // 深度克隆一份原始记录，用于后续比较
        this.originalEditRecord = JSON.parse(JSON.stringify(record));
        
        // 设置编辑数据
        this.editTobaccoRecordData = {
            id: record.id,
            date: record.date,
            brand: record.brand,
            quantity: record.quantity,
            price: record.price
        };
    }
    
    // 更新编辑的烟草记录数据
    updateEditTobaccoRecordData(data) {
        this.editTobaccoRecordData = { ...this.editTobaccoRecordData, ...data };
    }

    // 保存烟草记录
    saveTobaccoRecord(history) {
        // 检查数据是否有变动
        const isUnchanged = this.originalEditRecord &&
            this.originalEditRecord.date === this.editTobaccoRecordData.date &&
            this.originalEditRecord.brand === this.editTobaccoRecordData.brand &&
            this.originalEditRecord.quantity === this.editTobaccoRecordData.quantity &&
            this.originalEditRecord.price === this.editTobaccoRecordData.price;

        if (isUnchanged) {
            // 如果数据未变动，直接返回成功
            return true;
        }

        // 验证输入
        if (!this.editTobaccoRecordData.date || !this.editTobaccoRecordData.brand || 
            this.editTobaccoRecordData.quantity <= 0) { // 价格可以为0
            alert('请填写完整的烟草消费记录信息');
            return false;
        }
        
        // 查找并更新记录
        const index = history.tobacco.findIndex(r => r.id === this.editTobaccoRecordData.id);
        if (index !== -1) {
            history.tobacco[index] = {
                id: this.editTobaccoRecordData.id,
                date: this.editTobaccoRecordData.date,
                brand: this.editTobaccoRecordData.brand,
                quantity: this.editTobaccoRecordData.quantity,
                price: this.editTobaccoRecordData.price
            };
            
            // 更新品牌历史记录
            if (!this.tobaccoBrandHistory.includes(this.editTobaccoRecordData.brand)) {
                this.tobaccoBrandHistory.push(this.editTobaccoRecordData.brand);
            }
            
            alert('烟草消费记录更新成功！');
            return true;
        }
        
        return false;
    }

    // 删除烟草记录
    deleteTobaccoRecord(record, history) {
        // 从历史记录中删除
        const index = history.tobacco.findIndex(r => r.id === record.id);
        if (index !== -1) {
            history.tobacco.splice(index, 1);
            return true;
        }
        return false;
    }

    // 渲染烟草消费图表
    renderTobaccoCharts(history) {
        // 销毁现有的图表实例
        if (this.tobaccoPieChart) {
            this.tobaccoPieChart.destroy();
            this.tobaccoPieChart = null;
        }
        if (this.tobaccoLineChart) {
            this.tobaccoLineChart.destroy();
            this.tobaccoLineChart = null;
        }

        // 渲染饼图
        const pieCanvas = document.getElementById('tobaccoPieChart');
        if (pieCanvas && this.tobaccoStats.length > 0) {
            const pieCtx = pieCanvas.getContext('2d');
            const brandNames = this.tobaccoStats.map(stat => stat.name);
            const brandAmounts = this.tobaccoStats.map(stat => stat.totalAmount);
            const colors = ['#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#2ecc71', '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#d35400'];

            this.tobaccoPieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: brandNames,
                    datasets: [{
                        data: brandAmounts,
                        backgroundColor: colors.slice(0, brandNames.length),
                        borderColor: '#1b263b',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: '#333333',
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                                    return `${label}: ${value.toFixed(2)}元 (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // 渲染折线图
        const lineCanvas = document.getElementById('tobaccoLineChart');
        if (lineCanvas && this.tobaccoStats.length > 0) {
            const lineCtx = lineCanvas.getContext('2d');
            
            // 按日期统计每日消费
            const dailyData = {};
            (history.tobacco || []).forEach(record => {
                const recordDate = new Date(record.date);
                if (recordDate >= this.tobaccoPeriodStart && recordDate <= this.tobaccoPeriodEnd) {
                    const dateKey = this.formatDateForInput(recordDate);
                    if (!dailyData[dateKey]) {
                        dailyData[dateKey] = 0;
                    }
                    dailyData[dateKey] += record.quantity * record.price;
                }
            });

            // 转换为图表数据
            const sortedDates = Object.keys(dailyData).sort();
            const labels = sortedDates.map(date => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getDate()}`;
            });
            const data = sortedDates.map(date => dailyData[date]);

            this.tobaccoLineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '每日消费金额',
                        data: data,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                color: '#333333'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                color: '#333333'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#333333'
                            }
                        }
                    }
                }
            });
        }
    }

    // 格式化日期输入
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 烟草记录触摸开始事件处理
    onTobaccoTouchStart(event, record) {
        // 重置滑动状态
        this.tobaccoSwipeState = {
            startX: event.touches[0].clientX,
            currentX: event.touches[0].clientX,
            swipingRecord: record,
            directionLock: null
        };
    }

    // 烟草记录触摸移动事件处理
    onTobaccoTouchMove(event, record) {
        // 如果不是当前滑动的记录，直接返回
        if (this.tobaccoSwipeState.swipingRecord !== record) return;
        
        const currentX = event.touches[0].clientX;
        const diffX = currentX - this.tobaccoSwipeState.startX;
        const absDiffX = Math.abs(diffX);
        
        // 只有在方向锁未设置且水平滑动距离足够大时才锁定方向
        if (!this.tobaccoSwipeState.directionLock && absDiffX > 10) {
            this.tobaccoSwipeState.directionLock = 'horizontal';
            this.tobaccoSwipeState.currentX = currentX;
        }
        
        // 如果方向锁定为水平，则更新当前X坐标
        if (this.tobaccoSwipeState.directionLock === 'horizontal') {
            this.tobaccoSwipeState.currentX = currentX;
            // 阻止默认滚动行为
            event.preventDefault();
        }
    }

    // 烟草记录触摸结束事件处理
    onTobaccoTouchEnd(event, record) {
        // 如果不是当前滑动的记录或方向未锁定为水平，直接返回
        if (this.tobaccoSwipeState.swipingRecord !== record || this.tobaccoSwipeState.directionLock !== 'horizontal') return;
        
        const diffX = this.tobaccoSwipeState.currentX - this.tobaccoSwipeState.startX;
        const absDiffX = Math.abs(diffX);
        const swipeThreshold = 50; // 滑动阈值
        
        // 如果滑动距离超过阈值，则显示操作按钮
        if (absDiffX > swipeThreshold) {
            // 这里我们不需要做任何事情，因为CSS已经处理了按钮的显示
        } else {
            // 否则重置滑动状态
            this.resetTobaccoSwipeState(record);
        }
    }

    // 获取烟草滑动样式
    getTobaccoSwipeStyle(record) {
        // 如果是当前滑动的记录且方向锁定为水平，则应用变换
        if (this.tobaccoSwipeState.swipingRecord === record && this.tobaccoSwipeState.directionLock === 'horizontal') {
            const diffX = this.tobaccoSwipeState.currentX - this.tobaccoSwipeState.startX;
            const translateX = Math.max(-80, Math.min(0, diffX)); // 限制在-80到0之间
            return {
                transform: `translateX(${translateX}px)`,
                transition: 'none'
            };
        }
        return {
            transform: 'translateX(0)',
            transition: 'transform 0.3s ease'
        };
    }

    // 重置烟草滑动状态
    resetTobaccoSwipeState(record) {
        // 重置指定记录的滑动状态
        this.tobaccoSwipeState = {
            startX: 0,
            currentX: 0,
            swipingRecord: null,
            directionLock: null
        };
    }

    // 清理资源
    destroy() {
        if (this.tobaccoPieChart) {
            this.tobaccoPieChart.destroy();
            this.tobaccoPieChart = null;
        }
        if (this.tobaccoLineChart) {
            this.tobaccoLineChart.destroy();
            this.tobaccoLineChart = null;
        }
    }
}
