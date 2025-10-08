const zmq = require('zeromq');
const { v4: uuidv4 } = require('uuid');

class Trade {
  constructor({ trade_id, buy_order_id, sell_order_id, instrument, price, quantity, timestamp }) {
    this.trade_id = trade_id;
    this.buy_order_id = buy_order_id;
    this.sell_order_id = sell_order_id;
    this.instrument = instrument;
    this.price = price;
    this.quantity = quantity;
    this.timestamp = timestamp;
  }
}

class Order {
  constructor({ id, instrument, side, price, quantity, client_order_id, timestamp }) {
    this.id = id;
    this.instrument = instrument;
    this.side = side;
    this.price = price;
    this.quantity = quantity;
    this.client_order_id = client_order_id;
    this.timestamp = timestamp;
  }
}

class OrderBook {
  constructor() {
    this.bids = new Map(); // price -> [Order]
    this.asks = new Map(); // price -> [Order]
  }

  addOrder(order) {
    const trades = [];
    let workingOrder = { ...order };
    if (order.side === 'BUY') {
      // Match against asks
      const askPrices = Array.from(this.asks.keys()).sort((a, b) => a - b);
      for (const askPrice of askPrices) {
        if (workingOrder.quantity <= 0) break;
        if (workingOrder.price < askPrice) break;
        const askQueue = this.asks.get(askPrice);
        while (askQueue.length && workingOrder.quantity > 0) {
          const askOrder = askQueue[0];
          const tradeQuantity = Math.min(workingOrder.quantity, askOrder.quantity);
          const trade = new Trade({
            trade_id: 'TRADE_' + Date.now(),
            buy_order_id: workingOrder.id,
            sell_order_id: askOrder.id,
            instrument: workingOrder.instrument,
            price: askOrder.price,
            quantity: tradeQuantity,
            timestamp: Date.now(),
          });
          trades.push(trade);
          workingOrder.quantity -= tradeQuantity;
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
      if (workingOrder.quantity > 0) {
        if (!this.bids.has(workingOrder.price)) this.bids.set(workingOrder.price, []);
        this.bids.get(workingOrder.price).push(workingOrder);
      }
    } else if (order.side === 'SELL') {
      // Match against bids
      const bidPrices = Array.from(this.bids.keys()).sort((a, b) => b - a);
      for (const bidPrice of bidPrices) {
        if (workingOrder.quantity <= 0) break;
        if (workingOrder.price > bidPrice) break;
        const bidQueue = this.bids.get(bidPrice);
        while (bidQueue.length && workingOrder.quantity > 0) {
          const bidOrder = bidQueue[0];
          const tradeQuantity = Math.min(workingOrder.quantity, bidOrder.quantity);
          const trade = new Trade({
            trade_id: 'TRADE_' + Date.now(),
            buy_order_id: bidOrder.id,
            sell_order_id: workingOrder.id,
            instrument: workingOrder.instrument,
            price: bidOrder.price,
            quantity: tradeQuantity,
            timestamp: Date.now(),
          });
          trades.push(trade);
          workingOrder.quantity -= tradeQuantity;
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
      if (workingOrder.quantity > 0) {
        if (!this.asks.has(workingOrder.price)) this.asks.set(workingOrder.price, []);
        this.asks.get(workingOrder.price).push(workingOrder);
      }
    }
    return trades;
  }
}

class MatchingEngine {
  constructor() {
    this.orderBooks = {};
    this.socket = new zmq.Reply();
  }

  async start() {
    await this.socket.bind('tcp://*:5555');
    console.log('Matching Engine listening on port 5555');
    for await (const [msg] of this.socket) {
      const response = await this.processCommand(msg.toString());
      await this.socket.send(response);
    }
  }

  processOrder(order) {
    if (!this.orderBooks[order.instrument]) {
      this.orderBooks[order.instrument] = new OrderBook();
    }
    const trades = this.orderBooks[order.instrument].addOrder(order);
    for (const trade of trades) {
      this.sendToNodeJS(trade);
    }
  }

  async processCommand(command) {
    const parts = command.split('|');
    const cmd = parts[0];
    if (cmd === 'NEW_ORDER') {
      // Format: NEW_ORDER|id|instrument|side|price|quantity
      const [_, id, instrument, side, price, quantity] = parts;
      const order = new Order({
        id,
        instrument,
        side,
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        client_order_id: id,
        timestamp: Date.now(),
      });
      this.processOrder(order);
      return 'ORDER_ACCEPTED';
    } else if (cmd === 'PING') {
      return 'PONG';
    } else {
      return 'UNKNOWN_COMMAND';
    }
  }

  sendToNodeJS(trade) {
    // Replace with actual notification logic if needed
    console.log('TRADE_NOTIFICATION:', trade);
  }
}

if (require.main === module) {
  const engine = new MatchingEngine();
  engine.start();
}
