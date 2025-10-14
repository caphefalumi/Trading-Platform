// proxy-server.js
const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file (for COINMARKETCAP_API_KEY)
dotenv.config();

const app = express();
const PORT = 3000;
const API_KEY = process.env.COINMARKETCAP_API_KEY;
const CMC_BASE_URL = process.env.CMC_BASE_URL || "https://pro-api.coinmarketcap.com";

// --- SECURITY CHECK ---
if (!API_KEY) {
    console.error("FATAL ERROR: COINMARKETCAP_API_KEY not found in .env file.");
    process.exit(1);
}

// 1. SERVE STATIC FRONTEND FILES
// The server will look for your HTML, CSS, and JS files in the 'Js' directory 
// and serve them at the root (e.g., http://localhost:3000/index.html).
// We assume your 'index.html' is in a folder named 'Html' which is one level up from this file's intended location.
// Since the command is run from 'Trade' folder, and index.html is in 'Html' folder (based on your structure):

// NOTE: Based on your index.html path reference, we assume:
// index.html location: 'Html/index.html'
// proxy-server.js location: 'Trade/proxy-server.js' (root)
// The HTML file is loading script.js from '../Js/script.js'

// We will serve the whole 'Trade' folder content, which includes all sub-folders (Asset, Css, Html, Js)
// Express will serve static files from the root of the project.
app.use(express.static(path.join(__dirname, ''))); 
// We will also add a specific route to redirect to the correct HTML path on the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Html', 'index.html'));
});


// 2. PROXY API ENDPOINT
app.get('/api/latest-quotes', async (req, res) => {
    // Extract the symbols from the request (e.g., BTC,ETH)
    const symbols = req.query.symbols;
    
    if (!symbols) {
        return res.status(400).json({ error: 'Missing required symbols query parameter.' });
    }

    // Build the CoinMarketCap API URL
    const url = `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest?symbol=${symbols}`;

    // Configuration for the fetch request
    const config = {
        method: 'GET',
        headers: {
            'X-CMC_PRO_API_KEY': API_KEY, // Use the secret key from the .env file
            'Accept': 'application/json'
        },
    };

    try {
        const response = await fetch(url, config);
        
        // If the CMC API request fails (e.g., invalid key, rate limit)
        if (!response.ok) {
            // Read the error message from CMC and forward it
            const errorText = await response.text();
            console.error(`CMC API Error: ${response.status} - ${errorText}`);
            return res.status(response.status).json({ 
                error: 'Failed to fetch data from CoinMarketCap',
                details: errorText
            });
        }

        const data = await response.json();
        
        // Success: Send the data back to the frontend
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