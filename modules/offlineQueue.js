// 离线操作队列管理器 - 使用 IndexedDB
export class OfflineQueueManager {
    constructor(supabaseDataManager) {
        this.supabaseDataManager = supabaseDataManager;
        this.dbName = 'E7OfflineQueue';
        this.dbVersion = 1;
        this.isSyncing = false;
        this.networkListenerAdded = false;
    }

    // ========== IndexedDB 操作 ==========

    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建操作队列表
                if (!db.objectStoreNames.contains('operations')) {
                    const store = db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                }
            };
        });
    }

    // ========== 添加操作到队列 ==========

    async addOperation(operation) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['operations'], 'readwrite');
            const store = transaction.objectStore('operations');

            // ✅ 去重检查：防止相同操作被重复添加
            const existingOps = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const duplicate = existingOps.find(op =>
                op.type === operation.type &&
                op.data.client_id === operation.data.client_id &&
                op.status === 'pending'
            );

            if (duplicate) {
                console.log(`⚠️ 操作已在队列中，跳过添加 [${operation.type}]`, operation.data.client_id);
                db.close();
                return duplicate.id;
            }

            // 不存在重复，添加到队列
            const queueItem = {
                ...operation,
                timestamp: Date.now(),
                status: 'pending', // pending, syncing, failed
                retryCount: 0,
                error: null
            };

            const id = await new Promise((resolve, reject) => {
                const request = store.add(queueItem);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            db.close();
            console.log(`✅ 离线操作已加入队列 [ID:${id}]`, operation);

            return id;
        } catch (error) {
            console.error('❌ 添加离线操作失败:', error);
            throw error;
        }
    }

    // ========== 获取待同步的操作 ==========

    async getPendingOperations() {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['operations'], 'readonly');
            const store = transaction.objectStore('operations');
            const index = store.index('status');

            const operations = await new Promise((resolve, reject) => {
                const request = index.getAll('pending');
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            db.close();
            return operations;
        } catch (error) {
            console.error('❌ 获取待同步操作失败:', error);
            return [];
        }
    }

    // ========== 更新操作状态 ==========

    async updateOperationStatus(id, status, error = null) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['operations'], 'readwrite');
            const store = transaction.objectStore('operations');

            const operation = await new Promise((resolve, reject) => {
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (operation) {
                operation.status = status;
                operation.error = error;
                operation.retryCount = (operation.retryCount || 0) + 1;

                await new Promise((resolve, reject) => {
                    const request = store.put(operation);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            db.close();
        } catch (error) {
            console.error('❌ 更新操作状态失败:', error);
        }
    }

    // ========== 删除已完成的操作 ==========

    async deleteOperation(id) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['operations'], 'readwrite');
            const store = transaction.objectStore('operations');

            await new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            db.close();
        } catch (error) {
            console.error('❌ 删除操作失败:', error);
        }
    }

    // ========== 同步队列到云端 ==========

    async syncToCloud() {
        if (this.isSyncing) {
            console.log('⏳ 同步正在进行中，跳过...');
            return;
        }

        if (!navigator.onLine) {
            console.log('📵 当前离线，无法同步');
            return;
        }

        this.isSyncing = true;
        console.log('🔄 开始同步离线操作到云端...');

        try {
            const operations = await this.getPendingOperations();

            if (operations.length === 0) {
                console.log('✅ 没有待同步的操作');
                this.isSyncing = false;
                return { success: 0, failed: 0 };
            }

            console.log(`📦 发现 ${operations.length} 个待同步操作`);

            let successCount = 0;
            let failedCount = 0;

            // 按时间戳排序，确保操作顺序正确
            operations.sort((a, b) => a.timestamp - b.timestamp);

            for (const operation of operations) {
                try {
                    await this.updateOperationStatus(operation.id, 'syncing');

                    // 执行对应的操作
                    await this.executeOperation(operation);

                    // 同步成功，删除队列项
                    await this.deleteOperation(operation.id);
                    successCount++;

                    console.log(`✅ 同步成功 [${operation.type}]`, operation.data);
                } catch (error) {
                    console.error(`❌ 同步失败 [${operation.type}]:`, error);

                    // 检查是否是重复键错误（已经存在的记录）
                    const isDuplicateError = error.message && (
                        error.message.includes('duplicate key') ||
                        error.message.includes('unique constraint') ||
                        error.message.includes('409')
                    );

                    if (isDuplicateError) {
                        // 重复记录直接删除队列项（因为数据已经在云端了）
                        console.log(`⚠️ 记录已存在，跳过同步 [${operation.type}]`, operation.data.client_id);
                        await this.deleteOperation(operation.id);
                        successCount++; // 算作成功（因为数据已经在云端）
                    } else if (operation.retryCount >= 3) {
                        // 如果重试超过3次，标记为失败
                        await this.updateOperationStatus(operation.id, 'failed', error.message);
                        failedCount++;
                    } else {
                        // 重试
                        await this.updateOperationStatus(operation.id, 'pending', error.message);
                    }
                }
            }

            this.isSyncing = false;

            const result = { success: successCount, failed: failedCount };
            console.log(`🎉 同步完成: 成功 ${successCount}，失败 ${failedCount}`);

            // 显示用户提示
            if (successCount > 0) {
                this.showSyncNotification(`成功同步 ${successCount} 条离线操作`);
            }
            if (failedCount > 0) {
                this.showSyncNotification(`有 ${failedCount} 条操作同步失败，请检查网络`, 'error');
            }

            return result;
        } catch (error) {
            console.error('❌ 同步过程出错:', error);
            this.isSyncing = false;
            throw error;
        }
    }

    // ========== 执行具体操作 ==========

    async executeOperation(operation) {
        const { type, data } = operation;

        switch (type) {
            // 交易记录操作
            case 'ADD_TRANSACTION':
                // 使用 upsert 避免重复键冲突（如果记录已存在则更新，不存在则插入）
                return await this.supabaseDataManager.upsertTransactionsBatch([data]);

            case 'UPDATE_TRANSACTION':
                return await this.supabaseDataManager.updateTransaction(data.client_id, data);

            case 'DELETE_TRANSACTION':
                return await this.supabaseDataManager.deleteTransaction(data.client_id);

            // 债务记录操作
            case 'ADD_DEBT':
                return await this.supabaseDataManager.addDebt(data);

            case 'UPDATE_DEBT':
                return await this.supabaseDataManager.updateDebt(data.name, data);

            case 'DELETE_DEBT':
                return await this.supabaseDataManager.deleteDebt(data.name);

            // 烟草记录操作
            case 'ADD_TOBACCO':
                return await this.supabaseDataManager.addTobaccoRecord(data);

            case 'UPDATE_TOBACCO':
                return await this.supabaseDataManager.updateTobaccoRecord(data.client_id, data);

            case 'DELETE_TOBACCO':
                return await this.supabaseDataManager.deleteTobaccoRecord(data.client_id);

            default:
                throw new Error(`未知的操作类型: ${type}`);
        }
    }

    // ========== 网络监听器 ==========

    initNetworkListener() {
        if (this.networkListenerAdded) return;

        // 监听网络恢复
        window.addEventListener('online', async () => {
            console.log('🌐 网络已恢复，开始自动同步...');

            // 延迟1秒再同步，避免网络不稳定
            setTimeout(async () => {
                try {
                    await this.syncToCloud();
                } catch (error) {
                    console.error('❌ 自动同步失败:', error);
                }
            }, 1000);
        });

        // 监听网络断开
        window.addEventListener('offline', () => {
            console.log('📵 网络已断开，将使用离线模式');
            this.showSyncNotification('网络已断开，您的操作将在网络恢复后自动同步', 'warning');
        });

        // 页面可见性变化时检查同步
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden && navigator.onLine) {
                console.log('👀 页面重新激活，检查是否有待同步操作...');
                const pending = await this.getPendingOperations();
                if (pending.length > 0) {
                    await this.syncToCloud();
                }
            }
        });

        this.networkListenerAdded = true;
        console.log('✅ 网络监听器已启动');
    }

    // ========== UI 提示 ==========

    showSyncNotification(message, type = 'success') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `sync-notification ${type}`;
        notification.innerHTML = `
            <div class="sync-notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加样式
        if (!document.getElementById('sync-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'sync-notification-styles';
            style.textContent = `
                .sync-notification {
                    position: fixed;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    animation: slideDown 0.3s ease-out;
                }
                .sync-notification.success {
                    border-left: 4px solid #4caf50;
                }
                .sync-notification.error {
                    border-left: 4px solid #f44336;
                }
                .sync-notification.warning {
                    border-left: 4px solid #ff9800;
                }
                .sync-notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .sync-notification-content i {
                    font-size: 18px;
                }
                .sync-notification.success i {
                    color: #4caf50;
                }
                .sync-notification.error i {
                    color: #f44336;
                }
                .sync-notification.warning i {
                    color: #ff9800;
                }
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ========== 获取队列统计 ==========

    async getQueueStats() {
        try {
            const operations = await this.getPendingOperations();
            return {
                total: operations.length,
                pending: operations.filter(op => op.status === 'pending').length,
                failed: operations.filter(op => op.status === 'failed').length
            };
        } catch (error) {
            console.error('❌ 获取队列统计失败:', error);
            return { total: 0, pending: 0, failed: 0 };
        }
    }

    // ========== 清空失败的操作 ==========

    async clearFailedOperations() {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['operations'], 'readwrite');
            const store = transaction.objectStore('operations');
            const index = store.index('status');

            const failedOps = await new Promise((resolve, reject) => {
                const request = index.getAll('failed');
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            for (const op of failedOps) {
                await this.deleteOperation(op.id);
            }

            db.close();
            console.log(`🗑️ 已清除 ${failedOps.length} 个失败的操作`);
            return failedOps.length;
        } catch (error) {
            console.error('❌ 清除失败操作出错:', error);
            return 0;
        }
    }
}
