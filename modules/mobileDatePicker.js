/**
 * 移动端滚轮式日期选择器组件
 * 功能特性:
 * - 年/月/日三级联动滚轮选择
 * - 惯性滚动与缓动动画
 * - 双主题模式支持(亮色/深色)
 * - 触觉反馈
 * - 虚拟渲染优化性能
 * - WCAG无障碍支持
 * - 响应式设计
 */

export class MobileDatePicker {
    constructor(options = {}) {
        this.options = {
            initialDate: options.initialDate || new Date(),
            minDate: options.minDate || new Date(1900, 0, 1),
            maxDate: options.maxDate || new Date(2100, 11, 31),
            onConfirm: options.onConfirm || (() => {}),
            onCancel: options.onCancel || (() => {}),
            locale: options.locale || 'zh-CN',
            hapticFeedback: options.hapticFeedback !== false, // 默认开启触觉反馈
        };

        // 当前选中的日期
        this.selectedDate = new Date(this.options.initialDate);

        // 滚轮配置
        this.wheels = {
            year: { element: null, currentIndex: 0, items: [], offset: 0, velocity: 0, touching: false },
            month: { element: null, currentIndex: 0, items: [], offset: 0, velocity: 0, touching: false },
            day: { element: null, currentIndex: 0, items: [], offset: 0, velocity: 0, touching: false },
        };

        // 物理常量(用于惯性滚动)
        this.physics = {
            friction: 0.95,        // 摩擦系数(越小停止越快)
            minVelocity: 0.1,      // 最小速度阈值(低于此值停止)
            snapThreshold: 0.3,    // 吸附阈值
            itemHeight: 44,        // 每个选项的高度(px)
            visibleItems: 5,       // 可见项数量(推荐奇数以中间高亮)
        };

        // 触摸状态
        this.touchState = {
            startY: 0,
            startTime: 0,
            lastY: 0,
            lastTime: 0,
            currentWheel: null,
        };

        // 动画帧ID
        this.animationFrame = null;

        // 容器元素
        this.container = null;
        this.overlay = null;

        // 初始化数据
        this.initData();
    }

    /**
     * 初始化年月日数据
     */
    initData() {
        // 生成年份列表
        const minYear = this.options.minDate.getFullYear();
        const maxYear = this.options.maxDate.getFullYear();
        this.wheels.year.items = Array.from(
            { length: maxYear - minYear + 1 },
            (_, i) => ({ value: minYear + i, label: `${minYear + i}年` })
        );

        // 生成月份列表(1-12月)
        this.wheels.month.items = Array.from(
            { length: 12 },
            (_, i) => ({ value: i + 1, label: `${i + 1}月` })
        );

        // 初始化日期列表(根据当前年月)
        this.updateDayItems();

        // 设置初始选中索引
        this.wheels.year.currentIndex = this.wheels.year.items.findIndex(
            item => item.value === this.selectedDate.getFullYear()
        );
        this.wheels.month.currentIndex = this.selectedDate.getMonth();
        this.wheels.day.currentIndex = this.selectedDate.getDate() - 1;
    }

    /**
     * 更新日期列表(根据当前年月计算天数)
     */
    updateDayItems() {
        const year = this.wheels.year.items[this.wheels.year.currentIndex]?.value ||
                     this.selectedDate.getFullYear();
        const month = this.wheels.month.items[this.wheels.month.currentIndex]?.value ||
                      this.selectedDate.getMonth() + 1;

        // 计算该月的天数
        const daysInMonth = new Date(year, month, 0).getDate();

        this.wheels.day.items = Array.from(
            { length: daysInMonth },
            (_, i) => ({ value: i + 1, label: `${i + 1}日` })
        );

        // 如果当前选中的日期超出范围,调整到最后一天
        if (this.wheels.day.currentIndex >= daysInMonth) {
            this.wheels.day.currentIndex = daysInMonth - 1;
        }
    }

    /**
     * 创建选择器DOM结构
     */
    createDOM() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'mobile-date-picker-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.setAttribute('aria-label', '日期选择器');

        // 创建容器
        this.container = document.createElement('div');
        this.container.className = 'mobile-date-picker';

        // 创建头部
        const header = document.createElement('div');
        header.className = 'picker-header';
        header.innerHTML = `
            <button class="picker-btn picker-cancel" type="button" aria-label="取消">取消</button>
            <div class="picker-title">选择日期</div>
            <button class="picker-btn picker-confirm" type="button" aria-label="确认">确定</button>
        `;

        // 创建滚轮容器
        const wheelsContainer = document.createElement('div');
        wheelsContainer.className = 'picker-wheels';
        wheelsContainer.setAttribute('role', 'group');
        wheelsContainer.setAttribute('aria-label', '日期滚轮选择');

        // 创建三个滚轮(年、月、日)
        ['year', 'month', 'day'].forEach(type => {
            const wheelWrapper = document.createElement('div');
            wheelWrapper.className = 'picker-wheel-wrapper';

            const wheel = document.createElement('div');
            wheel.className = 'picker-wheel';
            wheel.dataset.type = type;
            wheel.setAttribute('role', 'listbox');
            wheel.setAttribute('aria-label', `${type === 'year' ? '年' : type === 'month' ? '月' : '日'}选择器`);

            const items = document.createElement('div');
            items.className = 'picker-wheel-items';

            wheel.appendChild(items);
            wheelWrapper.appendChild(wheel);
            wheelsContainer.appendChild(wheelWrapper);

            this.wheels[type].element = wheel;
        });

        // 创建高亮指示器
        const indicator = document.createElement('div');
        indicator.className = 'picker-indicator';
        indicator.setAttribute('aria-hidden', 'true');

        // 将指示器添加到滚轮容器中，而不是主容器
        wheelsContainer.appendChild(indicator);

        this.container.appendChild(header);
        this.container.appendChild(wheelsContainer);
        this.overlay.appendChild(this.container);

        // 绑定事件
        this.bindEvents();

        return this.overlay;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 取消按钮
        const cancelBtn = this.container.querySelector('.picker-cancel');
        cancelBtn.addEventListener('click', () => this.hide());

        // 确认按钮
        const confirmBtn = this.container.querySelector('.picker-confirm');
        confirmBtn.addEventListener('click', () => this.confirm());

        // 点击遮罩层关闭
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // 为每个滚轮绑定触摸事件
        Object.entries(this.wheels).forEach(([type, wheel]) => {
            const element = wheel.element;

            // 触摸开始
            element.addEventListener('touchstart', (e) => this.handleTouchStart(e, type), { passive: false });

            // 触摸移动
            element.addEventListener('touchmove', (e) => this.handleTouchMove(e, type), { passive: false });

            // 触摸结束
            element.addEventListener('touchend', (e) => this.handleTouchEnd(e, type), { passive: false });

            // 触摸取消
            element.addEventListener('touchcancel', (e) => this.handleTouchEnd(e, type), { passive: false });
        });

        // 键盘支持
        this.container.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    /**
     * 触摸开始处理
     */
    handleTouchStart(e, wheelType) {
        e.preventDefault();

        const wheel = this.wheels[wheelType];
        wheel.touching = true;
        wheel.velocity = 0;

        // 停止当前动画
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        const touch = e.touches[0];
        this.touchState.startY = touch.clientY;
        this.touchState.lastY = touch.clientY;
        this.touchState.startTime = Date.now();
        this.touchState.lastTime = Date.now();
        this.touchState.currentWheel = wheelType;

        // 触觉反馈
        this.triggerHapticFeedback('light');
    }

    /**
     * 触摸移动处理
     */
    handleTouchMove(e, wheelType) {
        e.preventDefault();

        if (this.touchState.currentWheel !== wheelType) return;

        const wheel = this.wheels[wheelType];
        const touch = e.touches[0];
        const deltaY = touch.clientY - this.touchState.lastY;
        const now = Date.now();
        const deltaTime = now - this.touchState.lastTime;

        // 计算新的偏移量
        let newOffset = wheel.offset + deltaY;

        // 边界限制：禁止越界滚动
        const itemHeight = this.physics.itemHeight;
        const minOffset = -(wheel.items.length - 1) * itemHeight; // 最后一项的偏移量
        const maxOffset = 0; // 第一项的偏移量

        // 限制偏移量在有效范围内
        newOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));

        // 更新偏移量
        wheel.offset = newOffset;

        // 计算速度(用于惯性滚动)
        if (deltaTime > 0) {
            wheel.velocity = deltaY / deltaTime;
        }

        this.touchState.lastY = touch.clientY;
        this.touchState.lastTime = now;

        // 渲染滚轮
        this.renderWheel(wheelType);

        // 检查是否需要触觉反馈(每跨越一个项时触发)
        const currentItemIndex = Math.round(-wheel.offset / itemHeight);
        const previousItemIndex = Math.round(-(wheel.offset - deltaY) / itemHeight);
        if (currentItemIndex !== previousItemIndex) {
            this.triggerHapticFeedback('light');
        }
    }

    /**
     * 触摸结束处理
     */
    handleTouchEnd(e, wheelType) {
        e.preventDefault();

        if (this.touchState.currentWheel !== wheelType) return;

        const wheel = this.wheels[wheelType];
        wheel.touching = false;
        this.touchState.currentWheel = null;

        // 启动惯性滚动动画
        this.startInertiaAnimation(wheelType);
    }

    /**
     * 启动惯性滚动动画
     */
    startInertiaAnimation(wheelType) {
        const wheel = this.wheels[wheelType];
        const itemHeight = this.physics.itemHeight;
        const minOffset = -(wheel.items.length - 1) * itemHeight;
        const maxOffset = 0;

        const animate = () => {
            // 应用摩擦力
            wheel.velocity *= this.physics.friction;

            // 如果速度过低,停止动画并吸附到最近的项
            if (Math.abs(wheel.velocity) < this.physics.minVelocity) {
                this.snapToNearestItem(wheelType);
                return;
            }

            // 计算新的偏移量
            let newOffset = wheel.offset + wheel.velocity * 16; // 假设60fps, 16ms/frame

            // 边界检查：如果到达边界，停止惯性滚动
            if (newOffset > maxOffset || newOffset < minOffset) {
                // 限制在边界内
                wheel.offset = Math.max(minOffset, Math.min(maxOffset, newOffset));
                // 停止动画并吸附
                this.snapToNearestItem(wheelType);
                return;
            }

            // 更新偏移量
            wheel.offset = newOffset;

            // 渲染滚轮
            this.renderWheel(wheelType);

            // 继续动画
            this.animationFrame = requestAnimationFrame(animate);
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    /**
     * 吸附到最近的项
     */
    snapToNearestItem(wheelType) {
        const wheel = this.wheels[wheelType];
        const itemHeight = this.physics.itemHeight;

        // 计算最近的索引
        const targetIndex = Math.round(-wheel.offset / itemHeight);
        const clampedIndex = Math.max(0, Math.min(wheel.items.length - 1, targetIndex));

        // 更新当前索引
        wheel.currentIndex = clampedIndex;

        // 计算目标偏移量
        const targetOffset = -clampedIndex * itemHeight;

        // 缓动动画吸附
        this.animateSnap(wheelType, wheel.offset, targetOffset);
    }

    /**
     * 缓动动画(吸附到目标位置)
     */
    animateSnap(wheelType, fromOffset, toOffset) {
        const wheel = this.wheels[wheelType];
        const duration = 300; // 动画时长(ms)
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 使用缓动函数(easeOutCubic)
            const easing = 1 - Math.pow(1 - progress, 3);

            // 计算当前偏移量
            wheel.offset = fromOffset + (toOffset - fromOffset) * easing;

            // 渲染滚轮
            this.renderWheel(wheelType);

            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                // 动画结束,触发选中回调
                this.onWheelChange(wheelType);
                this.triggerHapticFeedback('medium');
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    /**
     * 渲染滚轮(使用虚拟渲染优化)
     */
    renderWheel(wheelType) {
        const wheel = this.wheels[wheelType];
        const itemsContainer = wheel.element.querySelector('.picker-wheel-items');
        const itemHeight = this.physics.itemHeight;
        const visibleRange = Math.ceil(this.physics.visibleItems / 2) + 2; // 上下各多渲染2个

        // 计算当前中心索引
        const centerIndex = Math.round(-wheel.offset / itemHeight);
        const startIndex = Math.max(0, centerIndex - visibleRange);
        const endIndex = Math.min(wheel.items.length - 1, centerIndex + visibleRange);

        // 清空并重新渲染可见项
        itemsContainer.innerHTML = '';

        // 获取滚轮容器的中心位置
        const wheelCenterY = wheel.element.offsetHeight / 2;

        for (let i = startIndex; i <= endIndex; i++) {
            const item = wheel.items[i];
            const itemElement = document.createElement('div');
            itemElement.className = 'picker-wheel-item';
            itemElement.textContent = item.label;
            itemElement.setAttribute('role', 'option');
            itemElement.setAttribute('aria-selected', i === wheel.currentIndex ? 'true' : 'false');

            // 计算项的位置
            // itemOffset 是该项相对于第一项的偏移量
            const itemOffset = i * itemHeight;
            // translateY 是该项相对于容器顶部的偏移量，需要加上中心偏移和滚动偏移
            const translateY = wheelCenterY - itemHeight / 2 + itemOffset + wheel.offset;

            // 计算该项距离中心线的距离
            const distanceFromCenter = Math.abs(translateY - wheelCenterY + itemHeight / 2);
            const maxDistance = itemHeight * 2;
            const scale = Math.max(0.7, 1 - (distanceFromCenter / maxDistance) * 0.3);
            const opacity = Math.max(0.3, 1 - (distanceFromCenter / maxDistance) * 0.7);

            itemElement.style.transform = `translateY(${translateY}px) scale(${scale})`;
            itemElement.style.opacity = opacity;

            // 中心项高亮 - 判断是否在中心位置（±itemHeight/2 范围内）
            if (distanceFromCenter < itemHeight / 2) {
                itemElement.classList.add('active');
            }

            itemsContainer.appendChild(itemElement);
        }
    }

    /**
     * 滚轮值改变回调
     */
    onWheelChange(wheelType) {
        if (wheelType === 'year' || wheelType === 'month') {
            // 年份或月份改变时,需要更新日期列表
            this.updateDayItems();
            this.renderWheel('day');
        }
    }

    /**
     * 触发触觉反馈(如果设备支持)
     */
    triggerHapticFeedback(intensity = 'light') {
        if (!this.options.hapticFeedback) return;

        // 使用 Vibration API
        if ('vibrate' in navigator) {
            const patterns = {
                light: 5,
                medium: 10,
                heavy: 15,
            };
            navigator.vibrate(patterns[intensity] || 5);
        }
    }

    /**
     * 键盘事件处理(无障碍支持)
     */
    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.hide();
        } else if (e.key === 'Enter') {
            this.confirm();
        }
    }

    /**
     * 显示选择器
     */
    show() {
        // 创建DOM并添加到body
        const element = this.createDOM();
        document.body.appendChild(element);

        // 渲染所有滚轮
        Object.keys(this.wheels).forEach(type => {
            const wheel = this.wheels[type];
            wheel.offset = -wheel.currentIndex * this.physics.itemHeight;
            this.renderWheel(type);
        });

        // 显示动画
        requestAnimationFrame(() => {
            this.overlay.classList.add('visible');
        });

        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
    }

    /**
     * 隐藏选择器
     */
    hide() {
        this.overlay.classList.remove('visible');

        // 动画结束后移除DOM
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }

            // 恢复背景滚动
            document.body.style.overflow = '';

            // 调用取消回调
            this.options.onCancel();
        }, 300);

        // 清理动画
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    /**
     * 确认选择
     */
    confirm() {
        // 获取选中的值
        const year = this.wheels.year.items[this.wheels.year.currentIndex].value;
        const month = this.wheels.month.items[this.wheels.month.currentIndex].value;
        const day = this.wheels.day.items[this.wheels.day.currentIndex].value;

        const selectedDate = new Date(year, month - 1, day);

        // 调用确认回调
        this.options.onConfirm(selectedDate);

        // 隐藏选择器
        this.hide();
    }

    /**
     * 销毁选择器
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        document.body.style.overflow = '';
    }
}
