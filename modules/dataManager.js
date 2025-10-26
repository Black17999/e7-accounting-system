
import { BackupManager } from './backupManager.js';
import { OfflineQueueManager } from './offlineQueue.js';

// 数据管理模块 - 使用 Supabase
export class DataManager {
    constructor() {
        this.backupManager = null; // 将在初始化后设置
        this.offlineQueue = null; // 离线操作队列
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

        this.history = {};
        this.debts = defaultDebts;
        this.defaultDebts = defaultDebts;
        this.isOffline = false;
        this.isLoading = false;
        this.dataLoaded = false;
        this.saveTimeout = null;
        
        // Supabase 管理器 (将由 main-modular.js 注入)
        this.supabaseManager = null;
        this.supabaseDataManager = null;
    }

    // 格式化金额
    formatAmount(amount) {
        return Number.isInteger(amount) ? amount : amount.toFixed(2);
    }

    // 快速加载初始数据（只加载最近30天+债务）
    async loadData() {
        this.isLoading = true;
        const startTime = Date.now();
        
        try {
            if (!this.supabaseDataManager) {
                throw new Error('Supabase 未初始化');
            }
            
            console.log('开始快速加载初始数据...');
            
            // 计算最近30天的日期范围
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            const startDate = thirtyDaysAgo.toISOString().split('T')[0];
            
            // 并行加载：最近30天的交易记录 + 债务记录
            const [recentTransactions, loadedDebts] = await Promise.all([
                this.supabaseDataManager.getAllTransactions(startDate, null),
                this.supabaseDataManager.getAllDebts()
            ]);
            
            console.log(`加载了最近30天的 ${recentTransactions.length} 条交易记录`);
            
            // 将交易记录转换为 history 格式
            this.history = {};
            recentTransactions.forEach(transaction => {
                const dateKey = transaction.date;
                if (!this.history[dateKey]) {
                    this.history[dateKey] = { incomes: [], expenses: [] };
                }
                
                if (transaction.type === 'income') {
                    this.history[dateKey].incomes.push({
                        id: transaction.client_id || transaction.id,
                        amount: transaction.amount,
                        category: transaction.category || '默认'
                    });
                } else if (transaction.type === 'expense') {
                    this.history[dateKey].expenses.push({
                        id: transaction.client_id || transaction.id,
                        name: transaction.name,
                        amount: transaction.amount
                    });
                }
            });
            
            // 加载债务记录
            this.debts = Array.isArray(loadedDebts) ? loadedDebts : [];
            
            // 初始化烟草记录为空（后台加载）
            this.history.tobacco = [];
            
            const loadTime = Date.now() - startTime;
            console.log(`快速加载完成，耗时: ${loadTime}ms`);
            this.isOffline = false;
            
            // 后台加载完整数据（不阻塞UI）
            this.loadFullDataInBackground();
            
        } catch (error) {
            console.error('从 Supabase 加载数据失败:', error);
            this.isOffline = true;
            // 尝试从本地加载
            this.history = this.loadDataFromLocal('history') || {};
            const localDebts = this.loadDataFromLocal('debts');
            this.debts = Array.isArray(localDebts) ? localDebts : this.defaultDebts;
        } finally {
            this.isLoading = false;
            this.dataLoaded = true;
            this.normalizeDataIds();

            // 加载完成后2秒，在后台检查数据一致性
            if (!this.isOffline) {
                setTimeout(() => {
                    this.checkDataIntegrity().catch(err => {
                        console.warn('数据一致性检查失败:', err);
                    });
                }, 2000);
            }
        }
    }
    
    // 后台加载完整数据（不阻塞UI）
    async loadFullDataInBackground() {
        try {
            console.log('开始后台加载完整历史数据...');
            
            // 获取最早的交易记录日期，避免加载所有数据
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const startDate = thirtyDaysAgo.toISOString().split('T')[0];
            
            // 计算30天前的前一天，避免重复加载边界日期
            const beforeStartDate = new Date(thirtyDaysAgo);
            beforeStartDate.setDate(beforeStartDate.getDate() - 1);
            const endDate = beforeStartDate.toISOString().split('T')[0];
            
            // 加载30天之前的所有数据（不包含30天前当天，避免重复）
            const [olderTransactions, allTobaccoRecords] = await Promise.all([
                this.supabaseDataManager.getAllTransactions(null, endDate),
                this.supabaseDataManager.getTobaccoRecords()
            ]);
            
            console.log(`后台加载了 ${olderTransactions.length} 条历史交易记录`);
            console.log(`后台加载了 ${allTobaccoRecords.length} 条烟草记录`);
            
            // 合并历史交易记录
            olderTransactions.forEach(transaction => {
                const dateKey = transaction.date;
                if (!this.history[dateKey]) {
                    this.history[dateKey] = { incomes: [], expenses: [] };
                }
                
                if (transaction.type === 'income') {
                    this.history[dateKey].incomes.push({
                        id: transaction.client_id || transaction.id,
                        amount: transaction.amount,
                        category: transaction.category || '默认'
                    });
                } else if (transaction.type === 'expense') {
                    this.history[dateKey].expenses.push({
                        id: transaction.client_id || transaction.id,
                        name: transaction.name,
                        amount: transaction.amount
                    });
                }
            });
            
            // 加载烟草记录
            this.history.tobacco = allTobaccoRecords.map(record => ({
                id: record.client_id || record.id,
                date: record.date,
                brand: record.brand,
                quantity: record.quantity,
                price: record.price
            }));
            
            console.log('后台加载完成，完整数据已就绪');
            
            // 保存到本地缓存
            this.saveDataToLocal();
            
        } catch (error) {
            console.error('后台加载完整数据失败:', error);
        }
    }

    // 确保所有收支记录都有唯一的ID
    normalizeDataIds() {
        for (const dateKey in this.history) {
            const dayRecord = this.history[dateKey];
            if (dayRecord.incomes) {
                dayRecord.incomes.forEach(item => {
                    if (!item.id) {
                        item.id = 'income_' + Date.now() + Math.random();
                    }
                    if (typeof item.category === 'undefined') {
                        item.category = '默认';
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

    // 同步当前视图到历史记录并保存到 Supabase
    async syncCurrentViewToHistory(selectedDate, incomes, expenses) {
        const dateKey = selectedDate;
        
        // 更新本地 history
        if (!this.history[dateKey]) {
            this.history[dateKey] = {};
        }
        
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
        
        if (Object.keys(this.history[dateKey]).length === 0) {
            delete this.history[dateKey];
        }
        
        // 保存到 Supabase - 同步当前日期的交易记录
        await this.saveTransactionsForDate(dateKey, incomes, expenses);
    }
    
    // 保存指定日期的交易记录到 Supabase
    async saveTransactionsForDate(dateKey, incomes, expenses) {
        // 检查是否离线或网络不可用
        if (this.isOffline || !navigator.onLine) {
            console.log('📵 当前离线，操作将加入同步队列');

            // 如果离线队列已初始化，将操作加入队列
            if (this.offlineQueue) {
                // 为每条交易添加到离线队列
                for (const income of incomes) {
                    await this.offlineQueue.addOperation({
                        type: 'ADD_TRANSACTION',
                        data: {
                            client_id: income.id,
                            date: dateKey,
                            type: 'income',
                            amount: income.amount,
                            category: income.category || '默认',
                            name: null
                        }
                    });
                }

                for (const expense of expenses) {
                    await this.offlineQueue.addOperation({
                        type: 'ADD_TRANSACTION',
                        data: {
                            client_id: expense.id,
                            date: dateKey,
                            type: 'expense',
                            amount: expense.amount,
                            category: null,
                            name: expense.name
                        }
                    });
                }
            }

            // 保存到本地作为备份
            this.saveDataToLocal();
            return;
        }

        try {
            console.log(`正在保存 ${dateKey} 的交易记录到 Supabase...`);
            
            // 准备所有要保存的交易记录
            const transactionsToUpsert = [];
            
            // 处理进账记录
            for (const income of incomes) {
                transactionsToUpsert.push({
                    client_id: income.id,
                    date: dateKey,
                    type: 'income',
                    amount: income.amount,
                    category: income.category || '默认',
                    name: null
                });
            }
            
            // 处理支出记录
            for (const expense of expenses) {
                transactionsToUpsert.push({
                    client_id: expense.id,
                    date: dateKey,
                    type: 'expense',
                    amount: expense.amount,
                    category: null,
                    name: expense.name
                });
            }
            
            // 使用 upsert 批量保存或更新（避免重复键冲突）
            if (transactionsToUpsert.length > 0) {
                await this.supabaseDataManager.upsertTransactionsBatch(transactionsToUpsert);
            }
            
            // 异步删除不存在的记录（不阻塞主流程）
            this.cleanupDeletedTransactions(dateKey, incomes, expenses).catch(err => {
                console.warn('清理已删除记录失败:', err);
            });
            
            console.log(`成功保存 ${dateKey} 的交易记录到 Supabase`);
        } catch (error) {
            console.error('保存交易记录到 Supabase 失败:', error);
            // 不要立即设置为离线模式，可能只是临时网络问题
            if (error.message && error.message.includes('timeout')) {
                console.warn('保存超时，数据已保存到本地，稍后会自动重试');
            } else {
                this.isOffline = true;
            }
            this.saveDataToLocal();
        }
    }
    
    // 清理已删除的交易记录（异步执行，不阻塞主流程）
    async cleanupDeletedTransactions(dateKey, incomes, expenses) {
        try {
            // 获取该日期已存在的所有交易记录
            const existingTransactions = await this.supabaseDataManager.getTransactionsByDate(dateKey);
            const existingClientIds = new Set(existingTransactions.map(t => t.client_id));
            
            // 删除已不存在的记录（用户删除的记录）
            const currentClientIds = new Set([...incomes.map(i => i.id), ...expenses.map(e => e.id)]);
            const deletePromises = [];
            
            for (const existingClientId of existingClientIds) {
                if (!currentClientIds.has(existingClientId)) {
                    deletePromises.push(
                        this.supabaseDataManager.deleteTransaction(existingClientId)
                    );
                }
            }
            
            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
                console.log(`已清理 ${deletePromises.length} 条已删除的记录`);
            }
        } catch (error) {
            console.error('清理已删除记录失败:', error);
            throw error;
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

    // 保存数据到云端 (Supabase)
    async saveDataToCloud(force = false) {
        if (this.isOffline && !force) {
            this.saveDataToLocal();
            return;
        }
        
        console.log('正在保存数据到 Supabase...');
        
        try {
            // Supabase 使用 RLS，每次操作时会自动处理用户隔离
            // 这里不需要手动上传整个 history，因为交易记录已经通过各个操作保存了
            console.log('数据已通过各个操作保存到 Supabase');
        } catch (error) {
            console.error('保存到 Supabase 失败:', error);
            this.isOffline = true;
            this.saveDataToLocal();
        }
    }

    // 保存数据到本地
    saveDataToLocal() {
        console.log('正在保存数据到本地...');
        localStorage.setItem('e7-local-history', JSON.stringify(this.history));
        localStorage.setItem('e7-local-debts', JSON.stringify(this.debts));
    }

    // 从本地加载数据
    loadDataFromLocal(type) {
        const key = type === 'history' ? 'e7-local-history' : 'e7-local-debts';
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // 添加或更新债务
    async addOrUpdateDebt(newDebt) {
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
                isNew: true,
                createdAt: oldDebt.createdAt || now,
                updatedAt: now
            };
            
            // 更新到 Supabase
            try {
                await this.supabaseDataManager.updateDebt(newDebt.name, {
                    calculation: newExpression,
                    result: newResult
                });
            } catch (error) {
                console.error('更新债务到 Supabase 失败:', error);
            }
            
            this.debts.splice(existingIndex, 1);
        } else {
            // 添加新债务
            updatedDebtItem = { 
                name: newDebt.name, 
                calculation: newDebt.expression, 
                result: debtResult, 
                isNew: true,
                createdAt: now,
                updatedAt: now
            };
            
            // 保存到 Supabase
            try {
                await this.supabaseDataManager.addDebt(updatedDebtItem);
            } catch (error) {
                console.error('添加债务到 Supabase 失败:', error);
            }
        }
        
        this.debts.unshift(updatedDebtItem);

        // 3秒后清除isNew标志
        setTimeout(() => {
            const currentDebtIndex = this.debts.findIndex(d => d.name === updatedDebtItem.name && d.createdAt === updatedDebtItem.createdAt);
            if (currentDebtIndex !== -1) {
                this.debts[currentDebtIndex].isNew = false;
            }
        }, 3000);
        
        return this.debts.slice();
    }
    
    // 编辑债务
    async editDebt(editDebt) {
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
                isNew: true,
                createdAt: existingDebt.createdAt || now,
                updatedAt: now
            };
            
            // 更新到 Supabase
            try {
                await this.supabaseDataManager.updateDebt(editDebt.name, {
                    calculation: editDebt.expression,
                    result: debtResult
                });
            } catch (error) {
                console.error('更新债务到 Supabase 失败:', error);
            }
            
            this.debts.splice(editDebt.index, 1);
            this.debts.unshift(updatedDebt);

            // 3秒后清除isNew标志
            setTimeout(() => {
                const currentDebtIndex = this.debts.findIndex(d => d.name === updatedDebt.name && d.createdAt === updatedDebt.createdAt);
                if (currentDebtIndex !== -1) {
                    this.debts[currentDebtIndex].isNew = false;
                }
            }, 3000);

            return this.debts.slice();
        }
        throw new Error('无效的债务索引');
    }
    
    // 删除债务
    async deleteDebt(index) {
        // 验证索引的有效性
        if (index < 0 || index >= this.debts.length) {
            throw new Error(`无效的债务索引: ${index}，当前债务数量: ${this.debts.length}`);
        }
        
        const debtToDelete = this.debts[index];
        console.log(`准备删除债务: ${debtToDelete.name}，索引: ${index}`);
        
        // 从 Supabase 删除
        try {
            await this.supabaseDataManager.deleteDebt(debtToDelete.name);
            console.log(`成功从 Supabase 删除债务: ${debtToDelete.name}`);
        } catch (error) {
            console.error('从 Supabase 删除债务失败:', error);
            // 即使云端删除失败，仍然从本地删除
        }
        
        // 从本地数组删除
        this.debts.splice(index, 1);
        console.log(`本地删除成功，剩余债务数量: ${this.debts.length}`);
        
        // 保存到本地存储作为备份
        this.saveDataToLocal();
        
        return this.debts;
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
    
    // 更新所有使用指定分类的记录
    updateRecordsWithCategory(oldCategory, newCategory = '默认') {
        for (const dateKey in this.history) {
            const dayRecord = this.history[dateKey];
            
            if (dayRecord.incomes) {
                dayRecord.incomes.forEach(income => {
                    if (income.category === oldCategory) {
                        income.category = newCategory;
                    }
                });
            }
            
            if (dayRecord.expenses) {
                dayRecord.expenses.forEach(expense => {
                    if (expense.category === oldCategory) {
                        expense.category = newCategory;
                    }
                });
            }
        }
        
        this.saveDataToCloud();
    }
    
    // ========== 数据管理功能（使用 BackupManager）==========
    
    // 初始化备份管理器
    initBackupManager() {
        if (!this.backupManager && this.supabaseDataManager && this.supabaseManager) {
            this.backupManager = new BackupManager(this.supabaseDataManager, this.supabaseManager);
            this.backupManager.initAutoBackup(); // 初始化自动备份
            console.log('备份管理器已初始化');
        }
    }

    // 初始化离线队列管理器
    initOfflineQueue() {
        if (!this.offlineQueue && this.supabaseDataManager) {
            this.offlineQueue = new OfflineQueueManager(this.supabaseDataManager);
            this.offlineQueue.initNetworkListener(); // 启动网络监听
            console.log('✅ 离线队列管理器已初始化');

            // 页面加载时尝试同步待处理的离线操作
            setTimeout(async () => {
                const stats = await this.offlineQueue.getQueueStats();
                if (stats.pending > 0) {
                    console.log(`📦 发现 ${stats.pending} 个待同步的离线操作`);
                    await this.offlineQueue.syncToCloud();
                }
            }, 2000);
        }
    }

    // 导出数据（委托给 BackupManager）
    async exportData() {
        if (!this.backupManager) {
            this.initBackupManager();
        }
        return await this.backupManager.exportData();
    }

    // 导入数据（委托给 BackupManager）
    async importData(file) {
        if (!this.backupManager) {
            this.initBackupManager();
        }
        return await this.backupManager.importData(file);
    }
    
    // 手动备份
    async createManualBackup() {
        if (!this.backupManager) {
            this.initBackupManager();
        }
        return await this.backupManager.createManualBackup();
    }
    
    // 获取所有备份列表
    async getAllBackups() {
        if (!this.backupManager) {
            this.initBackupManager();
        }
        return await this.backupManager.getAllBackups();
    }
    
    // 从备份恢复
    async restoreFromBackup(backupId) {
        if (!this.backupManager) {
            this.initBackupManager();
        }
        return await this.backupManager.restoreFromBackup(backupId);
    }
    
    // 删除备份
    async deleteBackup(backupId) {
        if (!this.backupManager) {
            this.initBackupManager();
        }
        return await this.backupManager.deleteBackupFromIndexedDB(backupId);
    }
    
    // 获取自动备份配置
    getAutoBackupConfig() {
        if (!this.backupManager) {
            this.initBackupManager();
        }
        return this.backupManager.getAutoBackupConfig();
    }
    
    // 保存自动备份配置
    saveAutoBackupConfig(config) {
        if (!this.backupManager) {
            this.initBackupManager();
        }
        this.backupManager.saveAutoBackupConfig(config);
        
        // 重新调度自动备份
        if (config.enabled) {
            this.backupManager.scheduleAutoBackup(config.frequency);
        } else {
            this.backupManager.stopAutoBackup();
        }
    }

    // ========== 数据一致性检查 ==========

    // 检查本地和云端数据的一致性
    async checkDataIntegrity() {
        console.log('🔍 开始数据一致性检查...');

        try {
            // 1. 获取云端数据
            const cloudTransactions = await this.supabaseDataManager.getAllTransactions(null, null);

            // 2. 获取本地数据
            const localHistory = this.loadDataFromLocal('history') || {};

            // 3. 比较数据
            const conflicts = [];

            for (const cloudTrans of cloudTransactions) {
                const dateKey = cloudTrans.date;
                const localRecord = localHistory[dateKey];

                if (localRecord) {
                    const localItem = cloudTrans.type === 'income'
                        ? localRecord.incomes?.find(i => i.id === cloudTrans.client_id)
                        : localRecord.expenses?.find(e => e.id === cloudTrans.client_id);

                    if (localItem) {
                        // 比较金额是否一致
                        if (localItem.amount !== cloudTrans.amount) {
                            conflicts.push({
                                type: 'amount_mismatch',
                                client_id: cloudTrans.client_id,
                                date: dateKey,
                                transType: cloudTrans.type,
                                local: localItem,
                                cloud: cloudTrans
                            });
                        }
                    }
                }
            }

            if (conflicts.length > 0) {
                console.warn(`⚠️ 发现 ${conflicts.length} 处数据冲突`, conflicts);

                // 弹窗让用户选择
                const result = await this.showConflictDialog(conflicts);

                if (result === 'use_cloud') {
                    console.log('用户选择保留云端数据，重新加载...');
                    await this.loadData();
                } else if (result === 'use_local') {
                    console.log('用户选择保留本地数据，上传到云端...');
                    await this.syncLocalToCloud();
                }
            } else {
                console.log('✅ 数据一致性检查通过');
            }

            return conflicts;
        } catch (error) {
            console.error('❌ 数据一致性检查失败:', error);
            return [];
        }
    }

    // 显示冲突对话框
    showConflictDialog(conflicts) {
        return new Promise((resolve) => {
            const conflictDetails = conflicts.slice(0, 3).map(c =>
                `• ${c.date} ${c.transType === 'income' ? '进账' : '支出'}: 本地 ¥${c.local.amount} vs 云端 ¥${c.cloud.amount}`
            ).join('\n');

            const moreText = conflicts.length > 3 ? `\n...还有 ${conflicts.length - 3} 处冲突` : '';

            const message = `⚠️ 检测到 ${conflicts.length} 处数据不一致：\n\n` +
                `${conflictDetails}${moreText}\n\n` +
                `这可能是因为：\n` +
                `• 您在多个设备上修改了数据\n` +
                `• 离线期间数据未能正确同步\n\n` +
                `请选择保留哪个版本：\n` +
                `【确定】保留云端数据（最新保存到服务器的版本）\n` +
                `【取消】保留本地数据（您当前设备上的版本）`;

            if (confirm(message)) {
                resolve('use_cloud');
            } else {
                resolve('use_local');
            }
        });
    }

    // 将本地数据同步到云端（解决冲突用）
    async syncLocalToCloud() {
        console.log('📤 开始将本地数据同步到云端...');

        try {
            const localHistory = this.loadDataFromLocal('history') || {};

            for (const dateKey in localHistory) {
                const dayRecord = localHistory[dateKey];

                if (dayRecord.incomes || dayRecord.expenses) {
                    const incomes = dayRecord.incomes || [];
                    const expenses = dayRecord.expenses || [];

                    // 使用现有的保存方法
                    await this.saveTransactionsForDate(dateKey, incomes, expenses);
                }
            }

            console.log('✅ 本地数据已同步到云端');
        } catch (error) {
            console.error('❌ 同步本地数据失败:', error);
            throw error;
        }
    }

    // 运行完整的数据完整性检查（包括重复ID、orphan记录等）
    async runIntegrityCheck() {
        console.log('🔍 运行完整的数据完整性检查...');

        const issues = [];

        try {
            // 1. 检查重复的 client_id
            const allTransactions = await this.supabaseDataManager.getAllTransactions(null, null);
            const clientIds = allTransactions.map(t => t.client_id);
            const duplicates = clientIds.filter((id, index) => clientIds.indexOf(id) !== index);

            if (duplicates.length > 0) {
                issues.push({
                    type: 'duplicate_ids',
                    count: duplicates.length,
                    details: duplicates.slice(0, 5),
                    message: `发现 ${duplicates.length} 个重复的记录ID`
                });
            }

            // 2. 检查orphan records（云端有但本地没有的日期）
            const dates = [...new Set(allTransactions.map(t => t.date))];
            const missingDates = [];

            for (const date of dates) {
                if (!this.history[date]) {
                    missingDates.push(date);
                }
            }

            if (missingDates.length > 0) {
                issues.push({
                    type: 'orphan_records',
                    count: missingDates.length,
                    details: missingDates.slice(0, 5),
                    message: `发现 ${missingDates.length} 个日期在云端有数据但本地没有`
                });
            }

            // 3. 检查数据类型错误
            const invalidAmounts = allTransactions.filter(trans =>
                typeof trans.amount !== 'number' || isNaN(trans.amount) || trans.amount < 0
            );

            if (invalidAmounts.length > 0) {
                issues.push({
                    type: 'invalid_amounts',
                    count: invalidAmounts.length,
                    details: invalidAmounts.slice(0, 5).map(t => t.id),
                    message: `发现 ${invalidAmounts.length} 条金额无效的交易记录`
                });
            }

            // 4. 生成报告
            if (issues.length > 0) {
                console.warn('⚠️ 数据完整性检查发现问题:', issues);

                // 显示详细报告
                this.showIntegrityReport(issues);

                return {
                    status: 'issues_found',
                    issues: issues,
                    summary: `发现 ${issues.length} 类问题`
                };
            } else {
                console.log('✅ 数据完整性检查通过');

                // 显示成功提示
                if (window.confirm('✅ 数据完整性检查通过！\n\n没有发现任何数据问题。')) {
                    // 用户确认后关闭
                }

                return {
                    status: 'ok',
                    issues: [],
                    summary: '所有数据正常'
                };
            }
        } catch (error) {
            console.error('❌ 数据完整性检查失败:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    // 显示完整性检查报告
    showIntegrityReport(issues) {
        const report = issues.map((issue, index) => {
            let details = '';
            if (issue.details) {
                details = '\n  详情: ' + (Array.isArray(issue.details) ? issue.details.join(', ') : issue.details);
            }
            return `${index + 1}. ${issue.message}${details}`;
        }).join('\n\n');

        const message = `📊 数据完整性检查报告\n\n` +
            `发现 ${issues.length} 类问题：\n\n` +
            `${report}\n\n` +
            `建议：\n` +
            `• 如果数据重要，请先创建备份\n` +
            `• 尝试刷新页面重新加载数据\n` +
            `• 联系技术支持获取帮助\n\n` +
            `是否立即刷新页面？`;

        if (confirm(message)) {
            window.location.reload();
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