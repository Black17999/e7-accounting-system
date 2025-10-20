// 备份管理模块 - 处理数据备份、恢复和自动备份
export class BackupManager {
    constructor(supabaseDataManager, supabaseManager) {
        this.supabaseDataManager = supabaseDataManager;
        this.supabaseManager = supabaseManager;
        this.autoBackupTimer = null;
        this.dbName = 'E7AccountingBackups';
        this.dbVersion = 1;
        this.progressOverlay = null;
    }

    // ========== 进度提示UI管理 ==========
    
    // 显示进度提示
    showProgress(title, message, showBar = true, isIndeterminate = false) {
        // 移除已存在的进度提示
        this.hideProgress();
        
        // 创建进度提示容器
        this.progressOverlay = document.createElement('div');
        this.progressOverlay.className = 'progress-overlay';
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        // 图标
        const iconDiv = document.createElement('div');
        iconDiv.className = 'progress-icon';
        iconDiv.innerHTML = '<i class="fas fa-sync-alt"></i>';
        
        // 标题
        const titleDiv = document.createElement('div');
        titleDiv.className = 'progress-title';
        titleDiv.textContent = title;
        
        // 消息
        const messageDiv = document.createElement('div');
        messageDiv.className = 'progress-message';
        messageDiv.textContent = message;
        
        progressContainer.appendChild(iconDiv);
        progressContainer.appendChild(titleDiv);
        progressContainer.appendChild(messageDiv);
        
        // 进度条
        if (showBar) {
            const barWrapper = document.createElement('div');
            barWrapper.className = 'progress-bar-wrapper';
            
            const bar = document.createElement('div');
            bar.className = 'progress-bar' + (isIndeterminate ? ' indeterminate' : '');
            bar.style.width = isIndeterminate ? '40%' : '0%';
            
            barWrapper.appendChild(bar);
            progressContainer.appendChild(barWrapper);
            
            // 进度百分比（非不确定模式下显示）
            if (!isIndeterminate) {
                const percentDiv = document.createElement('div');
                percentDiv.className = 'progress-percent';
                percentDiv.textContent = '0%';
                progressContainer.appendChild(percentDiv);
            }
        }
        
        this.progressOverlay.appendChild(progressContainer);
        document.body.appendChild(this.progressOverlay);
        
        return this.progressOverlay;
    }
    
    // 更新进度
    updateProgress(percent, message = null) {
        if (!this.progressOverlay) return;
        
        const bar = this.progressOverlay.querySelector('.progress-bar');
        const percentDiv = this.progressOverlay.querySelector('.progress-percent');
        const messageDiv = this.progressOverlay.querySelector('.progress-message');
        
        if (bar && !bar.classList.contains('indeterminate')) {
            bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
        
        if (percentDiv) {
            percentDiv.textContent = `${Math.round(percent)}%`;
        }
        
        if (message && messageDiv) {
            messageDiv.textContent = message;
        }
    }
    
    // 显示警告信息
    showProgressWarning(warningText) {
        if (!this.progressOverlay) return;
        
        const container = this.progressOverlay.querySelector('.progress-container');
        if (!container) return;
        
        // 检查是否已有警告
        let warningDiv = container.querySelector('.progress-warning');
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.className = 'progress-warning';
            container.appendChild(warningDiv);
        }
        
        warningDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i>${warningText}`;
    }
    
    // 显示成功状态
    showProgressSuccess(title, message) {
        if (!this.progressOverlay) return;
        
        const container = this.progressOverlay.querySelector('.progress-container');
        const iconDiv = this.progressOverlay.querySelector('.progress-icon');
        const titleDiv = this.progressOverlay.querySelector('.progress-title');
        const messageDiv = this.progressOverlay.querySelector('.progress-message');
        const bar = this.progressOverlay.querySelector('.progress-bar');
        
        if (container) container.classList.add('success');
        if (iconDiv) iconDiv.innerHTML = '<i class="fas fa-check-circle"></i>';
        if (titleDiv) titleDiv.textContent = title;
        if (messageDiv) messageDiv.textContent = message;
        if (bar && !bar.classList.contains('indeterminate')) {
            bar.style.width = '100%';
        }
    }
    
    // 显示错误状态
    showProgressError(title, message) {
        if (!this.progressOverlay) return;
        
        const container = this.progressOverlay.querySelector('.progress-container');
        const iconDiv = this.progressOverlay.querySelector('.progress-icon');
        const titleDiv = this.progressOverlay.querySelector('.progress-title');
        const messageDiv = this.progressOverlay.querySelector('.progress-message');
        
        if (container) container.classList.add('error');
        if (iconDiv) iconDiv.innerHTML = '<i class="fas fa-times-circle"></i>';
        if (titleDiv) titleDiv.textContent = title;
        if (messageDiv) messageDiv.textContent = message;
    }
    
    // 隐藏进度提示
    hideProgress(delay = 0) {
        if (delay > 0) {
            setTimeout(() => {
                if (this.progressOverlay && this.progressOverlay.parentNode) {
                    this.progressOverlay.remove();
                    this.progressOverlay = null;
                }
            }, delay);
        } else {
            if (this.progressOverlay && this.progressOverlay.parentNode) {
                this.progressOverlay.remove();
                this.progressOverlay = null;
            }
        }
    }

    // ========== IndexedDB 操作 ==========
    
    // 打开 IndexedDB
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('backups')) {
                    const store = db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('backupDate', 'backupDate', { unique: false });
                    store.createIndex('backupType', 'backupType', { unique: false });
                }
            };
        });
    }
    
    // 保存备份到 IndexedDB
    async saveBackupToIndexedDB(backupData) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            
            await new Promise((resolve, reject) => {
                const request = store.add(backupData);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            db.close();
            
            // 清理旧备份
            await this.cleanOldBackups();
            
            console.log('备份已保存到 IndexedDB');
        } catch (error) {
            console.error('保存备份到 IndexedDB 失败:', error);
            throw error;
        }
    }
    
    // 从 IndexedDB 获取所有备份
    async getAllBackups() {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            
            const backups = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            db.close();
            return backups;
        } catch (error) {
            console.error('获取备份列表失败:', error);
            return [];
        }
    }
    
    // 从 IndexedDB 删除备份
    async deleteBackupFromIndexedDB(backupId) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');
            
            await new Promise((resolve, reject) => {
                const request = store.delete(backupId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            db.close();
            console.log('备份已删除:', backupId);
        } catch (error) {
            console.error('删除备份失败:', error);
            throw error;
        }
    }
    
    // 清理旧备份（保留最近N个）
    async cleanOldBackups() {
        try {
            const config = this.getAutoBackupConfig();
            const maxBackups = config.maxBackups || 5;
            
            const backups = await this.getAllBackups();
            
            if (backups.length > maxBackups) {
                // 按日期排序
                backups.sort((a, b) => new Date(b.backupDate) - new Date(a.backupDate));
                
                // 删除超出数量的备份
                const toDelete = backups.slice(maxBackups);
                for (const backup of toDelete) {
                    await this.deleteBackupFromIndexedDB(backup.id);
                }
                
                console.log(`已清理 ${toDelete.length} 个旧备份`);
            }
        } catch (error) {
            console.error('清理旧备份失败:', error);
        }
    }

    // ========== 数据导出功能 ==========
    
    async exportData() {
        try {
            if (!this.supabaseDataManager) {
                throw new Error('Supabase 未初始化');
            }
            
            console.log('开始从 Supabase 导出数据...');
            
            // 并行获取所有数据
            const [allTransactions, allDebts, allTobacco, userProfile] = await Promise.all([
                this.supabaseDataManager.getAllTransactions(null, null),
                this.supabaseDataManager.getAllDebts(),
                this.supabaseDataManager.getTobaccoRecords(),
                this.supabaseDataManager.getUserProfile()
            ]);
            
            // 构建导出数据
            const exportData = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                exportSource: 'supabase',
                user: {
                    displayName: userProfile.display_name,
                    email: this.supabaseManager.getCurrentUser()?.email || ''
                },
                transactions: allTransactions,
                debts: allDebts,
                tobacco: allTobacco,
                statistics: {
                    totalTransactions: allTransactions.length,
                    totalDebts: allDebts.length,
                    totalTobacco: allTobacco.length
                }
            };
            
            // 生成文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `e7-backup-${timestamp}.json`;
            
            // 下载文件
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert(`数据导出成功！\n\n导出统计：\n• 交易记录：${allTransactions.length} 条\n• 债务记录：${allDebts.length} 条\n• 烟草记录：${allTobacco.length} 条`);
            
            return true;
        } catch (error) {
            console.error('导出数据失败:', error);
            alert(`导出失败: ${error.message}`);
            return false;
        }
    }

    // ========== 数据导入功能（完全替换模式）==========
    
    async importData(file) {
        if (!file) return false;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // 验证格式
                    if (!importedData.transactions && !importedData.debts && !importedData.tobacco) {
                        throw new Error('无效的备份文件格式');
                    }
                    
                    const transCount = importedData.transactions?.length || 0;
                    const debtCount = importedData.debts?.length || 0;
                    const tobaccoCount = importedData.tobacco?.length || 0;
                    
                    if (!confirm(
                        `📊 即将导入以下数据（完全替换模式）：\n\n` +
                        `• 交易记录：${transCount} 条\n` +
                        `• 债务记录：${debtCount} 条\n` +
                        `• 烟草记录：${tobaccoCount} 条\n\n` +
                        `⚠️ 警告：\n` +
                        `• 此操作会先清空云端所有现有数据\n` +
                        `• 然后导入新数据（完全替换）\n` +
                        `• 此操作不可撤销！\n\n` +
                        `💡 建议：导入前先创建【手动备份】以防万一\n\n` +
                        `确定要继续吗？`
                    )) {
                        return resolve(false);
                    }
                    
                    console.log('开始导入数据（完全替换模式）...');
                    
                    // 显示进度提示
                    this.showProgress('正在导入数据', '准备清空现有数据...', true, false);
                    this.showProgressWarning('请勿关闭页面或切换到其他应用');
                    
                    // 等待UI渲染
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    try {
                        // 步骤1：清空现有数据（10%进度）
                        this.updateProgress(5, '正在清空现有数据...');
                        await this.clearAllData();
                        this.updateProgress(10, '现有数据已清空');
                        
                        // 步骤2：批量导入交易记录（10%-50%进度）
                        if (importedData.transactions?.length) {
                            this.updateProgress(10, `正在准备导入 ${transCount} 条交易记录...`);
                            
                            // 分批处理，每批100条
                            const batchSize = 100;
                            const totalBatches = Math.ceil(transCount / batchSize);
                            
                            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                                const start = batchIndex * batchSize;
                                const end = Math.min(start + batchSize, transCount);
                                const batch = importedData.transactions.slice(start, end);
                                
                                // 准备批量数据
                                const batchData = batch.map(trans => ({
                                    client_id: trans.client_id || 'import_' + Date.now() + Math.random(),
                                    date: trans.date,
                                    type: trans.type,
                                    amount: trans.amount,
                                    category: trans.category,
                                    name: trans.name
                                }));
                                
                                try {
                                    await this.supabaseDataManager.addTransactionsBatch(batchData);
                                    
                                    // 更新进度
                                    const progress = 10 + ((end / transCount) * 40);
                                    this.updateProgress(progress, `正在导入交易记录 (${end}/${transCount})...`);
                                } catch (err) {
                                    console.warn(`批量导入交易失败 (批次 ${batchIndex + 1}/${totalBatches}):`, err);
                                }
                            }
                        }
                        
                        // 步骤3：批量导入债务记录（50%-70%进度）
                        if (importedData.debts?.length) {
                            this.updateProgress(50, `正在准备导入 ${debtCount} 条债务记录...`);
                            
                            // 分批处理，每批50条（债务记录通常较少）
                            const batchSize = 50;
                            const totalBatches = Math.ceil(debtCount / batchSize);
                            
                            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                                const start = batchIndex * batchSize;
                                const end = Math.min(start + batchSize, debtCount);
                                const batch = importedData.debts.slice(start, end);
                                
                                try {
                                    await this.supabaseDataManager.addDebtsBatch(batch);
                                    
                                    // 更新进度
                                    const baseProgress = 50;
                                    const progressRange = 20;
                                    const progress = baseProgress + ((end / debtCount) * progressRange);
                                    this.updateProgress(progress, `正在导入债务记录 (${end}/${debtCount})...`);
                                } catch (err) {
                                    console.warn(`批量导入债务失败 (批次 ${batchIndex + 1}/${totalBatches}):`, err);
                                }
                            }
                        }
                        
                        // 步骤4：批量导入烟草记录（70%-90%进度）
                        if (importedData.tobacco?.length) {
                            this.updateProgress(70, `正在准备导入 ${tobaccoCount} 条烟草记录...`);
                            
                            // 分批处理，每批100条
                            const batchSize = 100;
                            const totalBatches = Math.ceil(tobaccoCount / batchSize);
                            
                            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                                const start = batchIndex * batchSize;
                                const end = Math.min(start + batchSize, tobaccoCount);
                                const batch = importedData.tobacco.slice(start, end);
                                
                                // 准备批量数据
                                const batchData = batch.map(tobacco => ({
                                    id: tobacco.client_id || 'import_' + Date.now() + Math.random(),
                                    brand: tobacco.brand,
                                    quantity: tobacco.quantity,
                                    price: tobacco.price,
                                    date: tobacco.date
                                }));
                                
                                try {
                                    await this.supabaseDataManager.addTobaccoRecordsBatch(batchData);
                                    
                                    // 更新进度
                                    const baseProgress = 70;
                                    const progressRange = 20;
                                    const progress = baseProgress + ((end / tobaccoCount) * progressRange);
                                    this.updateProgress(progress, `正在导入烟草记录 (${end}/${tobaccoCount})...`);
                                } catch (err) {
                                    console.warn(`批量导入烟草失败 (批次 ${batchIndex + 1}/${totalBatches}):`, err);
                                }
                            }
                        }
                        
                        // 完成
                        this.showProgressSuccess('导入完成', '页面即将刷新以显示最新数据...');
                        
                        setTimeout(() => {
                            this.hideProgress();
                            window.location.reload();
                        }, 2000);
                        
                        resolve(true);
                    } catch (error) {
                        this.showProgressError('导入失败', error.message);
                        setTimeout(() => this.hideProgress(), 3000);
                        reject(error);
                    }
                } catch (error) {
                    this.showProgressError('导入失败', error.message);
                    setTimeout(() => this.hideProgress(), 3000);
                    reject(error);
                }
            };
            reader.onerror = (error) => {
                this.showProgressError('读取文件失败', '无法读取所选文件，请重试');
                setTimeout(() => this.hideProgress(), 3000);
                reject(error);
            };
            reader.readAsText(file);
        });
    }
    
    // 清空所有云端数据（批量删除优化）
    async clearAllData() {
        try {
            console.log('开始清空所有数据...');
            
            // 使用批量删除方法，3个并行请求即可完成（而不是逐条删除）
            await Promise.all([
                this.supabaseDataManager.deleteAllTransactions(),
                this.supabaseDataManager.deleteAllDebts(),
                this.supabaseDataManager.deleteAllTobaccoRecords()
            ]);
            
            console.log('所有数据已清空（批量删除）');
        } catch (error) {
            console.error('清空数据失败:', error);
            throw new Error('清空数据失败: ' + error.message);
        }
    }

    // ========== 手动备份功能 ==========
    
    async createManualBackup() {
        try {
            const [allTransactions, allDebts, allTobacco, userProfile] = await Promise.all([
                this.supabaseDataManager.getAllTransactions(null, null),
                this.supabaseDataManager.getAllDebts(),
                this.supabaseDataManager.getTobaccoRecords(),
                this.supabaseDataManager.getUserProfile()
            ]);
            
            const backupData = {
                version: '2.0',
                backupDate: new Date().toISOString(),
                backupType: 'manual',
                user: {
                    displayName: userProfile.display_name
                },
                transactions: allTransactions,
                debts: allDebts,
                tobacco: allTobacco
            };
            
            await this.saveBackupToIndexedDB(backupData);
            
            alert(`备份创建成功！\n\n备份时间：${new Date().toLocaleString('zh-CN')}\n交易：${allTransactions.length} 条\n债务：${allDebts.length} 条\n烟草：${allTobacco.length} 条`);
            return true;
        } catch (error) {
            console.error('创建备份失败:', error);
            alert(`备份失败: ${error.message}`);
            return false;
        }
    }

    // ========== 自动备份功能 ==========
    
    getAutoBackupConfig() {
        const config = localStorage.getItem('e7-auto-backup-config');
        return config ? JSON.parse(config) : {
            enabled: false,
            frequency: 'daily',
            maxBackups: 5,
            lastBackupTime: null
        };
    }
    
    saveAutoBackupConfig(config) {
        localStorage.setItem('e7-auto-backup-config', JSON.stringify(config));
    }
    
    initAutoBackup() {
        const config = this.getAutoBackupConfig();
        if (config.enabled) {
            this.scheduleAutoBackup(config.frequency);
        }
    }
    
    scheduleAutoBackup(frequency) {
        const intervals = {
            daily: 24 * 60 * 60 * 1000,
            weekly: 7 * 24 * 60 * 60 * 1000,
            monthly: 30 * 24 * 60 * 60 * 1000
        };
        
        if (this.autoBackupTimer) {
            clearInterval(this.autoBackupTimer);
        }
        
        this.checkAndExecuteAutoBackup();
        
        this.autoBackupTimer = setInterval(() => {
            this.checkAndExecuteAutoBackup();
        }, intervals[frequency] || intervals.daily);
    }
    
    async checkAndExecuteAutoBackup() {
        const config = this.getAutoBackupConfig();
        if (!config.enabled) return;
        
        const now = Date.now();
        const lastBackup = config.lastBackupTime || 0;
        const intervals = {
            daily: 24 * 60 * 60 * 1000,
            weekly: 7 * 24 * 60 * 60 * 1000,
            monthly: 30 * 24 * 60 * 60 * 1000
        };
        
        const interval = intervals[config.frequency] || intervals.daily;
        
        if (now - lastBackup >= interval) {
            console.log('执行自动备份...');
            await this.executeAutoBackup();
        }
    }
    
    async executeAutoBackup() {
        try {
            const [allTransactions, allDebts, allTobacco, userProfile] = await Promise.all([
                this.supabaseDataManager.getAllTransactions(null, null),
                this.supabaseDataManager.getAllDebts(),
                this.supabaseDataManager.getTobaccoRecords(),
                this.supabaseDataManager.getUserProfile()
            ]);
            
            const backupData = {
                version: '2.0',
                backupDate: new Date().toISOString(),
                backupType: 'auto',
                user: {
                    displayName: userProfile.display_name
                },
                transactions: allTransactions,
                debts: allDebts,
                tobacco: allTobacco
            };
            
            await this.saveBackupToIndexedDB(backupData);
            
            // 更新最后备份时间
            const config = this.getAutoBackupConfig();
            config.lastBackupTime = Date.now();
            this.saveAutoBackupConfig(config);
            
            console.log('自动备份完成');
        } catch (error) {
            console.error('自动备份失败:', error);
        }
    }
    
    stopAutoBackup() {
        if (this.autoBackupTimer) {
            clearInterval(this.autoBackupTimer);
            this.autoBackupTimer = null;
        }
    }
    
    // ========== 从备份恢复 ==========
    
    async restoreFromBackup(backupId) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            
            const backup = await new Promise((resolve, reject) => {
                const request = store.get(backupId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            db.close();
            
            if (!backup) {
                throw new Error('备份不存在');
            }
            
            // 显示备份信息并确认恢复（完全替换模式）
            const transCount = backup.transactions?.length || 0;
            const debtCount = backup.debts?.length || 0;
            const tobaccoCount = backup.tobacco?.length || 0;
            const backupTime = new Date(backup.backupDate).toLocaleString('zh-CN');
            const backupTypeText = backup.backupType === 'manual' ? '手动备份' : '自动备份';
            
            if (!confirm(
                `📋 备份信息（完全替换模式）：\n\n` +
                `• 备份类型：${backupTypeText}\n` +
                `• 备份时间：${backupTime}\n` +
                `• 交易记录：${transCount} 条\n` +
                `• 债务记录：${debtCount} 条\n` +
                `• 烟草记录：${tobaccoCount} 条\n\n` +
                `⚠️ 警告：\n` +
                `• 此操作会先清空云端所有现有数据\n` +
                `• 然后恢复备份数据（完全替换）\n` +
                `• 此操作不可撤销！\n\n` +
                `确定要恢复此备份吗？`
            )) {
                return false;
            }
            
            // 使用导入功能恢复数据（已改为完全替换模式）
            const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
            const file = new File([blob], 'restore.json');
            
            return await this.importData(file);
        } catch (error) {
            console.error('恢复备份失败:', error);
            alert(`恢复失败: ${error.message}`);
            return false;
        }
    }
}