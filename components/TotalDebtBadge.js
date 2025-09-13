/**
 * 格式化金额为中文货币格式（千分位，保留0小数，末尾拼接“元”）。
 * @param {number | null | undefined} amount - 金额数值。
 * @returns {string} 格式化后的字符串，或“—”表示未知/无效值。
 */
function formatCNY(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '—';
    }

    // 处理大数，例如亿
    if (Math.abs(amount) >= 100000000) {
        const billion = amount / 100000000;
        // 保留两位小数，如果小数部分为0则不显示
        const formattedBillion = billion.toLocaleString('zh-CN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        return `${formattedBillion}亿+`;
    }

    // 使用 Intl.NumberFormat 进行千分位格式化
    // minimumFractionDigits: 0 确保整数不显示小数位
    // maximumFractionDigits: 2 确保最多显示两位小数
    const formatter = new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    // 如果是整数，直接格式化
    if (Number.isInteger(amount)) {
        return `${formatter.format(amount)}元`;
    }

    // 如果是小数，先格式化，再拼接“元”
    return `${formatter.format(amount)}元`;
}

/**
 * 创建 TotalDebtBadge 组件。
 * @param {object} props - 组件属性。
 * @param {number | null | undefined} props.amount - 总欠款金额。
 * @param {() => void} [props.onPress] - 点击事件回调。
 * @returns {HTMLElement} TotalDebtBadge 元素。
 */
export function createTotalDebtBadge({ amount, onPress }) {
    const badge = document.createElement('button');
    badge.className = 'total-debt-badge';
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-live', 'polite');
    badge.setAttribute('aria-label', '总欠款');

    if (onPress) {
        badge.classList.add('clickable');
        badge.setAttribute('role', 'button');
        badge.setAttribute('tabindex', '0');
        badge.addEventListener('click', onPress);
        badge.addEventListener('touchstart', (e) => {
            badge.classList.add('active');
        }, { passive: true });
        badge.addEventListener('touchend', () => {
            badge.classList.remove('active');
        });
        badge.addEventListener('touchcancel', () => {
            badge.classList.remove('active');
        });
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'tdb-label';
    labelSpan.textContent = amount === 0 ? '已结清' : '总欠款';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'tdb-value';
    valueSpan.textContent = formatCNY(amount).replace('元', ''); // 移除“元”以便单独处理单位

    const unitSpan = document.createElement('span');
    unitSpan.className = 'tdb-unit';
    unitSpan.textContent = '元';

    // 风险提示颜色
    if (amount !== null && amount !== undefined && amount >= 100000) {
        valueSpan.classList.add('tdb-risk-amount');
    }

    // 零欠款时的描边和标签强调降低
    if (amount === 0) {
        badge.classList.add('tdb-zero-debt');
    }

    badge.appendChild(labelSpan);
    badge.appendChild(valueSpan);
    badge.appendChild(unitSpan);

    return badge;
}