// Supabase 数据库操作模块
export class SupabaseDataManager {
    constructor(supabaseManager) {
        this.supabase = supabaseManager.supabase;
        this.supabaseManager = supabaseManager;
    }
    
    // ========== 交易记录操作 ==========
    
    // 获取指定日期的交易记录（原始格式）
    async getTransactionsByDate(date) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { data, error } = await this.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .eq('date', date)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('获取交易记录失败:', error);
            throw error;
        }
    }
    
    // 获取所有交易记录（用于统计）
    async getAllTransactions(startDate, endDate) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            let query = this.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId);
            
            if (startDate) {
                query = query.gte('date', startDate);
            }
            if (endDate) {
                query = query.lte('date', endDate);
            }
            
            const { data, error } = await query.order('date', { ascending: true });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('获取所有交易记录失败:', error);
            throw error;
        }
    }
    
    // 添加交易记录（使用 client_id）
    async addTransaction(transaction) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { data, error } = await this.supabase
                .from('transactions')
                .insert([{
                    user_id: userId,
                    client_id: transaction.client_id,
                    type: transaction.type,
                    amount: transaction.amount,
                    category: transaction.category,
                    name: transaction.name,
                    date: transaction.date
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('添加交易记录失败:', error);
            throw error;
        }
    }
    
    // 批量添加交易记录（性能优化）
    async addTransactionsBatch(transactions) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            // 准备批量插入的数据
            const dataToInsert = transactions.map(trans => ({
                user_id: userId,
                client_id: trans.client_id,
                type: trans.type,
                amount: trans.amount,
                category: trans.category,
                name: trans.name,
                date: trans.date
            }));
            
            // Supabase 批量插入
            const { data, error } = await this.supabase
                .from('transactions')
                .insert(dataToInsert)
                .select();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('批量添加交易记录失败:', error);
            throw error;
        }
    }
    
    // 更新交易记录（使用 client_id）
    async updateTransaction(clientId, updates) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { data, error } = await this.supabase
                .from('transactions')
                .update(updates)
                .eq('client_id', clientId)
                .eq('user_id', userId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('更新交易记录失败:', error);
            throw error;
        }
    }
    
    // 删除交易记录（使用 client_id）
    async deleteTransaction(clientId) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { error } = await this.supabase
                .from('transactions')
                .delete()
                .eq('client_id', clientId)
                .eq('user_id', userId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('删除交易记录失败:', error);
            throw error;
        }
    }
    
    // 批量删除所有交易记录（性能优化）
    async deleteAllTransactions() {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            // 直接删除该用户的所有交易记录（一次请求）
            const { error } = await this.supabase
                .from('transactions')
                .delete()
                .eq('user_id', userId);
            
            if (error) throw error;
            console.log('所有交易记录已清空');
            return true;
        } catch (error) {
            console.error('批量删除交易记录失败:', error);
            throw error;
        }
    }
    
    // ========== 债务记录操作 ==========
    
    // 获取所有债务记录
    async getAllDebts() {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { data, error } = await this.supabase
                .from('debts')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });
            
            if (error) throw error;
            
            // 转换为应用格式
            return data.map(d => ({
                name: d.name,
                calculation: d.calculation,
                result: d.result,
                createdAt: d.created_at,
                updatedAt: d.updated_at,
                id: d.id
            }));
        } catch (error) {
            console.error('获取债务记录失败:', error);
            throw error;
        }
    }
    
    // 添加债务记录
    async addDebt(debt) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { data, error } = await this.supabase
                .from('debts')
                .insert([{
                    user_id: userId,
                    name: debt.name,
                    calculation: debt.calculation,
                    result: debt.result
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('添加债务记录失败:', error);
            throw error;
        }
    }
    
    // 批量添加债务记录（性能优化）
    async addDebtsBatch(debts) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            // 准备批量插入的数据
            const dataToInsert = debts.map(debt => ({
                user_id: userId,
                name: debt.name,
                calculation: debt.calculation,
                result: debt.result
            }));
            
            // Supabase 批量插入
            const { data, error } = await this.supabase
                .from('debts')
                .insert(dataToInsert)
                .select();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('批量添加债务记录失败:', error);
            throw error;
        }
    }
    
    // 更新债务记录
    async updateDebt(name, updates) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { data, error } = await this.supabase
                .from('debts')
                .update(updates)
                .eq('name', name)
                .eq('user_id', userId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('更新债务记录失败:', error);
            throw error;
        }
    }
    
    // 删除债务记录
    async deleteDebt(name) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { error } = await this.supabase
                .from('debts')
                .delete()
                .eq('name', name)
                .eq('user_id', userId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('删除债务记录失败:', error);
            throw error;
        }
    }
    
    // 批量删除所有债务记录（性能优化）
    async deleteAllDebts() {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            // 直接删除该用户的所有债务记录（一次请求）
            const { error } = await this.supabase
                .from('debts')
                .delete()
                .eq('user_id', userId);
            
            if (error) throw error;
            console.log('所有债务记录已清空');
            return true;
        } catch (error) {
            console.error('批量删除债务记录失败:', error);
            throw error;
        }
    }
    
    // ========== 烟草记录操作 ==========
    
    // 获取烟草记录
    async getTobaccoRecords(startDate, endDate) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            let query = this.supabase
                .from('tobacco_records')
                .select('*')
                .eq('user_id', userId);
            
            if (startDate) {
                query = query.gte('date', startDate);
            }
            if (endDate) {
                query = query.lte('date', endDate);
            }
            
            const { data, error } = await query.order('date', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('获取烟草记录失败:', error);
            throw error;
        }
    }
    
    // 添加烟草记录（使用 client_id）
    async addTobaccoRecord(record) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { data, error } = await this.supabase
                .from('tobacco_records')
                .insert([{
                    user_id: userId,
                    client_id: record.id,  // 使用前端生成的 id 作为 client_id
                    brand: record.brand,
                    quantity: record.quantity,
                    price: record.price,
                    date: record.date
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('添加烟草记录失败:', error);
            throw error;
        }
    }
    
    // 批量添加烟草记录（性能优化）
    async addTobaccoRecordsBatch(records) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            // 准备批量插入的数据
            const dataToInsert = records.map(record => ({
                user_id: userId,
                client_id: record.id || record.client_id,
                brand: record.brand,
                quantity: record.quantity,
                price: record.price,
                date: record.date
            }));
            
            // Supabase 批量插入
            const { data, error } = await this.supabase
                .from('tobacco_records')
                .insert(dataToInsert)
                .select();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('批量添加烟草记录失败:', error);
            throw error;
        }
    }
    
    // 更新烟草记录（使用 client_id）
    async updateTobaccoRecord(clientId, updates) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { data, error } = await this.supabase
                .from('tobacco_records')
                .update(updates)
                .eq('client_id', clientId)  // 使用 client_id 匹配
                .eq('user_id', userId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('更新烟草记录失败:', error);
            throw error;
        }
    }
    
    // 删除烟草记录（使用 client_id）
    async deleteTobaccoRecord(clientId) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { error } = await this.supabase
                .from('tobacco_records')
                .delete()
                .eq('client_id', clientId)  // 使用 client_id 匹配
                .eq('user_id', userId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('删除烟草记录失败:', error);
            throw error;
        }
    }
    
    // 批量删除所有烟草记录（性能优化）
    async deleteAllTobaccoRecords() {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            // 直接删除该用户的所有烟草记录（一次请求）
            const { error } = await this.supabase
                .from('tobacco_records')
                .delete()
                .eq('user_id', userId);
            
            if (error) throw error;
            console.log('所有烟草记录已清空');
            return true;
        } catch (error) {
            console.error('批量删除烟草记录失败:', error);
            throw error;
        }
    }
    
    // ========== 用户配置操作 ==========
    
    // 获取用户配置
    async getUserProfile() {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (error) {
                // 如果记录不存在，返回默认值
                if (error.code === 'PGRST116') {
                    return {
                        display_name: '尊贵的用户',
                        avatar: 'assets/icon-192.png'
                    };
                }
                throw error;
            }
            
            return {
                display_name: data.display_name || '尊贵的用户',
                avatar: 'assets/icon-192.png' // 固定使用本地头像
            };
        } catch (error) {
            console.error('获取用户配置失败:', error);
            // 返回默认值
            return {
                display_name: '尊贵的用户',
                avatar: 'assets/icon-192.png'
            };
        }
    }
    
    // 保存或更新用户配置
    async saveUserProfile(displayName) {
        try {
            const userId = this.supabaseManager.getCurrentUserId();
            if (!userId) throw new Error('用户未登录');
            
            // 使用 upsert 替代 select+update/insert，避免 406 错误
            const { data, error } = await this.supabase
                .from('user_profiles')
                .upsert({
                    user_id: userId,
                    display_name: displayName,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'  // 基于 user_id 的唯一约束
                })
                .select();
            
            if (error) throw error;
            console.log('用户配置保存成功:', data[0]);
            return data[0];
        } catch (error) {
            console.error('保存用户配置失败:', error);
            throw error;
        }
    }
    
    // ========== 分类操作 ==========
    
    // 获取用户的所有分类
    async getCategories(type) {
            try {
                const userId = this.supabaseManager.getCurrentUserId();
                if (!userId) throw new Error('用户未登录');
                
                let query = this.supabase
                    .from('categories')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: true });
                
                if (type) {
                    query = query.eq('type', type);
                }
                
                const { data, error } = await query;
                
                if (error) throw error;
                return data || [];
        } catch (error) {
            console.error('获取分类失败:', error);
            return [];
        }
    }
    
    // 添加分类
    async addCategory(type, name, isDefault = false) {
            try {
                const userId = this.supabaseManager.getCurrentUserId();
                if (!userId) throw new Error('用户未登录');
                
                const { data, error } = await this.supabase
                    .from('categories')
                    .insert([{
                        user_id: userId,
                        type: type,
                        name: name,
                        is_default: isDefault
                    }])
                    .select();
                
                if (error) throw error;
                return data[0];
        } catch (error) {
            console.error('添加分类失败:', error);
            throw error;
        }
    }
    
    // 删除分类（允许删除预设分类，但"默认"分类由前端控制）
    async deleteCategory(type, name) {
            try {
                const userId = this.supabaseManager.getCurrentUserId();
                if (!userId) throw new Error('用户未登录');
                
                const { error } = await this.supabase
                    .from('categories')
                    .delete()
                    .eq('user_id', userId)
                    .eq('type', type)
                    .eq('name', name);
                    // 移除 is_default 限制，允许删除预设分类
                
                if (error) throw error;
                return true;
        } catch (error) {
            console.error('删除分类失败:', error);
            throw error;
        }
    }
    
    // 初始化默认分类
    async initializeDefaultCategories() {
            try {
                const userId = this.supabaseManager.getCurrentUserId();
                if (!userId) throw new Error('用户未登录');
                
                // 检查是否已有分类
                const existingCategories = await this.getCategories();
                if (existingCategories.length > 0) {
                    return; // 已有分类，不需要初始化
                }
                
                // 默认进账分类
                const defaultIncomeCategories = ['默认'];
                
                // 默认支出分类
                const defaultExpenseCategories = ['矿泉水', '糖果', '纸巾', '洗手液', '擦手纸'];
                
                // 批量插入
                const categoriesToInsert = [
                    ...defaultIncomeCategories.map(name => ({
                        user_id: userId,
                        type: 'income',
                        name: name,
                        is_default: true
                    })),
                    ...defaultExpenseCategories.map(name => ({
                        user_id: userId,
                        type: 'expense',
                        name: name,
                        is_default: true
                    }))
                ];
                
                const { error } = await this.supabase
                    .from('categories')
                    .insert(categoriesToInsert);
                
                if (error) throw error;
                console.log('默认分类初始化成功');
        } catch (error) {
            console.error('初始化默认分类失败:', error);
        }
    }
}