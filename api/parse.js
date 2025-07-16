const { createHttpLink } = require('apollo-link-http');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

module.exports = async (req, res) => {
    const { url } = req.query;

    try {
        if (!url || !url.startsWith('https://ofd.soliq.uz/check')) {
            throw new Error('Неверный URL чека');
        }

        // Загружаем HTML страницу чека
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const html = await response.text();
        const products = parseProductsFromHTML(html);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(products);
    } catch (error) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

function parseProductsFromHTML(html) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const products = [];
    
    const rows = doc.querySelectorAll('tr');
    const productPatterns = [
        { pattern: /\d+\s+[А-Яа-яЁё]+\s+[А-Яа-яЁё]+/u },
        { pattern: /[А-Яа-яЁё]+\s+\d+[МмЛлГг]/u },
        { pattern: /[А-Яа-яЁё]+\s+[0-9,]+%/u },
        { pattern: /[А-Яа-яЁё]+\s+[А-Яа-яЁё]+\s*№?\d+/u }
    ];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const name = cells[0].textContent.trim();
            const price = cells[1].textContent.trim();
            
            const isProduct = productPatterns.some(p => p.pattern.test(name)) && 
                             price && 
                             price !== '0' && 
                             !isServiceRow(name);
            
            if (isProduct) {
                products.push({
                    name: name,
                    price: formatPrice(price)
                });
            }
        }
    });
    
    return products;
}

function formatPrice(price) {
    return price.replace(/\s+/g, '');
}

function isServiceRow(text) {
    const serviceKeywords = [
        'Savdo cheki', 'Chek raqami', 'Onlayn NKM nomi', 
        'SN', 'QQS', 'Chegirma', 'Shtrix', 'MXIK', 
        'O\'lchov', 'Markirovka', 'Komitent', 
        'Naqd pul', 'Bank kartalari', 'Jami to\'lov'
    ];
    
    return serviceKeywords.some(keyword => text.includes(keyword));
}