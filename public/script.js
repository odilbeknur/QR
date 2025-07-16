document.getElementById('parseBtn').addEventListener('click', async () => {
    const receiptUrl = 'https://ofd.soliq.uz/check?t=NA000000046459&r=172885&c=20250704183411&s=575341453395';
    const resultDiv = document.getElementById('result');
    
    try {
        resultDiv.innerHTML = '<div class="loading">Загрузка данных чека...</div>';
        
        const response = await fetch(`/proxy?url=${encodeURIComponent(receiptUrl)}`);
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        
        const html = await response.text();
        const receiptData = parseReceiptHTML(html);
        
        displayReceipt(receiptData);
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`;
        console.error('Ошибка:', error);
    }
});

function parseReceiptHTML(html) {
    // Создаем временный DOM-элемент
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Улучшенный парсинг для структуры Soliq.uz
    const receipt = {
        store: extractText(doc, '.receipt-header, .header-company') || 'Неизвестный магазин',
        date: extractText(doc, '.receipt-date, .date') || '',
        items: [],
        total: '0'
    };

    // Парсим товары - ищем таблицу или список товаров
    const itemRows = doc.querySelectorAll('.receipt-item, .item-row, table tr');
    itemRows.forEach(row => {
        const name = extractText(row, '.item-name, .product-name, td:nth-child(1)');
        const price = extractText(row, '.item-price, .product-price, td:nth-child(3)');
        
        if (name && name.trim() && !name.includes('QQS') && !name.includes('Jami')) {
            receipt.items.push({
                name: name.trim(),
                price: price?.trim() || '0'
            });
        }
    });

    // Парсим общую сумму
    receipt.total = extractText(doc, '.receipt-total, .total-amount, .sum') || '0';

    // Улучшаем распознавание магазина
    if (receipt.store === 'Неизвестный магазин') {
        const possibleStore = html.match(/Savdo cheki\/Sotuv\s*\n([^\n]+)/);
        if (possibleStore) receipt.store = possibleStore[1].trim();
    }

    return receipt;
}

function extractText(element, selector) {
    const el = element.querySelector(selector);
    return el?.textContent?.trim();
}

function displayReceipt(data) {
    let html = `
        <div class="receipt">
            <div class="receipt-header">
                <h2>${data.store}</h2>
                ${data.date ? `<p>Дата: ${data.date}</p>` : ''}
            </div>
            <div class="receipt-items">
                <h3>Товары:</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Цена</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    data.items.forEach(item => {
        html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.price}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
            <div class="receipt-total">
                <strong>Итого: ${data.total}</strong>
            </div>
        </div>
    `;

    document.getElementById('result').innerHTML = html;
}