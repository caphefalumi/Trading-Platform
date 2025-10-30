import { Server } from 'socket.io'
import marketDataAgent from './marketDataAgent.js'

/**
 * WebSocket Service using Socket.IO
 *
 * Provides real-time updates for:
 * - Market data (price updates)
 * - Order updates (status changes, fills)
 * - Account balance updates
 * - Execution notifications
 */

class WebSocketService {
  constructor() {
    this.io = null
    this.marketDataInterval = null
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173'],
        credentials: true,
      },
    })

    this.setupEventHandlers()
    this.startMarketDataBroadcast()

    console.log('✅ WebSocket service initialized')
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Handle client subscribing to specific instruments
      socket.on('subscribe:instrument', (instrumentId) => {
        socket.join(`instrument:${instrumentId}`)
        console.log(`Client ${socket.id} subscribed to instrument ${instrumentId}`)
      })

      // Handle client unsubscribing from instruments
      socket.on('unsubscribe:instrument', (instrumentId) => {
        socket.leave(`instrument:${instrumentId}`)
        console.log(`Client ${socket.id} unsubscribed from instrument ${instrumentId}`)
      })

      // Handle client subscribing to account updates
      socket.on('subscribe:account', (accountId) => {
        socket.join(`account:${accountId}`)
        console.log(`Client ${socket.id} subscribed to account ${accountId}`)
      })

      // Handle client unsubscribing from account updates
      socket.on('unsubscribe:account', (accountId) => {
        socket.leave(`account:${accountId}`)
        console.log(`Client ${socket.id} unsubscribed from account ${accountId}`)
      })

      // Handle client requesting current market data
      socket.on('request:marketData', async () => {
        try {
          const quotes = await marketDataAgent.getLatestQuotes()
          socket.emit('marketData:snapshot', quotes)
        } catch (error) {
          console.error('Failed to send market data snapshot:', error)
        }
      })

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`)
      })
    })
  }

  /**
   * Start broadcasting market data updates
   */
  startMarketDataBroadcast() {
    // Broadcast market data every 30 seconds
    this.marketDataInterval = setInterval(async () => {
      try {
        const quotes = await marketDataAgent.getLatestQuotes()

        // Broadcast to all connected clients
        this.io.emit('marketData:update', quotes)

        // Also broadcast to instrument-specific rooms
        quotes.forEach(quote => {
          this.io.to(`instrument:${quote.instrumentId}`).emit('marketData:instrument', quote)
        })
      } catch (error) {
        console.error('Market data broadcast error:', error)
      }
    }, 30000)
  }

  /**
   * Broadcast order update to specific account
   */
  emitOrderUpdate(accountId, order) {
    if (!this.io) return

    this.io.to(`account:${accountId}`).emit('order:update', {
      orderId: order.id,
      status: order.status,
      filledQuantity: order.filledQuantity,
      remainingQuantity: order.remainingQuantity,
      updatedAt: order.updatedAt,
    })
  }

  /**
   * Broadcast execution notification
   */
  emitExecution(accountId, execution) {
    if (!this.io) return

    this.io.to(`account:${accountId}`).emit('order:execution', {
      orderId: execution.orderId,
      executionId: execution.id,
      price: execution.price,
      quantity: execution.quantity,
      executedAt: execution.executedAt,
    })
  }

  /**
   * Broadcast balance update
   */
  emitBalanceUpdate(accountId, balance) {
    if (!this.io) return

    this.io.to(`account:${accountId}`).emit('balance:update', {
      currency: balance.currency,
      available: balance.available,
      reserved: balance.reserved,
      total: balance.total,
    })
  }

  /**
   * Broadcast order book update for instrument
   */
  emitOrderBookUpdate(instrumentId, orderBook) {
    if (!this.io) return

    this.io.to(`instrument:${instrumentId}`).emit('orderBook:update', orderBook)
  }

  /**
   * Stop the WebSocket service
   */
  stop() {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval)
      this.marketDataInterval = null
    }

    if (this.io) {
      this.io.close()
      this.io = null
    }

    console.log('✅ WebSocket service stopped')
  }
}

// Create singleton instance
const websocketService = new WebSocketService()

export default websocketService
