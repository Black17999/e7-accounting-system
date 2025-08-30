// UI管理模块
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
    }

    // 隐藏编辑债务模态框
    hideEditDebtModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editDebt = { index: -1, name: '', expression: '' };
    }

    // 显示编辑烟草记录模态框
    showEditTobaccoModal() {
        document.getElementById('editTobaccoModal').style.display = 'flex';
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

    // 显示编辑债务模态框
    showEditDebtModal(index, debt) {
        this.editDebt = { 
            index: index, 
            name: debt.name, 
            expression: debt.calculation 
        };
        document.getElementById('editModal').style.display = 'flex';
    }

    // 隐藏编辑债务模态框
    hideEditDebtModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editDebt = { index: -1, name: '', expression: '' };
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
    showRestoreMenu() {
        // 检查是否已存在菜单，防止重复创建
        if (document.getElementById('restore-menu-modal')) {
            return;
        }

        // 创建模态框背景
        const modal = document.createElement('div');
        modal.id = 'restore-menu-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        // 创建菜单内容容器
        const menuContent = document.createElement('div');
        menuContent.style.cssText = `
            background: ${this.isDarkMode ? '#1b263b' : '#ffffff'};
            padding: 20px;
            border-radius: 16px;
            width: 90%;
            max-width: 300px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            border: 1px solid ${this.isDarkMode ? '#ffd700' : '#e0e0e0'};
        `;

        // 创建菜单项
        const options = ['导出数据', '导入数据', '恢复数据', '备份数据'];
        options.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            button.style.cssText = `
                padding: 12px;
                border-radius: 8px;
                border: none;
                font-weight: 600;
                cursor: pointer;
                color: white;
                background: linear-gradient(to right, #3498db, #1abc9c);
            `;
            
            if (optionText === '恢复数据') {
                button.onclick = () => this.promptForRestoreDate();
            } else {
                button.onclick = () => alert(`功能 [${optionText}] 待实现`);
            }
            
            menuContent.appendChild(button);
        });

        modal.appendChild(menuContent);
        document.body.appendChild(modal);

        // 点击背景关闭菜单
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
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
