// 虚拟滚动组件 - 优化大列表渲染性能
// 适用于超过100条记录的列表
export class VirtualList {
    constructor(container, options = {}) {
        this.container = container;
        this.items = [];
        this.itemHeight = options.itemHeight || 70; // 每项高度
        this.buffer = options.buffer || 5; // 额外渲染的项数（上下各5项）
        this.renderItem = options.renderItem || ((item) => `<div>${JSON.stringify(item)}</div>`);
        this.onItemClick = options.onItemClick || (() => {});

        // 计算可见区域可以显示的项数
        this.visibleCount = Math.ceil(window.innerHeight / this.itemHeight) + this.buffer * 2;
        this.startIndex = 0;
        this.endIndex = this.visibleCount;

        this.init();
    }

    init() {
        // 设置容器样式
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        this.container.style.WebkitOverflowScrolling = 'touch'; // iOS 平滑滚动

        // 创建占位容器（用于撑开滚动条）
        this.phantom = document.createElement('div');
        this.phantom.style.position = 'absolute';
        this.phantom.style.left = '0';
        this.phantom.style.top = '0';
        this.phantom.style.right = '0';
        this.phantom.style.zIndex = '-1';
        this.container.appendChild(this.phantom);

        // 创建内容容器
        this.content = document.createElement('div');
        this.content.style.position = 'absolute';
        this.content.style.left = '0';
        this.content.style.right = '0';
        this.content.style.top = '0';
        this.container.appendChild(this.content);

        // 监听滚动事件
        this.scrollHandler = this.onScroll.bind(this);
        this.container.addEventListener('scroll', this.scrollHandler);

        // 监听窗口大小变化
        this.resizeHandler = this.updateVisibleCount.bind(this);
        window.addEventListener('resize', this.resizeHandler);
    }

    // 设置数据
    setItems(items) {
        this.items = items;

        // 更新占位容器高度
        this.phantom.style.height = `${this.items.length * this.itemHeight}px`;

        // 重新渲染
        this.render();
    }

    // 更新单个项
    updateItem(index, newItem) {
        if (index >= 0 && index < this.items.length) {
            this.items[index] = newItem;

            // 如果该项在可见范围内，重新渲染
            if (index >= this.startIndex && index < this.endIndex) {
                this.render();
            }
        }
    }

    // 滚动事件处理
    onScroll() {
        // 使用 requestAnimationFrame 优化滚动性能
        if (this.scrollRAF) {
            return;
        }

        this.scrollRAF = requestAnimationFrame(() => {
            const scrollTop = this.container.scrollTop;
            const newStartIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);

            // 只有当起始索引变化时才重新渲染
            if (newStartIndex !== this.startIndex) {
                this.startIndex = newStartIndex;
                this.endIndex = Math.min(this.items.length, this.startIndex + this.visibleCount);
                this.render();
            }

            this.scrollRAF = null;
        });
    }

    // 渲染可见项
    render() {
        if (this.items.length === 0) {
            this.content.innerHTML = '<div class="empty-message">暂无数据</div>';
            return;
        }

        // 获取可见区域的数据
        const visibleItems = this.items.slice(this.startIndex, this.endIndex);

        // 清空内容
        this.content.innerHTML = '';

        // 设置内容容器的偏移
        this.content.style.transform = `translateY(${this.startIndex * this.itemHeight}px)`;

        // 创建文档片段（性能优化）
        const fragment = document.createDocumentFragment();

        // 渲染每一项
        visibleItems.forEach((item, index) => {
            const realIndex = this.startIndex + index;
            const itemEl = document.createElement('div');
            itemEl.className = 'virtual-list-item';
            itemEl.style.height = `${this.itemHeight}px`;
            itemEl.dataset.index = realIndex;

            // 使用渲染函数生成内容
            const content = this.renderItem(item, realIndex);
            if (typeof content === 'string') {
                itemEl.innerHTML = content;
            } else {
                itemEl.appendChild(content);
            }

            // 添加点击事件
            itemEl.addEventListener('click', (e) => {
                this.onItemClick(item, realIndex, e);
            });

            fragment.appendChild(itemEl);
        });

        this.content.appendChild(fragment);
    }

    // 更新可见数量（响应窗口大小变化）
    updateVisibleCount() {
        const containerHeight = this.container.clientHeight || window.innerHeight;
        this.visibleCount = Math.ceil(containerHeight / this.itemHeight) + this.buffer * 2;
        this.endIndex = Math.min(this.items.length, this.startIndex + this.visibleCount);
        this.render();
    }

    // 滚动到指定索引
    scrollToIndex(index) {
        if (index < 0 || index >= this.items.length) return;

        const scrollTop = index * this.itemHeight;
        this.container.scrollTop = scrollTop;
    }

    // 销毁虚拟列表
    destroy() {
        this.container.removeEventListener('scroll', this.scrollHandler);
        window.removeEventListener('resize', this.resizeHandler);

        if (this.scrollRAF) {
            cancelAnimationFrame(this.scrollRAF);
        }

        this.container.innerHTML = '';
    }

    // 获取当前可见的项
    getVisibleItems() {
        return this.items.slice(this.startIndex, this.endIndex);
    }

    // 获取列表长度
    getLength() {
        return this.items.length;
    }
}

// 工具函数：根据数据量决定是否使用虚拟滚动
export function createSmartList(container, items, options = {}) {
    const threshold = options.threshold || 100; // 默认超过100条才启用虚拟滚动

    if (items.length > threshold) {
        console.log(`✅ 数据量 ${items.length} 条，启用虚拟滚动`);
        const virtualList = new VirtualList(container, options);
        virtualList.setItems(items);
        return virtualList;
    } else {
        console.log(`📝 数据量 ${items.length} 条，使用普通渲染`);
        return null; // 返回 null 表示不使用虚拟滚动
    }
}
