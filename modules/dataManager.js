// 数据管理模块
export class DataManager {
    constructor() {
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

        this.cloudApiUrl = '/api'; // 基础 API 路径
        this.localHistoryKey = 'e7-local-history';
        this.localDebtsKey = 'e7-local-debts';
        this.history = {};
        this.debts = defaultDebts;
        this.defaultDebts = defaultDebts;
        this.isOffline = false;
        this.isLoading = false;
        this.dataLoaded = false;
        this.saveTimeout = null;
    }

    // 格式化金额
    formatAmount(amount) {
        return Number.isInteger(amount) ? amount : amount.toFixed(2);
    }

    // 带超时的fetch请求
    async fetchWithTimeout(resource, options = {}, timeout = 8000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    }

    // 加载数据
    async loadData() {
        this.isLoading = true;
        try {
            // 尝试从云端加载
            const response = await this.fetchWithTimeout(`${this.cloudApiUrl}/data`);
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
                this.debts = localDebts || cloudData.debts || [];
                // 处理烟草数据
                if (cloudData.tobacco) {
                    this.history.tobacco = cloudData.tobacco;
                }
                await this.saveDataToCloud(true); // 强制立即保存
                // 同步成功后，清除本地备份
                localStorage.removeItem(this.localHistoryKey);
                localStorage.removeItem(this.localDebtsKey);
                console.log('离线数据同步成功，已清除本地备份。');
            } else {
                // 没有离线数据，正常加载云端数据
                this.history = cloudData.history || {};
                this.debts = cloudData.debts || [];
                // 处理烟草数据
                if (cloudData.tobacco) {
                    this.history.tobacco = cloudData.tobacco;
                }
            }

        } catch (error) {
            console.warn('无法连接到 Cloudflare 或请求超时，切换到离线模式。', error);
            if (!this.isOffline) {
                alert('网络连接缓慢或中断，已启用离线模式。所有更改将保存在本地，联网后会自动同步。');
            }
            this.isOffline = true;
            this.history = this.loadDataFromLocal('history') || {};
            this.debts = this.loadDataFromLocal('debts') || [];
        } finally {
            this.isLoading = false;
            this.dataLoaded = true; // 标记数据加载完成
            this.normalizeDataIds(); // 清洗数据，确保都有ID
        }
    }

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
    }

    // 调度保存
    scheduleSave() {
        if (this.isLoading) return;
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.isOffline ? this.saveDataToLocal() : this.saveDataToCloud();
        }, 1500);
    }

    // 保存数据到云端
    async saveDataToCloud(force = false) {
        if (this.isOffline && !force) return; // 离线状态下不尝试保存到云端，除非是强制同步
        console.log('正在保存数据到 Cloudflare...');

        // 准备要发送的数据，包括烟草数据
        const dataToSend = { 
            history: this.history, 
            debts: this.debts,
            tobacco: this.history.tobacco || []
        };

        try {
            const response = await this.fetchWithTimeout(`${this.cloudApiUrl}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
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
    }

    // 保存数据到本地
    saveDataToLocal() {
        console.log('正在保存数据到本地...');
        localStorage.setItem(this.localHistoryKey, JSON.stringify(this.history));
        localStorage.setItem(this.localDebtsKey, JSON.stringify(this.debts));
    }

    // 从本地加载数据
    loadDataFromLocal(type) {
        const key = type === 'history' ? this.localHistoryKey : this.localDebtsKey;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // 同步当前视图到历史记录
    syncCurrentViewToHistory(selectedDate, incomes, expenses) {
        const dateKey = selectedDate;
        if (!this.history[dateKey]) {
            this.history[dateKey] = {};
        }
        // 只有在有数据时才同步，避免不必要的响应式更新
        if (incomes.length > 0) {
            this.history[dateKey].incomes = JSON.parse(JSON.stringify(incomes));
        } else {
            delete this.history[dateKey].incomes;
        }
        if (expenses.length > 0) {
            this.history[dateKey].expenses = JSON.parse(JSON.stringify(expenses));
        } else {
            delete this.history[dateKey].expenses;
        }
        // 如果一个日期的所有记录都被删除了，就移除这个日期键
        if (Object.keys(this.history[dateKey]).length === 0) {
            delete this.history[dateKey];
        }
    }

    // 加载指定日期的记录
    loadRecordsForDate(dateKey) {
        const records = this.history[dateKey];
        if (records) {
            const newIncomes = JSON.parse(JSON.stringify(records.incomes || []));
            const newExpenses = JSON.parse(JSON.stringify(records.expenses || []));
            return { incomes: newIncomes, expenses: newExpenses };
        } else {
            return { incomes: [], expenses: [] };
        }
    }

    // 导出数据
    async exportData() {
        try {
            const response = await this.fetchWithTimeout(`${this.cloudApiUrl}/export`);
            if (!response.ok) {
                throw new Error(`导出失败: ${response.statusText}`);
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            // 从响应头中获取文件名
            const disposition = response.headers.get('Content-Disposition');
            let filename = `export-${new Date().toISOString().replace(/[:.]/g, '')}.json`;
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                  filename = matches[1].replace(/['"]/g, '');
                }
            }
            
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('数据导出成功！');
        } catch (error) {
            console.error('导出错误:', error);
            alert(`导出失败: ${error.message}`);
        }
    }

    // 导入数据
    async importData(file) {
        if (!file) return false;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const fileContent = e.target.result;
                    // 简单的JSON格式校验
                    JSON.parse(fileContent); 

                    if (!confirm('确定要导入数据吗？这将覆盖服务器上已存在的相同ID的记录。')) {
                        return resolve(false);
                    }

                    const response = await this.fetchWithTimeout(`${this.cloudApiUrl}/import`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: fileContent,
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`导入失败: ${errorText}`);
                    }

                    const result = await response.json();
                    let summary = `导入完成！\n- 更新或插入记录: ${result.updated} 条`;
                    if (result.errors && result.errors.length > 0) {
                        summary += `\n- 发生错误: ${result.errors.length} 条`;
                        console.error('导入错误详情:', result.errors);
                    }
                    alert(summary);
                    
                    // 导入成功后，触发一次数据重新加载，以刷新界面
                    await this.loadData();
                    resolve(true);

                } catch (error) {
                    alert(`导入失败：${error.message}`);
                    console.error('导入错误', error);
                    reject(error);
                }
            };
            reader.onerror = (error) => {
                alert('读取文件失败！');
                console.error('文件读取错误', error);
                reject(error);
            };
            reader.readAsText(file);
        });
    }

    // 添加或更新债务
    addOrUpdateDebt(newDebt) {
        if (!newDebt.name || !newDebt.expression) {
            throw new Error('请输入债务名称和表达式');
        }
        
        const now = new Date().toISOString();
        let existingIndex = this.debts.findIndex(d => d.name === newDebt.name);
        let debtResult;
        try {
            debtResult = this.calculateExpression(newDebt.expression);
        } catch (e) {
            throw new Error('表达式格式错误');
        }

        let updatedDebtItem;

        if (existingIndex >= 0) {
            // 更新现有债务
            const oldDebt = this.debts[existingIndex];
            const newExpression = `${oldDebt.calculation}${newDebt.expression}`;
            const newResult = this.calculateExpression(newExpression);
            updatedDebtItem = { 
                name: newDebt.name, 
                calculation: newExpression, 
                result: newResult, 
                isNew: true, // 设置高亮
                createdAt: oldDebt.createdAt || now,
                updatedAt: now
            };
            this.debts.splice(existingIndex, 1); // 移除旧的
        } else {
            // 添加新债务
            updatedDebtItem = { 
                name: newDebt.name, 
                calculation: newDebt.expression, 
                result: debtResult, 
                isNew: true, // 设置高亮
                createdAt: now,
                updatedAt: now
            };
        }
        
        this.debts.unshift(updatedDebtItem); // 添加到最前面

        // 3秒后清除isNew标志
        setTimeout(() => {
            const currentDebtIndex = this.debts.findIndex(d => d.name === updatedDebtItem.name && d.createdAt === updatedDebtItem.createdAt);
            if (currentDebtIndex !== -1) {
                this.debts[currentDebtIndex].isNew = false;
            }
            // 触发保存，因为isNew状态变化也需要保存
            this.scheduleSave();
        }, 3000);
        
        // 调度保存
        this.scheduleSave();
        return this.debts; // 返回更新后的债务列表
    }
    
    // 编辑债务
    editDebt(editDebt) {
        if (editDebt.index >= 0) {
            const now = new Date().toISOString();
            const existingDebt = this.debts[editDebt.index];
            let debtResult;
            try {
                debtResult = this.calculateExpression(editDebt.expression);
            } catch (e) {
                throw new Error('表达式格式错误');
            }

            const updatedDebt = {
                name: editDebt.name,
                calculation: editDebt.expression,
                result: debtResult,
                isNew: true, // 设置高亮
                createdAt: existingDebt.createdAt || now,
                updatedAt: now
            };
            this.debts.splice(editDebt.index, 1);
            this.debts.unshift(updatedDebt);

            // 3秒后清除isNew标志
            setTimeout(() => {
                const currentDebtIndex = this.debts.findIndex(d => d.name === updatedDebt.name && d.createdAt === updatedDebt.createdAt);
                if (currentDebtIndex !== -1) {
                    this.debts[currentDebtIndex].isNew = false;
                }
                // 触发保存，因为isNew状态变化也需要保存
                this.scheduleSave();
            }, 3000);

            this.scheduleSave();
            return this.debts;
        }
        throw new Error('无效的债务索引');
    }
    
    // 删除债务
    deleteDebt(index) {
        if (index >= 0 && index < this.debts.length) {
            this.debts.splice(index, 1);
            this.scheduleSave();
            return this.debts;
        }
        throw new Error('无效的债务索引');
    }
    
    // 计算表达式
    calculateExpression(expression) {
        try {
            const expr = String(expression).replace(/=/g, '').replace(/＋/g, '+').replace(/－/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
            return Function(`"use strict"; return (${expr})`)();
        } catch (e) { 
            console.error('表达式计算错误', e); 
            throw new Error('表达式格式错误'); 
        }
    }
    
    // 清理资源
    destroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
    }
}
