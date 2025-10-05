import { randomUUID } from 'crypto'
import {
  ACTION_TYPES,
  ACTOR_TYPES,
  OBJECT_TYPES,
  ORDER_SIDES,
  ORDER_STATUSES,
  ORDER_TYPES,
  TIME_IN_FORCE_TYPES,
  getState,
  recordAuditLog,
} from './dataStore.js'
import { handleTradeSettlement } from './accountingEngine.js'

function getBook(instrumentId) {
  const state = getState()
  if (!state.orderBooks.has(instrumentId)) {
    state.orderBooks.set(instrumentId, { buy: [], sell: [] })
  }
  return state.orderBooks.get(instrumentId)
}

function sortBook(book) {
  const buyPrice = (order) => (order.price ?? Number.POSITIVE_INFINITY)
  const sellPrice = (order) => (order.price ?? 0)
  book.buy.sort((a, b) => {
    const priceDiff = buyPrice(b) - buyPrice(a)
    if (priceDiff === 0) {
      return new Date(a.createdAt) - new Date(b.createdAt)
    }
    return priceDiff
  })
  book.sell.sort((a, b) => {
    const priceDiff = sellPrice(a) - sellPrice(b)
    if (priceDiff === 0) {
      return new Date(a.createdAt) - new Date(b.createdAt)
    }
    return priceDiff
  })
}

function updateQuotes(instrumentId) {
  const state = getState()
  const book = getBook(instrumentId)
  const bestBid = book.buy[0]?.price ?? null
  const bestAsk = book.sell[0]?.price ?? null
  const executions = state.executions.filter(
    (execution) => execution.instrumentId === instrumentId,
  )
  const lastExecution = executions.at(-1)
  const volume = executions.reduce((sum, execution) => sum + execution.quantity, 0)
  state.quotes.set(instrumentId, {
    instrumentId,
    bid: bestBid,
    ask: bestAsk,
    last: lastExecution?.price ?? null,
    volume,
    updatedAt: new Date().toISOString(),
  })
}

function addOrderToBook(order) {
  const book = getBook(order.instrumentId)
  book[order.side.toLowerCase()].push(order)
  sortBook(book)
  updateQuotes(order.instrumentId)
}

function removeOrderFromBook(order) {
  const book = getBook(order.instrumentId)
  const sideArray = book[order.side.toLowerCase()]
  const index = sideArray.findIndex((item) => item.id === order.id)
  if (index !== -1) {
    sideArray.splice(index, 1)
  }
  updateQuotes(order.instrumentId)
}

function persistOrder(order) {
  const state = getState()
  state.orders.push(order)
  addOrderToBook(order)
}

function updateOrderStatus(order, status) {
  order.status = status
  order.updatedAt = new Date().toISOString()
}

function createExecution({ instrumentId, buyOrder, sellOrder, quantity, price }) {
  const execution = {
    id: randomUUID(),
    instrumentId,
    buyOrderId: buyOrder.id,
    sellOrderId: sellOrder.id,
    quantity,
    price,
    executedAt: new Date().toISOString(),
  }
  const state = getState()
  state.executions.push(execution)
  recordAuditLog({
    actorType: ACTOR_TYPES.SYSTEM,
    actionType: ACTION_TYPES.EXECUTE,
    objectType: OBJECT_TYPES.EXECUTION,
    description: `Execution ${execution.id} created`,
    metadata: execution,
  })
  handleTradeSettlement({ execution, buyOrder, sellOrder })
  updatePositions({ execution, buyOrder, sellOrder })
  updateQuotes(instrumentId)
  return execution
}

function updatePositions({ execution, buyOrder, sellOrder }) {
  const state = getState()
  const buyKey = `${buyOrder.accountId}:${execution.instrumentId}`
  const sellKey = `${sellOrder.accountId}:${execution.instrumentId}`
  const buyPosition = state.positions.get(buyKey) ?? {
    id: randomUUID(),
    accountId: buyOrder.accountId,
    instrumentId: execution.instrumentId,
    quantity: 0,
    averagePrice: 0,
    updatedAt: new Date().toISOString(),
  }
  const sellPosition = state.positions.get(sellKey) ?? {
    id: randomUUID(),
    accountId: sellOrder.accountId,
    instrumentId: execution.instrumentId,
    quantity: 0,
    averagePrice: 0,
    updatedAt: new Date().toISOString(),
  }

  // Update buy position average price using weighted average
  const newQuantity = buyPosition.quantity + execution.quantity
  buyPosition.averagePrice =
    newQuantity === 0
      ? 0
      :
          (buyPosition.averagePrice * buyPosition.quantity +
            execution.price * execution.quantity) /
          newQuantity
  buyPosition.quantity = newQuantity
  buyPosition.updatedAt = new Date().toISOString()
  state.positions.set(buyKey, buyPosition)

  sellPosition.quantity -= execution.quantity
  sellPosition.updatedAt = new Date().toISOString()
  state.positions.set(sellKey, sellPosition)

  recordAuditLog({
    actorType: ACTOR_TYPES.SYSTEM,
    actionType: ACTION_TYPES.UPDATE,
    objectType: OBJECT_TYPES.POSITION,
    description: 'Positions updated after execution',
    metadata: {
      executionId: execution.id,
      positions: [buyPosition, sellPosition],
    },
  })
}

function processMatches(order) {
  const book = getBook(order.instrumentId)
  const isBuy = order.side === ORDER_SIDES.BUY
  const opposingSide = isBuy ? book.sell : book.buy
  const executed = []

  const priceComparator = isBuy
    ? (orderPrice, restingPrice) => orderPrice >= restingPrice
    : (orderPrice, restingPrice) => orderPrice <= restingPrice

  while (order.remainingQuantity > 0 && opposingSide.length > 0) {
    const restingOrder = opposingSide[0]
    const canMatch =
      order.type === ORDER_TYPES.MARKET ||
      restingOrder.type === ORDER_TYPES.MARKET ||
      priceComparator(order.price, restingOrder.price)
    if (!canMatch) {
      break
    }
    const quantity = Math.min(order.remainingQuantity, restingOrder.remainingQuantity)
    const price =
      restingOrder.price ?? order.price ?? 0
    restingOrder.filledQuantity += quantity
    restingOrder.remainingQuantity -= quantity
    if (restingOrder.remainingQuantity === 0) {
      updateOrderStatus(restingOrder, ORDER_STATUSES.FILLED)
      removeOrderFromBook(restingOrder)
    } else {
      updateOrderStatus(restingOrder, ORDER_STATUSES.PARTIALLY_FILLED)
    }

    order.filledQuantity += quantity
    order.remainingQuantity -= quantity
    updateOrderStatus(
      order,
      order.remainingQuantity > 0
        ? ORDER_STATUSES.PARTIALLY_FILLED
        : ORDER_STATUSES.FILLED,
    )

    const execution = createExecution({
      instrumentId: order.instrumentId,
      buyOrder: isBuy ? order : restingOrder,
      sellOrder: isBuy ? restingOrder : order,
      quantity,
      price,
    })
    executed.push(execution)
  }

  return executed
}

export function placeOrder({
  accountId,
  instrumentId,
  side,
  type = ORDER_TYPES.LIMIT,
  quantity,
  price,
  timeInForce = TIME_IN_FORCE_TYPES.GTC,
  currency = 'USD',
}) {
  if (!accountId || !instrumentId || !side || !quantity) {
    throw new Error('Missing required order fields')
  }
  if (!Object.values(ORDER_SIDES).includes(side)) {
    throw new Error('Invalid order side')
  }
  if (!Object.values(ORDER_TYPES).includes(type)) {
    throw new Error('Invalid order type')
  }
  if (type === ORDER_TYPES.LIMIT && (price === undefined || price === null)) {
    throw new Error('Limit orders require a price')
  }
  if (quantity <= 0) {
    throw new Error('Quantity must be positive')
  }

  const now = new Date().toISOString()
  const order = {
    id: randomUUID(),
    accountId,
    instrumentId,
    side,
    type,
    status: ORDER_STATUSES.NEW,
    quantity,
    filledQuantity: 0,
    remainingQuantity: quantity,
    price: type === ORDER_TYPES.MARKET ? null : price,
    timeInForce,
    currency,
    createdAt: now,
    updatedAt: now,
  }

  persistOrder(order)
  recordAuditLog({
    actorType: ACTOR_TYPES.USER,
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.ORDER,
    description: `Order ${order.id} placed`,
    metadata: order,
  })

  const executions = processMatches(order)

  if (
    order.remainingQuantity > 0 &&
    (order.type === ORDER_TYPES.MARKET || order.timeInForce === TIME_IN_FORCE_TYPES.IOC)
  ) {
    updateOrderStatus(order, ORDER_STATUSES.CANCELLED)
    removeOrderFromBook(order)
  }

  if (order.remainingQuantity === 0) {
    removeOrderFromBook(order)
  }

  updateQuotes(order.instrumentId)

  return { order, executions }
}

export function cancelOrder(orderId) {
  const state = getState()
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) {
    throw new Error('Order not found')
  }
  if (order.status === ORDER_STATUSES.FILLED) {
    throw new Error('Cannot cancel a filled order')
  }
  updateOrderStatus(order, ORDER_STATUSES.CANCELLED)
  removeOrderFromBook(order)
  recordAuditLog({
    actorType: ACTOR_TYPES.USER,
    actionType: ACTION_TYPES.CANCEL,
    objectType: OBJECT_TYPES.ORDER,
    description: `Order ${order.id} cancelled`,
    metadata: order,
  })
  return order
}

export function listOrders() {
  return [...getState().orders]
}

export function getOrderById(id) {
  return getState().orders.find((order) => order.id === id)
}

export function listExecutions() {
  return [...getState().executions]
}

export function listPositions(accountId) {
  const entries = Array.from(getState().positions.values())
  if (accountId) {
    return entries.filter((position) => position.accountId === accountId)
  }
  return entries
}

export function getQuote(instrumentId) {
  return getState().quotes.get(instrumentId) ?? {
    instrumentId,
    bid: null,
    ask: null,
    last: null,
    volume: 0,
    updatedAt: new Date().toISOString(),
  }
}

export function listQuotes() {
  return Array.from(getState().quotes.values())
}

export function getAuditTrail() {
  return getState().auditLogs
}
