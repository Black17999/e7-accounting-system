// UI管理模块
import { iconPaths } from './icons/icons.js';

export class UIManager {
    constructor() {
        this.isChartModalVisible = false;
        this.isDarkMode = false;
        this.swipeState = {
            startX: 0,
            startY: 0,
            currentX: 0,
            swipingIndex: null,
            swipingType: null,
            directionLock: null,
        };
        this.fabActive = false;
        
        // 初始化模态框相关对象
        this.addModal = { show: false, type: 'income', title: '', amount: '' };
        this.newExpense = { name: '', amount: '' };
        this.editRecord = { show: false, type: null, index: -1, title: '', name: '', amount: '' };
        this.editDebt = { index: -1, name: '', expression: '' };
        this.editTobaccoRecordData = { id: '', date: '', brand: '', quantity: 1, price: 0 };
    }

    // 显示开屏页
    showSplashScreen() {
        const splashScreen = document.getElementById('splash-screen');
        const appContainer = document.getElementById('app');
        
        if (splashScreen && appContainer) {
            // 重置开屏页状态
            splashScreen.style.display = 'flex';
            splashScreen.style.opacity = '1';
            appContainer.style.display = 'none';
        }
    }

    // 隐藏开屏页
    hideSplashScreen() {
        const splashScreen = document.getElementById('splash-screen');
        const appContainer = document.getElementById('app');
        
        if (splashScreen && appContainer) {
            splashScreen.style.opacity = '0';
            splashScreen.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(() => {
                splashScreen.style.display = 'none';
                appContainer.style.display = 'flex';
            }, 300);
        }
    }

    // 切换暗黑模式
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    }

    // 加载暗黑模式设置
    loadDarkMode() {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'true') {
            this.isDarkMode = true;
            document.body.classList.add('dark-mode');
        }
    }

    // 显示日期选择器
    showDatePicker() {
        document.getElementById('datePickerModal').style.display = 'flex';
    }

    // 隐藏日期选择器
    hideDatePicker() {
        document.getElementById('datePickerModal').style.display = 'none';
    }

    // 显示添加记录模态框
    showAddModal(type) {
        this.addModal.type = type;
        this.addModal.amount = '';
        this.newExpense.name = '';
        document.getElementById('addRecordModal').style.display = 'flex';
        this.fabActive = false;

        // 当打开“支出”新增弹窗时，重置分类容器的滚动到顶部
        if (type === 'expense') {
            const tryReset = () => {
                const container = document.getElementById('expenseCategoryPicker');
                const list = container ? container.querySelector('.category-cards') : null;
                if (list) {
                    list.scrollTop = 0;
                } else {
                    // 分类DOM可能尚未挂载，下一帧再尝试
                    if (typeof requestAnimationFrame === 'function') {
                        requestAnimationFrame(tryReset);
                    } else {
                        setTimeout(tryReset, 16);
                    }
                }
            };
            tryReset();
        }
    }

    // 隐藏添加记录模态框
    hideAddModal() {
        document.getElementById('addRecordModal').style.display = 'none';
    }

    // 显示编辑记录模态框
    showEditRecordModal(type, index, title, data) {
        this.editRecord = { 
            show: true, 
            type: type, 
            index: index, 
            title: title,
            name: data.name || '',
            amount: data.amount || ''
        };
        document.getElementById('editRecordModal').style.display = 'flex';
        setTimeout(() => {
            const amountInput = document.getElementById('edit-amount');
            if (amountInput) {
                amountInput.focus();
            }
        }, 100);
    }

    // 隐藏编辑记录模态框
    hideEditRecordModal() {
        document.getElementById('editRecordModal').style.display = 'none';
        this.editRecord = { show: false, type: null, index: -1, title: '', name: '', amount: '' };
    }

    // 显示编辑债务模态框
    showEditDebtModal(index, debt) {
        this.editDebt = { 
            index: index, 
            name: debt.name, 
            expression: debt.calculation 
        };
        document.getElementById('editModal').style.display = 'flex';
        setTimeout(() => {
            const expressionInput = document.getElementById('edit-expression');
            if (expressionInput) {
                expressionInput.focus();
            }
        }, 100);
    }

    // 隐藏编辑债务模态框
    hideEditDebtModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editDebt = { index: -1, name: '', expression: '' };
    }

    // 显示编辑烟草记录模态框
    showEditTobaccoModal() {
        document.getElementById('editTobaccoModal').style.display = 'flex';
        setTimeout(() => {
            const priceInput = document.getElementById('edit-tobacco-price');
            if (priceInput) {
                priceInput.focus();
            }
        }, 100);
    }

    // 隐藏编辑烟草记录模态框
    hideEditTobaccoModal() {
        document.getElementById('editTobaccoModal').style.display = 'none';
    }

    // 切换FAB按钮状态
    toggleFab() {
        this.fabActive = !this.fabActive;
    }

    // 处理全局点击事件
    handleGlobalClick(event) {
        // 如果FAB按钮是激活状态，且点击的不是FAB相关元素，则自动折叠FAB
        if (this.fabActive) {
            const fabContainer = event.target.closest('.fab-in-bar');
            const fabOptions = event.target.closest('.fab-options');
            
            // 如果点击的不是FAB容器内的元素，则折叠FAB
            if (!fabContainer && !fabOptions) {
                this.fabActive = false;
            }
        }
    }

    // 滑动删除相关方法
    onTouchStart(event, index, type) {
        if (this.swipeState.swipingIndex !== null && this.swipeState.swipingIndex !== index) {
            this.resetSwipeState();
        }
        this.swipeState.startX = event.touches[0].clientX;
        this.swipeState.startY = event.touches[0].clientY;
        this.swipeState.currentX = this.swipeState.startX;
        this.swipeState.swipingIndex = index;
        this.swipeState.swipingType = type;
        this.swipeState.directionLock = null;
        document.addEventListener('touchstart', this.handleGlobalTouch, { passive: true });
    }

    onTouchMove(event, index, type) {
        if (this.swipeState.swipingIndex !== index) return;

        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const diffX = currentX - this.swipeState.startX;
        const diffY = currentY - this.swipeState.startY;

        // 只有在方向锁未设置时才进行判断
        if (!this.swipeState.directionLock) {
            // 如果垂直滑动距离大于水平滑动距离，则锁定为垂直滚动
            if (Math.abs(diffY) > Math.abs(diffX) + 3) {
                this.swipeState.directionLock = 'vertical';
            } else {
                this.swipeState.directionLock = 'horizontal';
            }
        }

        // 如果方向锁定为水平，则更新X坐标并阻止页面滚动
        if (this.swipeState.directionLock === 'horizontal') {
            this.swipeState.currentX = currentX;
            // 阻止默认的滚动行为
            event.preventDefault();
        }
    }

    onTouchEnd(event, index, type) {
        if (this.swipeState.swipingIndex !== index || this.swipeState.directionLock !== 'horizontal') {
            // 如果不是当前滑动项，或者方向是垂直，则不执行任何操作
            if (this.swipeState.directionLock === 'vertical') {
                this.resetSwipeState();
            }
            return;
        }

        const diffX = this.swipeState.currentX - this.swipeState.startX;
        const swipeThreshold = -40;
        const itemWrapper = event.target.closest('.record-item-wrapper');

        if (itemWrapper) {
            if (diffX < swipeThreshold) {
                // 完全划开
                itemWrapper.style.transform = 'translateX(-80px)';
            } else {
                // 未达到阈值，弹回
                itemWrapper.style.transform = 'translateX(0)';
            }
            itemWrapper.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';
        }
    }

    getSwipeStyle(index, type) {
        if (this.swipeState.swipingIndex === index && this.swipeState.swipingType === type && this.swipeState.directionLock === 'horizontal') {
            const diffX = this.swipeState.currentX - this.swipeState.startX;
            const translateX = Math.max(-80, Math.min(0, diffX));
            return {
                transform: `translateX(${translateX}px)`,
                transition: 'none'
            };
        }
        return {
            transform: 'translateX(0)',
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)'
        };
    }

    resetSwipeState() {
        // 复位所有滑动项
        const wrappers = document.querySelectorAll('.record-item-wrapper');
        wrappers.forEach(w => {
            w.style.transform = 'translateX(0)';
            w.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';
        });
        this.swipeState.swipingIndex = null;
        this.swipeState.swipingType = null;
        this.swipeState.startX = 0;
        this.swipeState.currentX = 0;
        document.removeEventListener('touchstart', this.handleGlobalTouch, { passive: true });
    }

    handleGlobalTouch(e) {
        // 如果点击的是删除按钮或其父容器（swipe-action-delete），不复位滑动状态
        if (e.target.closest('.swipe-action-delete')) {
            return;
        }
        if (!e.target.closest('.record-item-wrapper')) {
            this.resetSwipeState();
        }
    }

    // 图表模态框相关方法
    openChartModal() {
        this.isChartModalVisible = true;
    }

    closeChartModal() {
        this.isChartModalVisible = false;
    }

    // 生成文字记录图片
    generateTextImage(currentDate, totalIncome, incomes, expenses, debts) {
        // 1. 创建一个临时容器，绝对定位到屏幕外
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-99999px';
        container.style.top = '0';
        container.style.width = '480px';
        container.style.zIndex = '9999';
        container.style.background = 'transparent';
        container.style.opacity = '1';
        container.style.display = 'block';
        container.style.overflow = 'visible';
        document.body.appendChild(container);

        // 2. 克隆内容，正常可见但用户看不到
        const textRecord = document.getElementById('textRecord');
        const clone = textRecord.cloneNode(true);
        clone.style.display = 'block';
        clone.style.position = 'static';
        clone.style.opacity = '1';
        clone.style.visibility = 'visible';
        clone.style.pointerEvents = 'none';
        clone.style.height = 'auto';
        clone.style.maxHeight = 'none';
        clone.style.overflow = 'visible';
        clone.style.width = '480px';
        clone.style.background = '#142133';
        clone.style.boxShadow = '0 0 24px 0 rgba(0,0,0,0.15)';
        clone.classList.add('plain-text-mode');
        clone.style.paddingBottom = '30px';
        container.appendChild(clone);

        // 强制reflow，确保渲染
        void clone.offsetHeight;
        setTimeout(() => {
            const realHeight = clone.scrollHeight + 30;
            html2canvas(clone, {
                scale: 2,
                backgroundColor: '#142133',
                width: 480,
                height: realHeight,
                scrollY: 0,
                useCORS: true,
                logging: false,
                allowTaint: true
            })
                .then(canvas => {
                    const link = document.createElement('a');
                    link.download = `E7棋牌室记账记录_${currentDate.replace(/[年月日\s]/g, '-')}.png`;
                    link.href = canvas.toDataURL('image/png', 1.0);
                    link.click();
                    document.body.removeChild(container);
                }).catch(err => {
                    console.error('截图生成失败', err);
                    alert('截图生成失败');
                    document.body.removeChild(container);
                });
        }, 400);
    }


    // 显示编辑烟草记录模态框
    showEditTobaccoModal() {
        document.getElementById('editTobaccoModal').style.display = 'flex';
    }

    // 隐藏编辑烟草记录模态框
    hideEditTobaccoModal() {
        document.getElementById('editTobaccoModal').style.display = 'none';
    }

    // 打开图表模态框
    openChartModal() {
        this.isChartModalVisible = true;
    }

    // 关闭图表模态框
    closeChartModal() {
        this.isChartModalVisible = false;
    }

    // 清理资源
    destroy() {
        // 清理事件监听器
        document.removeEventListener('click', this.handleGlobalClick);
        document.removeEventListener('touchstart', this.handleGlobalTouch, { passive: true });
    }

    // 显示自定义确认对话框
    showConfirmDialog(message, onConfirm, onCancel) {
        const modal = document.getElementById('confirmDeleteModal');
        const messageElement = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        messageElement.textContent = message;
        modal.style.display = 'flex';

        const confirmHandler = () => {
            onConfirm();
            this.hideConfirmDialog();
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
        };

        const cancelHandler = () => {
            this.hideConfirmDialog();
            if (onCancel) {
                onCancel();
            } else {
                this.resetSwipeState(); // 保持默认行为
            }
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
        };

        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', cancelHandler);
    }

    // 隐藏自定义确认对话框
    hideConfirmDialog() {
        const modal = document.getElementById('confirmDeleteModal');
        modal.style.display = 'none';
    }

    // 显示恢复功能菜单
    showRestoreMenu(dataManager) { // 接收 dataManager 实例
        if (document.getElementById('data-management-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'data-management-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.3); /* 降低背景透明度 */
            backdrop-filter: blur(10px); /* 应用模糊效果 */
            -webkit-backdrop-filter: blur(10px); /* 兼容Safari */
            display: flex; align-items: center;
            justify-content: center; z-index: 2000;
        `;

        const menuContent = document.createElement('div');
        menuContent.style.cssText = `
            background: ${this.isDarkMode ? 'rgba(44, 62, 80, 0.85)' : 'rgba(255, 255, 255, 0.9)'};
            color: ${this.isDarkMode ? '#ecf0f1' : '#2c3e50'};
            padding: 24px; border-radius: 20px; width: 90%; max-width: 340px;
            display: flex; flex-direction: column; gap: 12px;
            border: 1px solid ${this.isDarkMode ? 'rgba(52, 73, 94, 0.8)' : 'rgba(224, 224, 224, 0.5)'};
            box-shadow: 0 15px 35px rgba(0,0,0,0.25);
            transform: scale(0.95) translateY(10px); opacity: 0;
            animation: modal-pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        `;

        const title = document.createElement('h3');
        title.textContent = '数据管理中心';
        title.style.cssText = `
            margin: 0 0 12px 0; text-align: center; font-size: 1.5rem; font-weight: 700;
            color: ${this.isDarkMode ? '#1abc9c' : '#34495e'};
            letter-spacing: 1px;
        `;
        menuContent.appendChild(title);

        const options = [
            { text: '导出数据', desc: '将所有数据备份到本地 JSON 文件', icon: iconPaths['export-data'], action: 'export', color: 'linear-gradient(135deg, #3498db, #2980b9)' },
            { text: '导入数据', desc: '从 JSON 文件恢复数据，会覆盖记录', icon: iconPaths['import-data'], action: 'import', color: 'linear-gradient(135deg, #2ecc71, #27ae60)' },
            { text: '恢复数据', desc: '从指定日期的云备份恢复', icon: iconPaths['restore-data'], action: 'restore', color: 'linear-gradient(135deg, #e74c3c, #c0392b)' }
        ];

        options.forEach(({ text, desc, icon, action, color }) => {
            const button = document.createElement('button');
            button.style.cssText = `
                display: flex; align-items: center; text-align: left;
                padding: 12px 16px; border-radius: 12px; border: none;
                cursor: pointer; color: white; background: ${color};
                transition: all 0.25s ease;
            `;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 16px; flex-shrink: 0;"><path d="${icon}"></path></svg>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 600; font-size: 1rem;">${text}</span>
                    <span style="font-size: 0.75rem; opacity: 0.8;">${desc}</span>
                </div>
            `;
            
            button.onmouseover = () => { button.style.transform = 'translateY(-3px)'; button.style.boxShadow = '0 8px 15px rgba(0,0,0,0.2)'; };
            button.onmouseout = () => { button.style.transform = 'translateY(0)'; button.style.boxShadow = 'none'; };

            switch (action) {
                case 'export':
                    button.onclick = () => dataManager.exportData();
                    break;
                case 'import':
                    button.onclick = () => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = '.json';
                        fileInput.style.display = 'none';
                        fileInput.onchange = (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                dataManager.importData(file).then(() => {
                                    if (document.body.contains(modal)) document.body.removeChild(modal);
                                });
                            }
                        };
                        document.body.appendChild(fileInput);
                        fileInput.click();
                        document.body.removeChild(fileInput);
                    };
                    break;
                case 'restore':
                    button.onclick = () => {
                        if (document.body.contains(modal)) document.body.removeChild(modal);
                        this.showConfirmDialog(
                            '确定要恢复数据吗？此操作将覆盖当前数据且无法撤销。',
                            () => this.promptForRestoreDate()
                        );
                    };
                    break;
            }
            menuContent.appendChild(button);
        });

        modal.appendChild(menuContent);
        document.body.appendChild(modal);

        const keyframes = `
            @keyframes modal-pop-in {
                from { transform: scale(0.95) translateY(10px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = keyframes;
        document.head.appendChild(styleSheet);

        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                document.head.removeChild(styleSheet);
            }
        };
    }

    // 显示用户信息编辑模态框
    showUserProfileModal(currentUser, onSave) {
        if (document.getElementById('user-profile-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'user-profile-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            display: flex; align-items: center;
            justify-content: center; z-index: 2001; /* Higher z-index */
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: ${this.isDarkMode ? 'rgba(44, 62, 80, 0.9)' : 'rgba(255, 255, 255, 0.95)'};
            color: ${this.isDarkMode ? '#ecf0f1' : '#2c3e50'};
            padding: 24px; border-radius: 20px; width: 90%; max-width: 340px;
            display: flex; flex-direction: column; gap: 20px;
            border: 1px solid ${this.isDarkMode ? 'rgba(52, 73, 94, 0.8)' : 'rgba(224, 224, 224, 0.5)'};
            box-shadow: 0 15px 35px rgba(0,0,0,0.25);
            transform: scale(0.95) translateY(10px); opacity: 0;
            animation: modal-pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        `;

        const title = document.createElement('h3');
        title.textContent = '编辑个人信息';
        title.style.cssText = `
            margin: 0; text-align: center; font-size: 1.5rem; font-weight: 700;
            color: ${this.isDarkMode ? '#1abc9c' : '#34495e'};
        `;

        const avatarContainer = document.createElement('div');
        avatarContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer;';
        
        const avatarImg = document.createElement('img');
        avatarImg.src = currentUser.avatar;
        avatarImg.style.cssText = 'width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #1abc9c;';
        
        const avatarInput = document.createElement('input');
        avatarInput.type = 'file';
        avatarInput.accept = 'image/*';
        avatarInput.style.display = 'none';

        const avatarText = document.createElement('span');
        avatarText.textContent = '点击更换头像';
        avatarText.style.color = '#3498db';

        avatarContainer.appendChild(avatarImg);
        avatarContainer.appendChild(avatarText);
        avatarContainer.appendChild(avatarInput);

        avatarContainer.onclick = () => avatarInput.click();

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.value = currentUser.name;
        usernameInput.placeholder = '输入您的昵称';
        usernameInput.style.cssText = `
            padding: 12px; border-radius: 8px; border: 1px solid ${this.isDarkMode ? '#34495e' : '#bdc3c7'};
            background: ${this.isDarkMode ? '#2c3e50' : '#ecf0f1'};
            color: ${this.isDarkMode ? '#ecf0f1' : '#2c3e50'};
            font-size: 1rem; text-align: center;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; justify-content: space-between; gap: 10px; margin-top: 10px;';
        
        const saveButton = document.createElement('button');
        saveButton.textContent = '保存更改';
        saveButton.style.cssText = 'flex: 1; padding: 12px; border: none; border-radius: 8px; background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; cursor: pointer; font-weight: 600;';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.style.cssText = 'flex: 1; padding: 12px; border: none; border-radius: 8px; background: #95a5a6; color: white; cursor: pointer;';
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);

        content.appendChild(title);
        content.appendChild(avatarContainer);
        content.appendChild(usernameInput);
        content.appendChild(buttonContainer);
        modal.appendChild(content);
        document.body.appendChild(modal);

        const keyframes = `
            @keyframes modal-pop-in {
                from { transform: scale(0.95) translateY(10px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = keyframes;
        document.head.appendChild(styleSheet);

        let newAvatarDataUrl = currentUser.avatar;
        avatarInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    newAvatarDataUrl = event.target.result;
                    avatarImg.src = newAvatarDataUrl;
                };
                reader.readAsDataURL(file);
            }
        };

        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
                document.head.removeChild(styleSheet);
            }
        };

        saveButton.onclick = () => {
            const newName = usernameInput.value.trim();
            if (newName) {
                onSave({ name: newName, avatar: newAvatarDataUrl });
                closeModal();
            } else {
                alert('用户名不能为空');
            }
        };

        cancelButton.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
    }

    // 弹出日期选择器以进行恢复
    promptForRestoreDate() {
        // 先关闭主菜单
        const existingMenu = document.getElementById('restore-menu-modal');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }

        // 创建日期选择模态框
        const datePickerModal = document.createElement('div');
        datePickerModal.id = 'restore-date-picker-modal';
        datePickerModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2001;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: ${this.isDarkMode ? '#1b263b' : '#ffffff'};
            padding: 20px;
            border-radius: 16px;
            width: 90%;
            max-width: 300px;
            text-align: center;
            border: 1px solid ${this.isDarkMode ? '#ffd700' : '#e0e0e0'};
        `;

        const title = document.createElement('div');
        title.textContent = '请选择恢复日期';
        title.style.cssText = `
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: ${this.isDarkMode ? '#ffd700' : '#333333'};
        `;

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = new Date().toISOString().slice(0, 10);
        dateInput.style.cssText = `
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #ccc;
            margin-bottom: 20px;
        `;

        const confirmButton = document.createElement('button');
        confirmButton.textContent = '开始恢复';
        confirmButton.style.cssText = `
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            color: white;
            background: linear-gradient(to right, #2ecc71, #27ae60);
        `;

        confirmButton.onclick = () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) {
                alert('请选择一个有效的日期');
                return;
            }
            const fileName = `backup-${selectedDate}.json`;
            const restoreUrl = `https://backup.17999.ggff.net/restore?file=${fileName}`;
            
            window.open(restoreUrl, '_blank');
            alert(`已启动恢复任务，恢复文件: ${fileName}。请在新标签页中确认，然后手动刷新本页面。`);
            document.body.removeChild(datePickerModal);
        };

        content.appendChild(title);
        content.appendChild(dateInput);
        content.appendChild(confirmButton);
        datePickerModal.appendChild(content);
        document.body.appendChild(datePickerModal);

        // 点击背景关闭
        datePickerModal.onclick = (e) => {
            if (e.target === datePickerModal) {
                document.body.removeChild(datePickerModal);
            }
        };
    }
}
