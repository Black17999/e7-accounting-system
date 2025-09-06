// 模块加载器
export class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
    }

    // 按需加载模块
    async loadModule(moduleName) {
        // 如果模块已经加载，直接返回
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        // 如果正在加载中，返回加载Promise
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        // 开始加载模块
        const loadPromise = this._loadModule(moduleName);
        this.loadingPromises.set(moduleName, loadPromise);

        try {
            const module = await loadPromise;
            this.loadedModules.set(moduleName, module);
            this.loadingPromises.delete(moduleName);
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }

    // 实际加载模块的方法
    async _loadModule(moduleName) {
        switch (moduleName) {
            case 'dataManager':
                const { DataManager } = await import('./dataManager.js');
                return new DataManager();
            
            case 'statistics':
                const { StatisticsManager } = await import('./statistics.js');
                return new StatisticsManager();
            
            case 'tobacco':
                const { TobaccoManager } = await import('./tobacco.js');
                return new TobaccoManager();
            
            case 'ui':
                const { UIManager } = await import('./uiManager.js');
                return new UIManager();
            
            case 'voiceRecognition':
                const { VoiceRecognitionManager } = await import('./voice/voiceRecognition.js');
                return new VoiceRecognitionManager();
            
            default:
                throw new Error(`未知模块: ${moduleName}`);
        }
    }

    // 预加载模块（可选）
    async preloadModules(moduleNames) {
        const promises = moduleNames.map(name => this.loadModule(name));
        return Promise.all(promises);
    }

    // 检查模块是否已加载
    isModuleLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    // 获取已加载的模块
    getLoadedModule(moduleName) {
        return this.loadedModules.get(moduleName);
    }

    // 清理模块
    unloadModule(moduleName) {
        const module = this.loadedModules.get(moduleName);
        if (module && typeof module.destroy === 'function') {
            module.destroy();
        }
        this.loadedModules.delete(moduleName);
    }

    // 清理所有模块
    unloadAllModules() {
        for (const [name, module] of this.loadedModules) {
            if (typeof module.destroy === 'function') {
                module.destroy();
            }
        }
        this.loadedModules.clear();
        this.loadingPromises.clear();
    }
}
