const express = require('express');
const app = express();
app.use(express.json());

class Order {
    constructor({ id, instrument, side, price, quantity }) {
        this.id = id;
        this.instrument = instrument;
        this.side = side; // "BUY" or "SELL"
        this.price = price;
        this.quantity = quantity;
        this.filled_quantity = 0;
        this.status = "PENDING";
        this.timestamp = Date.now();
    }
}

class Trade {
    constructor({ trade_id, buy_order_id, sell_order_id, instrument, price, quantity }) {
        this.trade_id = trade_id;
        this.buy_order_id = buy_order_id;
        this.sell_order_id = sell_order_id;
        this.instrument = instrument;
        this.price = price;
        this.quantity = quantity;
        this.timestamp = Date.now();
    }
}

class OrderBook {
    constructor() {
        this.bids = new Map(); // price -> [orders], descending
        this.asks = new Map(); // price -> [orders], ascending
    }

    addOrder(order) {
        const trades = [];
        if (order.side === "BUY") {
            // Match against asks (lowest price first)
            const askPrices = Array.from(this.asks.keys()).sort((a, b) => a - b);
            for (const askPrice of askPrices) {
                if (order.price < askPrice || order.quantity <= 0) break;
                const askQueue = this.asks.get(askPrice);
                while (askQueue.length && order.quantity > 0) {
                    const askOrder = askQueue[0];
                    const tradeQuantity = Math.min(order.quantity, askOrder.quantity);
                    trades.push(new Trade({
                        trade_id: `TRADE_${Date.now()}`,
                        buy_order_id: order.id,
                        sell_order_id: askOrder.id,
                        instrument: order.instrument,
                        price: askOrder.price,
                        quantity: tradeQuantity
                    }));
                    order.quantity -= tradeQuantity;
                    askOrder.quantity -= tradeQuantity;
                    if (askOrder.quantity === 0) {
                        askQueue.shift();
                    } else {
                        break;
                    }
                }
                if (askQueue.length === 0) {
                    this.asks.delete(askPrice);
                }
            }
            if (order.quantity > 0) {
                if (!this.bids.has(order.price)) this.bids.set(order.price, []);
                this.bids.get(order.price).push(order);
            }
        } else if (order.side === "SELL") {
            // Match against bids (highest price first)
            const bidPrices = Array.from(this.bids.keys()).sort((a, b) => b - a);
            for (const bidPrice of bidPrices) {
                if (order.price > bidPrice || order.quantity <= 0) break;
                const bidQueue = this.bids.get(bidPrice);
                while (bidQueue.length && order.quantity > 0) {
                    const bidOrder = bidQueue[0];
                    const tradeQuantity = Math.min(order.quantity, bidOrder.quantity);
                    trades.push(new Trade({
                        trade_id: `TRADE_${Date.now()}`,
                        buy_order_id: bidOrder.id,
                        sell_order_id: order.id,
                        instrument: order.instrument,
                        price: bidOrder.price,
                        quantity: tradeQuantity
                    }));
                    order.quantity -= tradeQuantity;
                    bidOrder.quantity -= tradeQuantity;
                    if (bidOrder.quantity === 0) {
                        bidQueue.shift();
                    } else {
                        break;
                    }
                }
                if (bidQueue.length === 0) {
                    this.bids.delete(bidPrice);
                }
            }
            if (order.quantity > 0) {
                if (!this.asks.has(order.price)) this.asks.set(order.price, []);
                this.asks.get(order.price).push(order);
            }
        }
        return trades;
    }
}

class MatchingEngine {
    constructor() {
        this.orderBooks = new Map(); // instrument -> OrderBook
    }

    processOrder(orderData) {
        const order = new Order(orderData);
        if (!this.orderBooks.has(order.instrument)) {
            this.orderBooks.set(order.instrument, new OrderBook());
        }
        const book = this.orderBooks.get(order.instrument);
        const trades = book.addOrder(order);
        return trades;
    }
}

const engine = new MatchingEngine();

app.post('/order', (req, res) => {
    const orderData = req.body;
    const trades = engine.processOrder(orderData);
    res.json({ trades });
});

app.get('/ping', (req, res) => {
    res.send('PONG');
});

app.listen(5555, () => {
    console.log('Matching Engine listening on port 5555');
});
