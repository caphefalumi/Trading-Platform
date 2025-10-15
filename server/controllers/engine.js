import prisma from '../utils/prisma.js'

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
    async processOrder(orderData) {
        // Validate required fields
        if (!orderData.accountId || !orderData.instrumentId || !orderData.sideId || !orderData.typeId || !orderData.statusId || !orderData.price || !orderData.quantity) {
            throw new Error('Missing required order fields')
        }
        // Ensure quantity is a string for Prisma Decimal
        const quantityStr = orderData.quantity.toString()
        // 1. Create the new order in DB
        const newOrder = await prisma.order.create({
            data: {
                accountId: orderData.accountId,
                instrumentId: orderData.instrumentId,
                sideId: orderData.sideId,
                typeId: orderData.typeId,
                statusId: orderData.statusId,
                timeInForceId: orderData.timeInForceId,
                clientOrderId: orderData.clientOrderId,
                price: orderData.price,
                quantity: quantityStr,
                filledQuantity: '0',
            }
        })

        // 2. Find matching orders (opposite side, same instrument, price match)
        const oppositeSideId = orderData.sideId === 1 ? 2 : 1 // 1=BUY, 2=SELL
        const priceCondition = orderData.sideId === 1
            ? { lte: orderData.price }
            : { gte: orderData.price }
        const matchingOrders = await prisma.order.findMany({
            where: {
                instrumentId: orderData.instrumentId,
                sideId: oppositeSideId,
                status: { code: 'PENDING' },
                price: priceCondition,
                remainingQuantity: { gt: '0' },
            },
            orderBy: { price: orderData.sideId === 1 ? 'asc' : 'desc' }
        })

        const trades = []
        let remainingQty = parseFloat(quantityStr)

        for (const match of matchingOrders) {
            if (remainingQty <= 0) break
            const matchQty = parseFloat(match.remainingQuantity)
            const tradeQty = Math.min(remainingQty, matchQty)
            // 3. Create execution record
            const execution = await prisma.execution.create({
                data: {
                    orderId: newOrder.id,
                    instrumentId: newOrder.instrumentId,
                    counterpartyOrderId: match.id,
                    price: match.price,
                    quantity: tradeQty.toString(),
                }
            })
            trades.push(execution)
            // 4. Update both orders
            await prisma.order.update({
                where: { id: match.id },
                data: {
                    filledQuantity: { increment: tradeQty },
                    remainingQuantity: { decrement: tradeQty },
                    statusId: tradeQty === matchQty ? 3 : 2 // 3=FILLED, 2=PARTIALLY_FILLED
                }
            })
            remainingQty -= tradeQty
        }
        // 5. Update new order
        await prisma.order.update({
            where: { id: newOrder.id },
            data: {
                filledQuantity: (parseFloat(quantityStr) - remainingQty).toString(),
                remainingQuantity: remainingQty.toString(),
                statusId: remainingQty === 0 ? 3 : (remainingQty < parseFloat(quantityStr) ? 2 : 1) // 3=FILLED, 2=PARTIALLY_FILLED, 1=PENDING
            }
        })
        return trades
    }
}

export default MatchingEngine;
