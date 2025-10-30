import { io } from 'socket.io-client'
import { reactive } from 'vue'

/**
 * WebSocket Client Service
 * Manages real-time connections to the trading platform backend
 */

class WebSocketClient {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5

    // Reactive state for market data
    this.marketData = reactive({
      quotes: [],
      lastUpdate: null,
    })

    // Event handlers storage
    this.handlers = {
      marketData: [],
      orderUpdate: [],
      execution: [],
      balanceUpdate: [],
      orderBook: [],
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return
    }

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001'

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.setupEventHandlers()
    console.log('🔌 WebSocket connecting...')
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.socket.on('connect', () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      console.log('✅ WebSocket connected:', this.socket.id)

      // Request initial market data snapshot
      this.socket.emit('request:marketData')
    })

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false
      console.log('❌ WebSocket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message)
      this.reconnectAttempts++
    })

    // Market data events
    this.socket.on('marketData:update', (quotes) => {
      this.marketData.quotes = quotes
      this.marketData.lastUpdate = new Date()
      this.handlers.marketData.forEach(handler => handler(quotes))
    })

    this.socket.on('marketData:snapshot', (quotes) => {
      this.marketData.quotes = quotes
      this.marketData.lastUpdate = new Date()
      this.handlers.marketData.forEach(handler => handler(quotes))
    })

    this.socket.on('marketData:instrument', (quote) => {
      // Update specific instrument in the quotes array
      const index = this.marketData.quotes.findIndex(q => q.instrumentId === quote.instrumentId)
      if (index !== -1) {
        this.marketData.quotes[index] = quote
      } else {
        this.marketData.quotes.push(quote)
      }
      this.marketData.lastUpdate = new Date()
    })

    // Order events
    this.socket.on('order:update', (data) => {
      console.log('Order update received:', data)
      this.handlers.orderUpdate.forEach(handler => handler(data))
    })

    this.socket.on('order:execution', (data) => {
      console.log('Execution received:', data)
      this.handlers.execution.forEach(handler => handler(data))
    })

    // Balance events
    this.socket.on('balance:update', (data) => {
      console.log('Balance update received:', data)
      this.handlers.balanceUpdate.forEach(handler => handler(data))
    })

    // Order book events
    this.socket.on('orderBook:update', (data) => {
      this.handlers.orderBook.forEach(handler => handler(data))
    })
  }

  /**
   * Subscribe to updates for a specific instrument
   */
  subscribeToInstrument(instrumentId) {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected')
      return
    }

    this.socket.emit('subscribe:instrument', instrumentId)
    console.log(`📊 Subscribed to instrument: ${instrumentId}`)
  }

  /**
   * Unsubscribe from updates for a specific instrument
   */
  unsubscribeFromInstrument(instrumentId) {
    if (!this.socket?.connected) return

    this.socket.emit('unsubscribe:instrument', instrumentId)
    console.log(`Unsubscribed from instrument: ${instrumentId}`)
  }

  /**
   * Subscribe to updates for a specific account
   */
  subscribeToAccount(accountId) {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected')
      return
    }

    this.socket.emit('subscribe:account', accountId)
    console.log(`👤 Subscribed to account: ${accountId}`)
  }

  /**
   * Unsubscribe from updates for a specific account
   */
  unsubscribeFromAccount(accountId) {
    if (!this.socket?.connected) return

    this.socket.emit('unsubscribe:account', accountId)
    console.log(`Unsubscribed from account: ${accountId}`)
  }

  /**
   * Register a handler for market data updates
   */
  onMarketData(handler) {
    this.handlers.marketData.push(handler)

    // Return unsubscribe function
    return () => {
      const index = this.handlers.marketData.indexOf(handler)
      if (index > -1) {
        this.handlers.marketData.splice(index, 1)
      }
    }
  }

  /**
   * Register a handler for order updates
   */
  onOrderUpdate(handler) {
    this.handlers.orderUpdate.push(handler)

    return () => {
      const index = this.handlers.orderUpdate.indexOf(handler)
      if (index > -1) {
        this.handlers.orderUpdate.splice(index, 1)
      }
    }
  }

  /**
   * Register a handler for execution notifications
   */
  onExecution(handler) {
    this.handlers.execution.push(handler)

    return () => {
      const index = this.handlers.execution.indexOf(handler)
      if (index > -1) {
        this.handlers.execution.splice(index, 1)
      }
    }
  }

  /**
   * Register a handler for balance updates
   */
  onBalanceUpdate(handler) {
    this.handlers.balanceUpdate.push(handler)

    return () => {
      const index = this.handlers.balanceUpdate.indexOf(handler)
      if (index > -1) {
        this.handlers.balanceUpdate.splice(index, 1)
      }
    }
  }

  /**
   * Register a handler for order book updates
   */
  onOrderBookUpdate(handler) {
    this.handlers.orderBook.push(handler)

    return () => {
      const index = this.handlers.orderBook.indexOf(handler)
      if (index > -1) {
        this.handlers.orderBook.splice(index, 1)
      }
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      console.log('WebSocket disconnected')
    }
  }

  /**
   * Get current market data
   */
  getMarketData() {
    return this.marketData.quotes
  }
}

// Create singleton instance
const websocketClient = new WebSocketClient()

export default websocketClient
export { websocketClient }
