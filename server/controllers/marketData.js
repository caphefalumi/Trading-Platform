// server/controllers/marketData.js
import fetch from 'node-fetch';

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "82cb4252-7d07-41b1-8a3f-ba43a6356691";
const CMC_BASE_URL = process.env.CMC_BASE_URL || "https://pro-api.coinmarketcap.com";

export const getLatestQuotes = async (req, res) => {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : [];
    if (!symbols.length) return res.status(400).json({ error: 'No symbols provided' });

    try {
        const response = await fetch(
            `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest?symbol=${symbols.join(',')}&convert=USD`,
            { headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY, 'Accept': 'application/json' } }
        );

        if (!response.ok) {
            console.error('CMC API Error');
            return res.status(500).json({ error: 'CoinMarketCap API error' });
        }

        const data = await response.json();
        const results = {};

        symbols.forEach(symbol => {
            const cryptoData = data.data[symbol];
            if (cryptoData?.quote?.USD) {
                const usdQuote = cryptoData.quote.USD;
                results[symbol] = {
                    price: usdQuote.price,
                    changePercent: usdQuote.percent_change_24h,
                    volume24h: usdQuote.volume_24h,
                    marketCap: usdQuote.market_cap,
                    high24h: usdQuote.price * 1.02,
                    low24h: usdQuote.price * 0.98,
                    open24h: usdQuote.price * (1 - (usdQuote.percent_change_24h / 100))
                };
            }
        });

        res.json(results);
    } catch (error) {
        console.error('Error in getLatestQuotes:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getCandleData = async (req, res) => {
    const symbol = req.query.symbol;
    const timePeriod = req.query.timePeriod || '1d'; // 1d, 1w, 1m, 1y, all

    if (!symbol) return res.status(400).json({ error: 'No symbol provided' });

    try {
        const response = await fetch(
            `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`,
            { headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY, 'Accept': 'application/json' } }
        );

        if (!response.ok) {
            return res.json([]);
        }

        const data = await response.json();
        const cryptoData = data.data[symbol];

        if (!cryptoData?.quote?.USD) {
            return res.json([]);
        }

        const currentPrice = cryptoData.quote.USD.price;
        const change24h = cryptoData.quote.USD.percent_change_24h;
        const volume24h = cryptoData.quote.USD.volume_24h;

        const candles = generateCandles(symbol, currentPrice, change24h, volume24h, timePeriod);
        res.json(candles);
    } catch (error) {
        console.error('Error in getCandleData:', error);
        res.status(500).json({ error: error.message });
    }
};

function generateCandles(symbol, currentPrice, change24h, volume24h, timePeriod) {
    // Define time period configurations
    const periodConfig = {
        '1d': { count: 24, intervalMs: 60 * 60 * 1000 },        // 24 hours (hourly candles)
        '1w': { count: 168, intervalMs: 60 * 60 * 1000 },       // 7 days (hourly candles)
        '1m': { count: 30, intervalMs: 24 * 60 * 60 * 1000 },   // 30 days (daily candles)
        '1y': { count: 365, intervalMs: 24 * 60 * 60 * 1000 },  // 365 days (daily candles)
        'all': { count: 730, intervalMs: 24 * 60 * 60 * 1000 }  // 2 years (daily candles)
    };

    const config = periodConfig[timePeriod] || periodConfig['1d'];
    const { count, intervalMs } = config;

    const data = [];
    const currentTime = Date.now();

    const volatility = { 'BTC': 0.03, 'ETH': 0.04 }[symbol] || 0.04;
    let price = currentPrice / (1 + change24h / 100);

    for (let i = count; i >= 0; i--) {
        const time = Math.floor((currentTime - (i * intervalMs)) / 1000);
        const trendFactor = (count - i) / count;
        const randomWalk = (Math.random() - 0.5) * volatility;
        const priceMovement = (randomWalk * (1 - trendFactor * 0.5)) +
                              ((currentPrice - price) / price * trendFactor * 0.1);

        const open = price;
        const close = open * (1 + priceMovement);
        const candleVol = volatility * (0.3 + Math.random() * 0.4);
        const high = Math.max(open, close) * (1 + candleVol * Math.random());
        const low = Math.min(open, close) * (1 - candleVol * Math.random());
        const volume = (volume24h / 24) * (0.5 + Math.random());

        data.push({
            time,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: parseFloat(volume.toFixed(2)),
            timestamp: new Date(time * 1000).toISOString()
        });

        price = close;
    }

    if (data.length > 0) {
        data[data.length - 1].close = parseFloat(currentPrice.toFixed(2));
        data[data.length - 1].high = Math.max(data[data.length - 1].high, parseFloat(currentPrice.toFixed(2)));
        data[data.length - 1].low = Math.min(data[data.length - 1].low, parseFloat(currentPrice.toFixed(2)));
    }

    return data;
}

export const checkAPIStatus = async (req, res) => {
    try {
        const response = await fetch(`${CMC_BASE_URL}/v1/key/info`, {
            headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY, 'Accept': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            return res.json({ valid: true, plan: data.data?.plan || 'Unknown', usage: data.data?.usage || {} });
        } else {
            return res.status(response.status).json({ valid: false, error: `API key check failed: ${response.status}` });
        }
    } catch (error) {
        return res.status(500).json({ valid: false, error: error.message });
    }
};
