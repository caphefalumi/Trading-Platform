// proxy-server.js
const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file (for COINMARKETCAP_API_KEY)
dotenv.config();

const app = express();
// 🎯 FIX 1: Corrected PORT to 3001
const PORT = 3001; 
const API_KEY = process.env.COINMARKETCAP_API_KEY;
const CMC_BASE_URL = process.env.CMC_BASE_URL || "https://pro-api.coinmarketcap.com";

// --- SECURITY CHECK ---
if (!API_KEY) {
    console.error("FATAL ERROR: COINMARKETCAP_API_KEY not found in .env file.");
    process.exit(1);
}

// 🎯 FIX 2: ADD CORS MIDDLEWARE (Critical for local testing)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


// 1. SERVE STATIC FRONTEND FILES
app.use(express.static(path.join(__dirname, ''))); 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Html', 'index.html'));
});


// 2. PROXY API ENDPOINT
app.get('/api/latest-quotes', async (req, res) => {
    const symbols = req.query.symbols;
    
    if (!symbols) {
        return res.status(400).json({ error: 'Missing required symbols query parameter.' });
    }

    const url = `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest?symbol=${symbols}`;

    const config = {
        method: 'GET',
        headers: {
            'X-CMC_PRO_API_KEY': API_KEY, 
            'Accept': 'application/json'
        },
    };

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`CMC API Error: ${response.status} - ${errorText}`);
            return res.status(response.status).json({ 
                error: 'Failed to fetch data from CoinMarketCap',
                details: errorText
            });
        }

        const data = await response.json();
        
        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy Server Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// 3. START THE SERVER
app.listen(PORT, () => {
    console.log(`✅ CoinMarketCap Proxy running on http://localhost:${PORT}`);
    console.log(`   Access your dashboard at: http://localhost:${PORT}`);
});