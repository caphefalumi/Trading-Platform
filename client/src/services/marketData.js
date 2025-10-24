// client/src/services/marketData.js (Sử dụng Binance Public API)

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

const cmcClient = { // Tên biến giữ nguyên là cmcClient để hạn chế đổi quá nhiều trong DashboardMain.vue

    /**
     * Lấy giá hiện tại (real-time ticker) cho các symbol.
     * @param {string[]} symbols - Mảng các symbol (ví dụ: ['BTC', 'ETH']). Binance dùng format 'BTCUSDT'.
     */
    async getLatestQuotes(symbols) {
        const results = {};
        const fetchPromises = symbols.map(async (symbol) => {
            const pair = `${symbol}USDT`;
            try {
                // Endpoint lấy 24h Ticker Price Change Statistics
                const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${pair}`);
                const data = await response.json();

                if (response.ok && data.lastPrice) {
                    results[symbol] = {
                        price: parseFloat(data.lastPrice),
                        // Tính phần trăm thay đổi trong 24h
                        changePercent: parseFloat(data.priceChangePercent)
                    };
                } else {
                    console.error(`Không tìm thấy dữ liệu Binance cho ${pair}`, data);
                }
            } catch (error) {
                console.error(`Lỗi khi fetch Binance Ticker cho ${pair}:`, error);
            }
        });

        await Promise.all(fetchPromises);
        return results;
    },
    
    /**
     * Lấy dữ liệu nến lịch sử (Candlestick/K-Line).
     * @param {string} symbol - Symbol (ví dụ: 'BTC').
     * @param {string} interval - Khoảng thời gian (ví dụ: '1d', '4h').
     */
    async getCandleData(symbol, interval = '1d') {
        const pair = `${symbol}USDT`;
        // Lấy 100 nến gần nhất
        const limit = 100; 
        
        try {
            const url = `${BINANCE_BASE_URL}/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;
            const response = await fetch(url);
            const rawData = await response.json();
            
            if (!response.ok) {
                 console.error(`Lỗi API Binance Klines: ${rawData.msg || 'Không rõ lỗi'}`, rawData);
                 return [];
            }

            // CHUYỂN ĐỔI DỮ LIỆU SANG FORMAT CẦN DÙNG
            return rawData.map(d => ({
                // Dữ liệu Binance trả về (index):
                // [0] Open time
                // [1] Open price
                // [2] High price
                // [3] Low price
                // [4] Close price
                // [5] Volume
                // [6] Close time (Ta sẽ dùng Open time, chia 1000 để thành timestamp giây)
                
                time: Math.floor(d[0] / 1000), 
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
                volume: parseFloat(d[5])
            }));

        } catch (error) {
            console.error(`Lỗi khi fetch Binance Klines cho ${pair}:`, error);
            return [];
        }
    }
};

export default cmcClient;