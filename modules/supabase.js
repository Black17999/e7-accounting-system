// Supabase 初始化和认证模块
export class SupabaseManager {
    constructor() {
        // Supabase 配置
        const SUPABASE_URL = 'https://xshgtchcsvfsfswoylcx.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaGd0Y2hjc3Zmc2Zzd295bGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTkwMjUsImV4cCI6MjA3NjM3NTAyNX0.1YBZ76IeRpNV9b_fjMRggTRQyDQY4Y7yBwOHNlhUs8w';
        
        // 初始化 Supabase 客户端
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.currentUser = null;
    }
    
    // 检查用户登录状态
    async checkAuth() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                return true;
            }
            return false;
        } catch (error) {
            console.error('检查登录状态失败:', error);
            return false;
        }
    }
    
    // 邮箱注册
    async signUp(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            if (data.user) {
                this.currentUser = data.user;
                return { success: true, user: data.user };
            }
            
            return { success: false, message: '注册失败' };
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 邮箱登录
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            if (data.user) {
                this.currentUser = data.user;
                return { success: true, user: data.user };
            }
            
            return { success: false, message: '登录失败' };
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 登出
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('登出失败:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 获取当前用户ID
    getCurrentUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }
    
    // 监听认证状态变化
    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                this.currentUser = session.user;
            } else {
                this.currentUser = null;
            }
            callback(event, session);
        });
    }
}