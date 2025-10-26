// 分类管理模块
export class CategoryManager {
    constructor() {
        // 进账分类预设（只有进账有"默认"分类）
        this.incomeCategories = [
            { id: 'default', name: '默认', icon: 'fa-circle-dot', favorite: true, isDefault: true },
            { id: 'self-service', name: '自助', icon: 'fa-coins', favorite: true },
            { id: 'zhuanzhuan', name: '转转', icon: 'fa-exchange-alt', favorite: true },
            { id: 'mahjong', name: '麻将', icon: 'fa-dice', favorite: false },
            { id: 'poker', name: '扑克', icon: 'fa-diamond', favorite: false }
        ];

        // 支出分类预设（支出没有"默认"概念，所有分类都可以删除）
        this.expenseCategories = [
            { id: 'water', name: '矿泉水', icon: 'fa-tint', favorite: false },
            { id: 'candy', name: '糖果', icon: 'fa-candy-cane', favorite: false },
            { id: 'tissue', name: '纸巾', icon: 'fa-toilet-paper', favorite: false },
            { id: 'soap', name: '洗手液', icon: 'fa-pump-soap', favorite: false },
            { id: 'paper-towel', name: '擦手纸', icon: 'fa-hand-paper', favorite: false }
        ];

        this.loadFavorites();
        this.loadDeletedPresets(); // 加载已删除的预设分类
    }

    // 加载已删除的预设分类ID列表
    loadDeletedPresets() {
        const savedDeleted = localStorage.getItem('deletedPresetCategories');
        if (savedDeleted) {
            try {
                const deleted = JSON.parse(savedDeleted);
                // 从进账分类中移除已删除的预设
                if (deleted.income) {
                    this.incomeCategories = this.incomeCategories.filter(
                        cat => !deleted.income.includes(cat.id)
                    );
                }
                // 从支出分类中移除已删除的预设
                if (deleted.expense) {
                    this.expenseCategories = this.expenseCategories.filter(
                        cat => !deleted.expense.includes(cat.id)
                    );
                }
            } catch (e) {
                console.error('Failed to load deleted presets:', e);
            }
        }
    }

    // 保存已删除的预设分类ID
    saveDeletedPreset(categoryId, type) {
        const savedDeleted = localStorage.getItem('deletedPresetCategories');
        let deleted = { income: [], expense: [] };

        if (savedDeleted) {
            try {
                deleted = JSON.parse(savedDeleted);
            } catch (e) {
                console.error('Failed to parse deleted presets:', e);
            }
        }

        // 添加到已删除列表
        if (type === 'income' && !deleted.income.includes(categoryId)) {
            deleted.income.push(categoryId);
        } else if (type === 'expense' && !deleted.expense.includes(categoryId)) {
            deleted.expense.push(categoryId);
        }

        localStorage.setItem('deletedPresetCategories', JSON.stringify(deleted));
    }

    // 加载收藏状态
    loadFavorites() {
        const savedFavorites = localStorage.getItem('categoryFavorites');
        if (savedFavorites) {
            try {
                const favorites = JSON.parse(savedFavorites);
                this.updateFavorites(this.incomeCategories, favorites.income || []);

                // 为支出分类更新收藏状态，但强制移除特定分类的星标
                const expenseFavorites = (favorites.expense || []).filter(
                    id => !['water', 'candy', 'tissue'].includes(id)
                );
                this.updateFavorites(this.expenseCategories, expenseFavorites);
            } catch (e) {
                console.error('Failed to load category favorites:', e);
            }
        }

        // 加载自定义分类
        this.loadCustomCategories();
    }

    // 加载自定义分类
    loadCustomCategories() {
        const savedCustom = localStorage.getItem('customCategories');
        if (savedCustom) {
            try {
                const custom = JSON.parse(savedCustom);
                if (custom.income) {
                    this.incomeCategories.push(...custom.income);
                }
                if (custom.expense) {
                    this.expenseCategories.push(...custom.expense);
                }
            } catch (e) {
                console.error('Failed to load custom categories:', e);
            }
        }
    }

    // 保存自定义分类
    saveCustomCategories() {
        const custom = {
            income: this.incomeCategories.filter(cat => cat.custom),
            expense: this.expenseCategories.filter(cat => cat.custom)
        };
        localStorage.setItem('customCategories', JSON.stringify(custom));
    }

    // 更新收藏状态
    updateFavorites(categories, favoriteIds) {
        categories.forEach(cat => {
            cat.favorite = favoriteIds.includes(cat.id);
        });
    }

    // 保存收藏状态
    saveFavorites() {
        const favorites = {
            income: this.incomeCategories.filter(cat => cat.favorite).map(cat => cat.id),
            expense: this.expenseCategories.filter(cat => cat.favorite).map(cat => cat.id)
        };
        localStorage.setItem('categoryFavorites', JSON.stringify(favorites));
    }

    // 切换收藏状态
    toggleFavorite(categoryId, type) {
        const categories = type === 'income' ? this.incomeCategories : this.expenseCategories;
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
            category.favorite = !category.favorite;
            this.saveFavorites();
            return true;
        }
        return false;
    }

    // 获取分类（带收藏置顶）
    getCategories(type) {
        const categories = type === 'income' ? [...this.incomeCategories] : [...this.expenseCategories];
        return categories.sort((a, b) => {
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    // 添加自定义分类（支持云端同步）
    async addCustomCategory(name, type, icon = 'fa-plus', supabaseDataManager = null) {
        const categories = type === 'income' ? this.incomeCategories : this.expenseCategories;
        
        // 清理分类名称，移除前后空白
        const cleanName = (name || '').trim();
        if (!cleanName) {
            throw new Error('分类名称不能为空');
        }
        
        // 如果提供了 supabaseDataManager，保存到云端
        if (supabaseDataManager) {
            try {
                const savedCategory = await supabaseDataManager.addCategory(type, cleanName, false);
                const newCategory = {
                    id: savedCategory.id,
                    name: savedCategory.name,
                    icon,
                    favorite: false,
                    custom: true,
                    isDefault: false
                };
                categories.push(newCategory);
                console.log('分类已保存到云端:', newCategory);
                return newCategory;
            } catch (error) {
                console.error('保存分类到云端失败:', error);
                // 失败时回退到本地存储
            }
        }
        
        // 本地存储模式（向后兼容）
        const newCategory = {
            id: `custom-${Date.now()}`,
            name: cleanName,
            icon,
            favorite: false,
            custom: true
        };
        categories.push(newCategory);
        this.saveCustomCategories();
        return newCategory;
    }

    // 移除分类（除了默认分类，其他都可以删除）（支持云端同步）
    async removeCustomCategory(categoryId, type, supabaseDataManager = null) {
        const categories = type === 'income' ? this.incomeCategories : this.expenseCategories;
        const category = categories.find(cat => cat.id === categoryId);

        // 只禁止删除默认分类
        if (!category || category.isDefault || category.id === 'default') {
            return false;
        }

        const index = categories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            // 如果提供了 supabaseDataManager，从云端删除（无论是自定义还是预设分类）
            if (supabaseDataManager) {
                try {
                    await supabaseDataManager.deleteCategory(type, category.name);
                    console.log('分类已从云端删除:', category.name);
                } catch (error) {
                    console.error('从云端删除分类失败:', error);
                }
            }
            
            categories.splice(index, 1);

            // 如果是自定义分类，保存自定义分类列表
            if (category.custom) {
                this.saveCustomCategories();
            } else {
                // 如果是预设分类，记录到已删除列表
                this.saveDeletedPreset(categoryId, type);
            }

            this.saveFavorites(); // 同时更新收藏状态
            return true;
        }
        return false;
    }
}

// 底部弹窗选择器类
export class BottomSheetCategoryPicker {
    constructor(categoryManager, type, onSelect, onCategoryListChange, onCategoryDelete, supabaseDataManager = null) {
        this.categoryManager = categoryManager;
        this.type = type;
        this.onSelect = onSelect;
        this.onCategoryListChange = onCategoryListChange; // 新增：分类列表变化回调
        this.onCategoryDelete = onCategoryDelete; // 新增：分类删除回调，用于更新记录
        this.supabaseDataManager = supabaseDataManager; // 新增：云端数据管理器
        this.modal = null;
    }

    // 显示选择器
    show() {
        this.createModal();
        document.body.appendChild(this.modal);
        setTimeout(() => {
            this.modal.classList.add('visible');
        }, 10);
    }

    // 创建模态框
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'category-picker-modal';
        this.modal.innerHTML = this.getModalHTML();
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // 添加关闭按钮事件
        const closeBtn = this.modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

            // 添加点击事件监听
            setTimeout(() => {
                this.bindCategoryEvents();
            }, 0);
    }

    // 绑定分类事件
    bindCategoryEvents() {
        const containers = this.modal.querySelectorAll('.category-item-container');
        const items = this.modal.querySelectorAll('.category-item-inner');

        // 统一处理触摸事件（合并滑动和点击检测）
        items.forEach(item => {
            if (item.dataset.eventBound === 'true') {
                return;
            }
            item.dataset.eventBound = 'true';

            const container = item.closest('.category-item-container');
            const hasDeleteBtn = container && container.querySelector('.category-swipe-delete');

            let touchStartX = 0;
            let touchStartY = 0;
            let touchStartTime = 0;
            let isSwiping = false;
            const swipeThreshold = 40; // 滑动距离阈值
            const moveThreshold = 15; // 判断是滑动还是点击的移动阈值

            item.addEventListener('touchstart', (e) => {
                // 如果点击收藏或删除按钮，不处理
                if (e.target.closest('.favorite-btn') || e.target.closest('.category-delete-btn')) {
                    return;
                }

                // 重置其他所有打开的项
                this.resetAllSwipes(item);

                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                touchStartTime = Date.now();
                isSwiping = false;
            }, { passive: true });

            // 只有可删除的项才需要 touchmove 处理
            if (hasDeleteBtn) {
                item.addEventListener('touchmove', (e) => {
                    const touch = e.touches[0];
                    const diffX = touch.clientX - touchStartX;
                    const diffY = touch.clientY - touchStartY;
                    const absX = Math.abs(diffX);
                    const absY = Math.abs(diffY);

                    // 判断是否开始滑动
                    if (!isSwiping && absX > moveThreshold) {
                        // 如果水平移动大于垂直移动，且向左滑，认为是滑动
                        if (absX > absY * 1.5 && diffX < 0) {
                            isSwiping = true;
                            item.classList.add('swiping');
                        }
                    }

                    // 如果正在滑动
                    if (isSwiping && diffX < 0) {
                        const distance = Math.max(diffX, -80);
                        item.style.transform = `translateX(${distance}px)`;
                        // 只在确实需要阻止滚动时才调用 preventDefault
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                    }
                }, { passive: false });
            }

            item.addEventListener('touchend', (e) => {
                // 如果点击的是收藏按钮或删除按钮，不处理
                if (e.target.closest('.favorite-btn') || e.target.closest('.category-delete-btn')) {
                    return;
                }

                const touch = e.changedTouches[0];
                const diffX = touch.clientX - touchStartX;
                const moveX = Math.abs(diffX);
                const moveY = Math.abs(touch.clientY - touchStartY);
                const touchDuration = Date.now() - touchStartTime;

                item.classList.remove('swiping');

                // 处理滑动
                if (isSwiping) {
                    if (diffX < -swipeThreshold) {
                        // 向左滑动达到阈值，显示删除按钮
                        item.style.transform = 'translateX(-80px)';
                        const container = item.closest('.category-item-container');
                        if (container) {
                            container.classList.add('swiped');
                        }
                        item.classList.add('swiped');
                    } else {
                        // 未达到阈值或向右滑动，恢复原位
                        item.style.transform = 'translateX(0)';
                        const container = item.closest('.category-item-container');
                        if (container) {
                            container.classList.remove('swiped');
                        }
                        item.classList.remove('swiped');
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    isSwiping = false;
                    return;
                }

                // 如果已经滑动打开，点击空白区域时关闭
                if (item.classList.contains('swiped')) {
                    // 点击已滑开的项，恢复原位
                    item.style.transform = 'translateX(0)';
                    const container = item.closest('.category-item-container');
                    if (container) {
                        container.classList.remove('swiped');
                    }
                    item.classList.remove('swiped');
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                // 处理点击：必须是快速且无明显移动
                if (touchDuration < 500 && moveX < 10 && moveY < 10) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (item.id === 'add-category-option') {
                        // 点击【添加分类】选项
                        this.modal.style.display = 'none';
                        this.showAddCategoryDialog(this.type);
                    } else {
                        const categoryId = item.dataset.id;
                        const category = this.getCategoryById(categoryId);
                        if (category) {
                            // 执行选择操作
                            this.onSelect(category.name);
                            // 立即隐藏模态框
                            this.hide();
                        }
                    }
                } else {
                    // 不是有效的点击，重置位置
                    item.style.transform = 'translateX(0)';
                    item.classList.remove('swiped');
                }

                isSwiping = false;
            }, { passive: false });
        });

        // 添加收藏按钮事件
        const favoriteButtons = this.modal.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(btn => {
            if (btn.dataset.eventBound === 'true') {
                return;
            }
            btn.dataset.eventBound = 'true';

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const categoryId = btn.dataset.id;
                const success = this.categoryManager.toggleFavorite(categoryId, this.type);
                if (success) {
                    this.refreshList();
                    // 通知外部分类列表已变化,以便刷新SwipeCategoryPicker
                    if (this.onCategoryListChange) {
                        this.onCategoryListChange();
                    }
                }
            });
        });

        // 添加删除按钮事件
        const deleteButtons = this.modal.querySelectorAll('.category-delete-btn');
        deleteButtons.forEach(btn => {
            if (btn.dataset.eventBound === 'true') {
                return;
            }
            btn.dataset.eventBound = 'true';

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const categoryId = btn.dataset.id;
                this.confirmAndDeleteCategory(categoryId);
            });
        });
    }

    // 重置所有滑动状态
    resetAllSwipes(exceptItem = null) {
        const allItems = this.modal.querySelectorAll('.category-item-inner');
        allItems.forEach(item => {
            if (item !== exceptItem) {
                item.style.transform = 'translateX(0)';
                const container = item.closest('.category-item-container');
                if (container) {
                    container.classList.remove('swiped');
                }
                item.classList.remove('swiped');
            }
        });
    }

    // 确认并删除分类
    confirmAndDeleteCategory(categoryId) {
        const category = this.getCategoryById(categoryId);
        if (!category) return;

        // 只有进账的"默认"分类不能删除
        if (this.type === 'income' && category.id === 'default') {
            this.showToast('进账的【默认】分类无法删除');
            return;
        }

        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-header">
                    <h3>确认删除</h3>
                </div>
                <div class="confirm-body">
                    <p>确定要删除分类"${category.name}"吗？</p>
                    <p class="warning-text">此操作将把所有使用该分类的记录更新为【默认】分类！</p>
                </div>
                <div class="confirm-footer">
                    <button class="cancel-delete-btn">取消</button>
                    <button class="confirm-delete-btn">确认删除</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const cancelBtn = dialog.querySelector('.cancel-delete-btn');
        const confirmBtn = dialog.querySelector('.confirm-delete-btn');

        const closeDialog = () => {
            dialog.remove();
            // 重置所有分类项的滑动状态
            const items = this.modal.querySelectorAll('.category-item-inner');
            items.forEach(item => {
                item.style.transform = 'translateX(0)';
                const container = item.closest('.category-item-container');
                if (container) {
                    container.classList.remove('swiped');
                }
                item.classList.remove('swiped');
            });
        };

        cancelBtn.addEventListener('click', closeDialog);

        confirmBtn.addEventListener('click', async () => {
            // 删除分类
            const success = await this.categoryManager.removeCustomCategory(categoryId, this.type, this.supabaseDataManager);
            if (success) {
                // 关闭确认对话框
                closeDialog();

                // 立即关闭选择分类模态框
                this.hide();

                // 显示成功提示
                this.showToast('分类删除成功');

                // 更新所有使用该分类的记录为默认分类
                if (this.onCategoryDelete) {
                    this.onCategoryDelete(category.name);
                }

                // 通知外部分类列表已变化（用于刷新支出模态框中的分类选择器）
                if (this.onCategoryListChange) {
                    this.onCategoryListChange();
                }
            } else {
                this.showToast('删除失败，默认分类无法删除');
                closeDialog();
            }
        });

        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
    }

    // 获取分类对象
    getCategoryById(categoryId) {
        const categories = this.type === 'income' ?
            this.categoryManager.incomeCategories :
            this.categoryManager.expenseCategories;
        return categories.find(cat => cat.id === categoryId);
    }

    // 刷新列表
    refreshList() {
        const list = this.modal.querySelector('.category-list');
        if (list) {
            list.innerHTML = this.getCategoryListHTML();

            // 重新绑定所有事件
            this.bindCategoryEvents();
        }
    }

    // 获取模态框HTML
    getModalHTML() {
        return `
            <div class="category-picker-content">
                <div class="category-picker-header">
                    <h3>选择分类</h3>
                    <div class="header-actions">
                        <button class="close-btn">&times;</button>
                    </div>
                </div>
                <div class="category-list">
                    ${this.getCategoryListHTML()}
                </div>
            </div>
        `;
    }

    // 获取分类列表HTML
    getCategoryListHTML() {
        const categories = this.categoryManager.getCategories(this.type);
        const categoryItems = categories.map(category => {
            // 进账的"默认"分类不可删除，其他都可以删除
            const canDelete = !(this.type === 'income' && category.id === 'default');
            return `
            <div class="category-item-container" data-id="${category.id}">
                <div class="category-item-inner" data-id="${category.id}">
                    <div class="category-icon">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <span class="category-name" data-length="${category.name.length}">${category.name}</span>
                    <button class="favorite-btn ${category.favorite ? 'favorited' : ''}" data-id="${category.id}">
                        <i class="${category.favorite ? 'fas fa-star' : 'far fa-star'}"></i>
                    </button>
                </div>
                ${canDelete ? `<div class="category-swipe-delete">
                    <button class="category-delete-btn" data-id="${category.id}">删除</button>
                </div>` : ''}
            </div>
        `}).join('');

        // 添加【添加分类】选项
        return categoryItems + `
            <div class="category-item-container">
                <div class="category-item-inner add-category-item" id="add-category-option">
                    <div class="category-icon">
                        <i class="fas fa-plus-circle"></i>
                    </div>
                    <span class="category-name">添加分类</span>
                    <button class="favorite-btn" style="visibility: hidden;">
                        <i class="far fa-star"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // 隐藏选择器
    hide() {
        if (this.modal) {
            this.modal.classList.remove('visible');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
            }, 300);
        }
    }

    // 显示编辑分类对话框
    showEditCategoriesDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'edit-categories-dialog';
        dialog.innerHTML = `
            <div class="edit-categories-content">
                <div class="edit-categories-header">
                    <h3>编辑分类</h3>
                    <button class="close-edit-btn">&times;</button>
                </div>
                <div class="edit-categories-body">
                    <div class="categories-list-container">
                        ${this.getEditableCategoriesListHTML()}
                    </div>
                </div>
                <div class="edit-categories-footer">
                    <button class="add-category-btn">添加新分类</button>
                    <button class="save-edit-btn">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 添加关闭事件
        const closeBtn = dialog.querySelector('.close-edit-btn');
        closeBtn.addEventListener('click', () => {
            dialog.remove();
        });
        
        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });

        // 添加分类按钮事件
        const addBtn = dialog.querySelector('.add-category-btn');
        addBtn.addEventListener('click', () => {
            this.showAddCategoryDialog(this.type);
        });

        // 保存按钮事件
        const saveBtn = dialog.querySelector('.save-edit-btn');
        saveBtn.addEventListener('click', () => {
            dialog.remove();
        });
    }

    // 获取可编辑分类列表HTML
    getEditableCategoriesListHTML() {
        const categories = this.categoryManager.getCategories(this.type);
        return categories.map(category => `
            <div class="editable-category-item" data-id="${category.id}">
                <div class="category-info">
                    <div class="category-icon">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <span class="category-name" data-length="${category.name.length}">${category.name}</span>
                </div>
                <div class="category-actions">
                    ${category.custom ? `
                    <button class="delete-category-btn" data-id="${category.id}" title="删除分类">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // 显示添加分类对话框
    showAddCategoryDialog(type) {
        const dialog = document.createElement('div');
        dialog.className = 'add-category-dialog';
        dialog.innerHTML = `
            <div class="add-category-content">
                <div class="add-category-header">
                    <h3>添加新分类</h3>
                    <button class="close-add-btn">&times;</button>
                </div>
                <div class="add-category-body">
                    <div class="form-group">
                        <div class="form-labels-row">
                            <label for="category-name">分类名称</label>
                            <label for="category-icon">图标选择</label>
                        </div>
                        <div class="form-inputs-row">
                            <input type="text" id="category-name" class="category-name-input"
                                   placeholder="请输入分类名称" maxlength="20">
                            <button class="selected-icon" id="icon-picker-btn" type="button">
                                <i class="fas fa-coins" id="selected-icon-display"></i>
                            </button>
                        </div>
                        <div class="error-message" id="name-error"></div>
                    </div>
                </div>
                <div class="add-category-footer">
                    <button class="cancel-add-btn">取消</button>
                    <button class="confirm-add-btn">确认添加</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // 创建独立的图标选择器模态框
        const iconPickerModal = document.createElement('div');
        iconPickerModal.className = 'icon-picker-modal';
        iconPickerModal.id = 'icon-picker-modal';
        iconPickerModal.innerHTML = `
            <div class="icon-picker-modal-content">
                <div class="icon-picker-header">
                    <h4>选择图标</h4>
                    <button class="close-icon-picker">&times;</button>
                </div>
                <div class="icon-grid">
                    ${this.getIconOptionsHTML()}
                </div>
            </div>
        `;

        document.body.appendChild(iconPickerModal);

        let selectedIcon = 'fa-coins';

        // 绑定事件
        const closeBtn = dialog.querySelector('.close-add-btn');
        const cancelBtn = dialog.querySelector('.cancel-add-btn');
        const confirmBtn = dialog.querySelector('.confirm-add-btn');
        const iconPickerBtn = dialog.querySelector('#icon-picker-btn');
        const closeIconPicker = iconPickerModal.querySelector('.close-icon-picker');
        const iconItems = iconPickerModal.querySelectorAll('.icon-item');
        const nameInput = dialog.querySelector('.category-name-input');

        // 检查元素是否正确获取
        if (!confirmBtn) {
            console.error('确认按钮未找到');
            return;
        }
        if (!iconPickerBtn) {
            console.error('图标选择按钮未找到');
            return;
        }

        // 关闭对话框 - 返回选择分类模态框
        const closeDialog = () => {
            dialog.remove();
            iconPickerModal.remove();
            // 显示回选择分类模态框
            if (this.modal) {
                this.modal.style.display = 'flex';
            }
        };

        closeBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);

        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });

        // 图标选择器
        iconPickerBtn.addEventListener('click', () => {
            // 隐藏添加分类对话框
            dialog.style.display = 'none';
            // 显示图标选择器
            iconPickerModal.classList.add('visible');
        });

        closeIconPicker.addEventListener('click', () => {
            // 隐藏图标选择器
            iconPickerModal.classList.remove('visible');
            // 显示回添加分类对话框
            dialog.style.display = 'flex';
        });

        // 点击图标选择器背景关闭
        iconPickerModal.addEventListener('click', (e) => {
            if (e.target === iconPickerModal) {
                iconPickerModal.classList.remove('visible');
                dialog.style.display = 'flex';
            }
        });

        // 选择图标
        iconItems.forEach(item => {
            item.addEventListener('click', () => {
                selectedIcon = item.dataset.icon;
                const selectedIconEl = dialog.querySelector('#selected-icon-display');
                if (selectedIconEl) {
                    selectedIconEl.className = `fas ${selectedIcon}`;
                }
                // 隐藏图标选择器
                iconPickerModal.classList.remove('visible');
                // 显示回添加分类对话框
                dialog.style.display = 'flex';
            });
        });

        // 确认添加
        confirmBtn.addEventListener('click', async (e) => {
            e.preventDefault(); // 防止表单提交
            console.log('确认添加按钮被点击');

            const name = nameInput.value.trim();
            console.log('输入的分类名称:', name);

            // 验证输入
            if (!name) {
                this.showError('name-error', '分类名称不能为空');
                return;
            }

            if (name.length > 20) {
                this.showError('name-error', '分类名称不能超过20个字符');
                return;
            }

            // 检查是否已存在同名分类
            const categories = this.type === 'income' ?
                this.categoryManager.incomeCategories :
                this.categoryManager.expenseCategories;

            const exists = categories.some(cat => cat.name === name);
            if (exists) {
                this.showError('name-error', '该分类名称已存在');
                return;
            }

            // 添加分类（同步到云端）
            const newCategory = await this.categoryManager.addCustomCategory(name, this.type, selectedIcon, this.supabaseDataManager);

            // 显示成功提示
            this.showToast('分类添加成功');

            // 刷新选择分类模态框列表
            if (this.modal) {
                this.refreshList();
            }

            // 通知外部分类列表已变化（用于刷新支出模态框中的分类选择器）
            if (this.onCategoryListChange) {
                this.onCategoryListChange();
            }

            closeDialog();
        });
        
        // 输入验证
        nameInput.addEventListener('input', () => {
            this.hideError('name-error');
        });
    }

    // 获取图标选项HTML
    getIconOptionsHTML() {
        const icons = [
            'fa-coins', 'fa-money-bill-wave', 'fa-calculator', 'fa-file-invoice-dollar',
            'fa-chart-bar', 'fa-chart-pie', 'fa-smoking', 'fa-circle-plus',
            'fa-cart-shopping', 'fa-utensils', 'fa-car', 'fa-house',
            'fa-gift', 'fa-heart', 'fa-star', 'fa-tag',
            'fa-book', 'fa-graduation-cap', 'fa-briefcase', 'fa-plane',
            'fa-train', 'fa-bus', 'fa-train-subway', 'fa-taxi',
            'fa-bicycle', 'fa-person-walking', 'fa-person-running', 'fa-person-swimming',
            'fa-football', 'fa-basketball', 'fa-volleyball', 'fa-baseball',
            'fa-futbol', 'fa-baseball-bat-ball', 'fa-hockey-puck', 'fa-golf-ball-tee',
            'fa-person-skiing', 'fa-person-skiing-nordic', 'fa-person-snowboarding', 'fa-heart',
            'fa-person-hiking', 'fa-mountain', 'fa-tree', 'fa-paw',
            'fa-dog', 'fa-cat', 'fa-dove', 'fa-fish',
            'fa-spider', 'fa-hippo', 'fa-building', 'fa-dragon',
            'fa-ghost', 'fa-robot', 'fa-user-astronaut', 'fa-rocket',
            'fa-moon', 'fa-sun', 'fa-cloud', 'fa-cloud-rain',
            'fa-cloud-sun', 'fa-cloud-moon', 'fa-bolt', 'fa-snowflake',
            'fa-wind', 'fa-umbrella', 'fa-shield', 'fa-key',
            'fa-lock', 'fa-unlock', 'fa-wifi', 'fa-bluetooth',
            'fa-headphones', 'fa-microphone', 'fa-volume-high', 'fa-camera',
            'fa-video', 'fa-tv', 'fa-laptop', 'fa-mobile-screen',
            'fa-tablet-screen-button', 'fa-desktop', 'fa-gamepad', 'fa-chess',
            'fa-dice', 'fa-puzzle-piece', 'fa-cube', 'fa-masks-theater',
            'fa-music', 'fa-guitar', 'fa-drum', 'fa-bell',
            'fa-mug-hot', 'fa-coffee', 'fa-mug-saucer', 'fa-wine-glass',
            'fa-beer-mug-empty', 'fa-martini-glass', 'fa-champagne-glasses', 'fa-whiskey-glass'
        ];

        return icons.map(icon => `
            <div class="icon-item" data-icon="${icon}">
                <i class="fas ${icon}"></i>
            </div>
        `).join('');
    }

    // 显示错误信息
    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    // 隐藏错误信息
    hideError(elementId) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    // 显示成功提示
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 4000;
            animation: toastSlideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // 绑定删除事件
    bindDeleteEvents(dialog) {
        const deleteButtons = dialog.querySelectorAll('.delete-category-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryId = btn.dataset.id;
                this.showDeleteConfirmDialog(categoryId);
            });
        });
    }

    // 显示删除确认对话框
    showDeleteConfirmDialog(categoryId) {
        const category = this.getCategoryById(categoryId);
        if (!category) return;
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-header">
                    <h3>确认删除</h3>
                </div>
                <div class="confirm-body">
                    <p>确定要删除分类"${category.name}"吗？</p>
                    <p class="warning-text">此操作将同时删除该分类下的所有关联记录！</p>
                </div>
                <div class="confirm-footer">
                    <button class="cancel-delete-btn">取消</button>
                    <button class="confirm-delete-btn">确认删除</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const cancelBtn = dialog.querySelector('.cancel-delete-btn');
        const confirmBtn = dialog.querySelector('.confirm-delete-btn');
        
        const closeDialog = () => dialog.remove();
        
        cancelBtn.addEventListener('click', closeDialog);
        
        confirmBtn.addEventListener('click', () => {
            // 删除分类及其关联记录
            this.deleteCategoryWithRecords(categoryId);
            closeDialog();
            
            // 刷新编辑对话框中的分类列表
            const editDialog = document.querySelector('.edit-categories-dialog');
            if (editDialog) {
                const listContainer = editDialog.querySelector('.categories-list-container');
                if (listContainer) {
                    listContainer.innerHTML = this.getEditableCategoriesListHTML();
                    this.bindDeleteEvents(editDialog);
                }
            }
            
            this.showToast('分类删除成功');
        });
        
        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
    }

    // 删除分类及其关联记录
    async deleteCategoryWithRecords(categoryId) {
        // 删除分类（传递 supabaseDataManager 以同步到云端）
        const success = await this.categoryManager.removeCustomCategory(categoryId, this.type, this.supabaseDataManager);
        
        if (success) {
            // 这里需要实现删除关联记录的逻辑
            // 由于数据管理在dataManager中，需要协调处理
            console.log(`分类 ${categoryId} 已删除，需要处理关联记录`);
        }
    }
}

// 手势滑动选择器类 - 简化为网格布局选择器
export class SwipeCategoryPicker {
    constructor(categoryManager, onSelect) {
        this.categoryManager = categoryManager;
        this.onSelect = onSelect;
        this.container = null;
    }

    // 创建选择器
    create(containerElement) {
        this.container = containerElement;
        this.container.innerHTML = this.getPickerHTML();
        // 使用requestAnimationFrame确保DOM完全渲染后再执行后续操作
        requestAnimationFrame(() => {
            this.refresh();
        });
    }

    // 刷新分类列表
    refresh() {
        try {
            this.categories = this.categoryManager.getCategories('expense');
            console.log('📋 获取到支出分类:', this.categories.length, '个');

            // 确保在下一帧执行,避免与DOM渲染冲突
            requestAnimationFrame(() => {
                this.bindEvents();
                this.updateDisplay();
            });
        } catch (error) {
            console.error('❌ 刷新分类列表失败:', error);
        }
    }

    // 获取选择器HTML
    getPickerHTML() {
        return `
            <div class="swipe-category-picker">
                <div class="swipe-container">
                    <div class="category-cards"></div>
                </div>
            </div>
        `;
    }

    // 绑定事件
    bindEvents() {
        const cards = this.container.querySelector('.category-cards');
        if (cards) {
            // 直接绑定点击事件到卡片容器
            cards.addEventListener('click', this.handleClick.bind(this));
        }
    }

    // 处理点击
    handleClick(e) {
        const categoryElement = e.target.closest('.category-card');
        if (categoryElement) {
            const index = parseInt(categoryElement.dataset.index);
            this.selectCategory(index);
        }
    }

    // 选择分类
    selectCategory(index) {
        const category = this.categories[index];
        if (category && this.onSelect) {
            // 保存当前选中的分类索引
            this.selectedIndex = index;

            // 添加视觉反馈
            const cards = this.container.querySelectorAll('.category-card');
            cards.forEach(card => card.classList.remove('active'));
            const selectedCard = this.container.querySelector(`.category-card[data-index="${index}"]`);
            if (selectedCard) {
                selectedCard.classList.add('active');

                // 添加触觉反馈（如果支持）
                if (navigator.vibrate) {
                    navigator.vibrate(10); // 短暂震动10ms
                }
            }

            // 立即执行选择操作，不延迟
            this.onSelect(category.name);
        }
    }

    // 更新显示
    updateDisplay() {
        const cards = this.container.querySelector('.category-cards');
        if (!cards) {
            console.error('❌ category-cards容器未找到，无法更新显示');
            return;
        }

        // 更新卡片为网格布局，收藏的分类排在前面
        const sortedCategories = [...this.categories].sort((a, b) => {
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return 0;
        });

        try {
            cards.innerHTML = sortedCategories.map((category, displayIndex) => {
                // 找到原始索引
                const originalIndex = this.categories.findIndex(cat => cat.id === category.id);
                // 获取分类名称长度
                const nameLength = category.name.length;
                return `
                    <div class="category-card ${category.favorite ? 'is-favorite' : ''}" data-index="${originalIndex}">
                        <div class="category-card__content">
                            <div class="category-icon">
                                <i class="fas ${category.icon}"></i>
                            </div>
                            <div class="category-name" data-length="${nameLength}">${category.name}</div>
                        </div>
                        ${category.favorite ? '<div class="favorite-badge"><i class="fas fa-star"></i></div>' : ''}
                    </div>
                `;
            }).join('');
            console.log('✅ 分类卡片已更新，共', sortedCategories.length, '个分类');
        } catch (error) {
            console.error('❌ 更新分类卡片显示失败:', error);
        }
    }
}
