const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const PORT = 3000;

// Раздаем статические файлы из папки public
app.use(express.static(path.join(__dirname, '../public')));

app.get('/proxy', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: 'URL parameter is required' });

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html'
            },
            timeout: 5000
        });

        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch the URL',
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});