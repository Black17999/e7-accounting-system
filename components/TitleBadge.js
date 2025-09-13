const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Renders a TitleBadge component.
 * @param {object} props - The component props.
 * @param {'income' | 'expense'} props.type - The type of the record.
 * @param {number} [props.index] - The index of the record (for income).
 * @param {string} [props.category] - The category of the record (for expense).
 * @param {'zh' | 'en'} [props.locale='zh'] - The locale.
 * @returns {HTMLElement} The TitleBadge element.
 */
export function createTitleBadge({ type, index, category, locale = 'zh' }) {
    const isIn = type === 'income';
    
    const prefix = isIn ? 'IN' : 'OUT';
    const text = isIn 
        ? `· ${pad2(index ?? 1)}` 
        : (category ?? '支出');

    const badge = document.createElement('span');
    badge.className = `title-badge ${isIn ? 'in' : 'out'}`;
    badge.setAttribute('data-prefix', prefix);
    
    const mainText = document.createElement('span');
    mainText.className = 'title-badge-text';
    mainText.textContent = text;
    
    badge.appendChild(mainText);

    // For locale specific adjustments if needed in the future
    if (locale === 'zh' && isIn) {
        // Example: badge.setAttribute('data-prefix', '入');
    }

    return badge;
}