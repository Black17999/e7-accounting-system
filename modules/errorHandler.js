// 错误处理和追踪模块
export class ErrorHandler {
    constructor() {
        this.errorMap = this.initErrorMap();
        this.sentryEnabled = false;
    }

    // 初始化 Sentry（可选 - 如需使用请在 https://sentry.io 注册账号）
    initSentry(dsn) {
        if (!dsn) return;

        try {
            // 动态加载 Sentry SDK
            const script = document.createElement('script');
            script.src = 'https://browser.sentry-cdn.com/7.x/bundle.min.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                if (window.Sentry) {
                    window.Sentry.init({
                        dsn: dsn,
                        environment: location.hostname === 'localhost' ? 'development' : 'production',
                        integrations: [
                            new window.Sentry.BrowserTracing(),
                            new window.Sentry.Replay()
                        ],
                        tracesSampleRate: 0.1,
                        replaysSessionSampleRate: 0.1,
                        replaysOnErrorSampleRate: 1.0,
                    });

                    this.sentryEnabled = true;
                    console.log('✅ Sentry 错误追踪已启动');
                }
            };
            script.onerror = () => {
                console.warn('⚠️ Sentry SDK 加载失败，错误追踪功能不可用');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('❌ Sentry 初始化失败:', error);
        }
    }

    // 错误码映射表 - 中文化所有错误信息
    initErrorMap() {
        return {
            // Supabase 认证错误
            'Invalid login credentials': '邮箱或密码错误，请重新输入',
            'Email not confirmed': '邮箱未验证，请检查您的邮箱并点击验证链接',
            'User not found': '用户不存在，请检查账号或注册新账号',
            'User already registered': '该邮箱已被注册，请直接登录或使用其他邮箱',
            'Password should be at least 6 characters': '密码至少需要6个字符',
            'Invalid email': '邮箱格式不正确，请检查后重新输入',
            'Email rate limit exceeded': '邮件发送过于频繁，请5分钟后再试',
            'For security purposes': '操作过于频繁，请稍等片刻后再试',
            'Signups not allowed for otp': '该邮箱未注册，请先注册账号',

            // Supabase 数据库错误
            'row-level security policy': '权限不足，无法访问该数据',
            'duplicate key': '数据已存在，无法重复添加',
            'foreign key': '数据关联错误，请检查相关数据',
            'violates check constraint': '数据验证失败，请检查输入内容',
            'violates not-null constraint': '必填字段不能为空',

            // 网络错误
            'Failed to fetch': '网络连接失败，请检查网络设置',
            'NetworkError': '网络错误，请稍后重试',
            'timeout': '请求超时，请检查网络连接',
            'net::ERR_INTERNET_DISCONNECTED': '网络已断开，请连接网络后重试',
            'net::ERR_NAME_NOT_RESOLVED': 'DNS解析失败，请检查网络设置',

            // IndexedDB 错误
            'QuotaExceededError': '存储空间不足，请清理浏览器数据后重试',
            'VersionError': '数据库版本冲突，请刷新页面',
            'InvalidStateError': '数据库状态异常，请刷新页面',

            // Supabase 特定错误
            '用户未登录': '您还未登录，请先登录',
            'JWT': '登录已过期，请重新登录',
            'refresh_token_not_found': '登录已过期，请重新登录',

            // 通用错误
            'undefined': '未知错误，请重试',
            'null': '操作失败，数据为空',
            'Cannot read property': '数据读取错误，请刷新页面'
        };
    }

    // 翻译错误信息为中文
    translateError(error) {
        if (!error) return '未知错误';

        const errorMessage = error.message || error.toString();

        // 如果错误信息已经是中文，直接返回
        if (/[\u4e00-\u9fa5]/.test(errorMessage)) {
            return errorMessage;
        }

        // 遍历错误映射表，找到匹配的翻译
        for (const [key, translation] of Object.entries(this.errorMap)) {
            if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
                return translation;
            }
        }

        // 没有匹配的翻译，返回通用提示
        return `操作失败: ${errorMessage}`;
    }

    // 处理错误（核心方法）
    handleError(error, context = {}) {
        console.error('❌ 错误发生:', error, context);

        // 翻译错误信息
        const userFriendlyMessage = this.translateError(error);

        // 上报到 Sentry（如果已初始化）
        if (this.sentryEnabled && window.Sentry) {
            window.Sentry.captureException(error, {
                contexts: {
                    custom: context
                },
                tags: {
                    operation: context.operation || 'unknown',
                    user_email: context.user || 'anonymous'
                }
            });
        }

        // 显示用户友好的提示
        this.showErrorToast(userFriendlyMessage);

        return userFriendlyMessage;
    }

    // 显示错误提示 Toast
    showErrorToast(message) {
        // 移除已存在的 Toast
        const existingToast = document.querySelector('.error-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建 Toast 元素
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="error-toast-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加样式（如果还没有）
        if (!document.getElementById('error-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'error-toast-styles';
            style.textContent = `
                .error-toast {
                    position: fixed;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #f44336;
                    color: white;
                    padding: 14px 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(244, 67, 54, 0.4);
                    z-index: 10001;
                    animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    max-width: 85%;
                    font-size: 14px;
                }
                .error-toast-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    line-height: 1.5;
                }
                .error-toast-content i {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                @keyframes slideDown {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(30px);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // 4秒后自动移除
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // 包装异步函数，自动处理错误
    wrapAsync(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handleError(error, { ...context, args });
                throw error; // 重新抛出，让调用者也能处理
            }
        };
    }

    // 包装 Supabase 操作（简化错误处理）
    async wrapSupabaseOperation(operation, operationName) {
        try {
            return await operation();
        } catch (error) {
            this.handleError(error, { operation: operationName });
            throw error;
        }
    }
}

// 全局错误监听器初始化
export function initGlobalErrorHandler(errorHandler) {
    // 捕获未处理的 Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ 未处理的 Promise 错误:', event.reason);
        errorHandler.handleError(event.reason, {
            type: 'unhandledRejection',
            promise: event.promise
        });
        event.preventDefault(); // 阻止浏览器默认的错误提示
    });

    // 捕获全局 JavaScript 错误
    window.addEventListener('error', (event) => {
        // 过滤掉资源加载错误（图片、脚本等）
        if (event.target !== window) {
            console.warn('⚠️ 资源加载失败:', event.target.src || event.target.href);
            return;
        }

        console.error('❌ 全局 JavaScript 错误:', event.error);
        if (event.error) {
            errorHandler.handleError(event.error, {
                type: 'globalError',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        }
    });

    console.log('✅ 全局错误监听器已启动');
}
