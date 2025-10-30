import { Prisma } from '@prisma/client'
import prisma from '../utils/prisma.js'

/**
 * Matching Engine - Price-Time Priority Algorithm
 *
 * This engine matches buy and sell orders based on:
 * 1. Price priority: Best prices get matched first
 * 2. Time priority: Earlier orders at the same price level get matched first
 *
 * Features:
 * - Supports LIMIT and MARKET orders
 * - Handles partial fills
 * - Updates account balances and positions
 * - Creates execution records
 * - Thread-safe using database transactions
 */

const ORDER_SIDES = {
  BUY: 'BUY',
  SELL: 'SELL',
}

const ORDER_TYPES = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
}

const ORDER_STATUSES = {
  OPEN: 'OPEN',
  PARTIAL: 'PARTIALLY_FILLED',
  FILLED: 'FILLED',
  CANCELLED: 'CANCELLED',
}

const toDecimal = (value) => (value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value))

/**
 * Get the order book for a specific instrument
 * Returns open and partially filled orders sorted by price and time
 */
const getOrderBook = async (tx, instrumentId, side) => {
  const sideRecord = await tx.orderSide.findUnique({ where: { code: side } })
  if (!sideRecord) throw new Error(`Side ${side} not found`)

  const statusOpen = await tx.orderStatus.findUnique({ where: { code: ORDER_STATUSES.OPEN } })
  const statusPartial = await tx.orderStatus.findUnique({ where: { code: ORDER_STATUSES.PARTIAL } })

  const orders = await tx.order.findMany({
    where: {
      instrumentId,
      sideId: sideRecord.id,
      statusId: { in: [statusOpen.id, statusPartial.id] },
    },
    include: {
      side: true,
      type: true,
      status: true,
      instrument: true,
    },
    orderBy: [
      // For SELL: lowest price first (ascending)
      // For BUY: highest price first (descending) - handled in application logic
      { price: side === ORDER_SIDES.SELL ? 'asc' : 'desc' },
      { createdAt: 'asc' }, // Time priority
    ],
  })

  return orders
}

/**
 * Calculate remaining quantity for an order
 */
const getRemainingQuantity = (order) => {
  const qty = toDecimal(order.quantity)
  const filled = toDecimal(order.filledQuantity)
  return qty.sub(filled)
}

/**
 * Check if orders can be matched based on price
 */
const canMatch = (buyOrder, sellOrder) => {
  // Market orders can always match
  if (buyOrder.type.code === ORDER_TYPES.MARKET || sellOrder.type.code === ORDER_TYPES.MARKET) {
    return true
  }

  // For limit orders: buy price must be >= sell price
  const buyPrice = toDecimal(buyOrder.price || 0)
  const sellPrice = toDecimal(sellOrder.price || 0)
  return buyPrice.gte(sellPrice)
}

/**
 * Determine the execution price
 * - If both are limit orders, use the older order's price (maker price)
 * - If one is market, use the limit order's price
 */
const getExecutionPrice = (buyOrder, sellOrder) => {
  if (buyOrder.type.code === ORDER_TYPES.MARKET) {
    return toDecimal(sellOrder.price)
  }
  if (sellOrder.type.code === ORDER_TYPES.MARKET) {
    return toDecimal(buyOrder.price)
  }

  // Both are limit orders - use the older order's price (maker price)
  return buyOrder.createdAt < sellOrder.createdAt
    ? toDecimal(buyOrder.price)
    : toDecimal(sellOrder.price)
}

/**
 * Update account balance for a buy order execution
 */
const updateBuyerBalance = async (tx, order, fillQty, tradePrice) => {
  const fillValue = tradePrice.mul(fillQty)

  // Get buyer's balance
  const balance = await tx.accountBalance.findUnique({
    where: {
      account_balance_unique: {
        accountId: order.accountId,
        currencyId: order.instrument.currencyId,
      },
    },
  })

  if (!balance) {
    throw new Error('Buyer balance not found')
  }

  const available = toDecimal(balance.available)
  const reserved = toDecimal(balance.reserved)

  let newAvailable = available
  let newReserved = reserved

  if (order.type.code === ORDER_TYPES.LIMIT) {
    // For limit orders, release reserved funds
    const limitPrice = toDecimal(order.price)
    const reservedRelease = limitPrice.mul(fillQty)
    newReserved = reserved.sub(reservedRelease)

    // Refund any price improvement
    const refund = limitPrice.sub(tradePrice).mul(fillQty)
    newAvailable = available.add(refund)
  } else {
    // For market orders, deduct from available
    if (available.lt(fillValue)) {
      throw new Error('Insufficient funds for market order execution')
    }
    newAvailable = available.sub(fillValue)
  }

  const newTotal = newAvailable.add(newReserved)

  await tx.accountBalance.update({
    where: { id: balance.id },
    data: {
      available: newAvailable,
      reserved: newReserved,
      total: newTotal,
    },
  })
}

/**
 * Update account balance for a sell order execution
 */
const updateSellerBalance = async (tx, order, fillQty, tradePrice) => {
  const fillValue = tradePrice.mul(fillQty)

  // Get seller's balance
  const balance = await tx.accountBalance.findUnique({
    where: {
      account_balance_unique: {
        accountId: order.accountId,
        currencyId: order.instrument.currencyId,
      },
    },
  })

  if (!balance) {
    // Create balance if it doesn't exist
    await tx.accountBalance.create({
      data: {
        accountId: order.accountId,
        currencyId: order.instrument.currencyId,
        available: fillValue,
        reserved: 0,
        total: fillValue,
      },
    })
  } else {
    const newAvailable = toDecimal(balance.available).add(fillValue)
    const newTotal = toDecimal(balance.total).add(fillValue)

    await tx.accountBalance.update({
      where: { id: balance.id },
      data: {
        available: newAvailable,
        total: newTotal,
      },
    })
  }
}

/**
 * Update position for an account
 */
const updatePosition = async (tx, accountId, instrumentId, quantityDelta, tradePrice) => {
  const position = await tx.position.findUnique({
    where: {
      accountId_instrumentId: {
        accountId,
        instrumentId,
      },
    },
  })

  const qtyDelta = toDecimal(quantityDelta)

  if (!position) {
    // Create new position
    await tx.position.create({
      data: {
        accountId,
        instrumentId,
        quantity: qtyDelta,
        averagePrice: tradePrice,
      },
    })
  } else {
    const currentQty = toDecimal(position.quantity)
    const currentAvg = toDecimal(position.averagePrice)
    const newQty = currentQty.add(qtyDelta)

    // Calculate new average price
    let newAvg
    if (qtyDelta.gt(0)) {
      // Adding to position
      const currentValue = currentQty.mul(currentAvg)
      const addedValue = qtyDelta.mul(tradePrice)
      newAvg = newQty.gt(0) ? currentValue.add(addedValue).div(newQty) : new Prisma.Decimal(0)
    } else {
      // Reducing position - keep same average
      newAvg = currentAvg
    }

    await tx.position.update({
      where: { id: position.id },
      data: {
        quantity: newQty,
        averagePrice: newAvg,
      },
    })
  }
}

/**
 * Create an execution record
 */
const createExecution = async (tx, buyOrder, sellOrder, quantity, price) => {
  await tx.execution.create({
    data: {
      orderId: buyOrder.id,
      counterpartyOrderId: sellOrder.id,
      price,
      quantity,
      liquidity: 'TAKER', // Simplification - could be improved
    },
  })

  await tx.execution.create({
    data: {
      orderId: sellOrder.id,
      counterpartyOrderId: buyOrder.id,
      price,
      quantity,
      liquidity: 'MAKER',
    },
  })
}

/**
 * Update order status based on filled quantity
 */
const updateOrderStatus = async (tx, orderId, filledQty, totalQty) => {
  const filled = toDecimal(filledQty)
  const total = toDecimal(totalQty)

  let newStatus
  if (filled.gte(total)) {
    const status = await tx.orderStatus.findUnique({ where: { code: ORDER_STATUSES.FILLED } })
    newStatus = status.id
  } else if (filled.gt(0)) {
    const status = await tx.orderStatus.findUnique({ where: { code: ORDER_STATUSES.PARTIAL } })
    newStatus = status.id
  } else {
    const status = await tx.orderStatus.findUnique({ where: { code: ORDER_STATUSES.OPEN } })
    newStatus = status.id
  }

  await tx.order.update({
    where: { id: orderId },
    data: {
      filledQuantity: filled,
      statusId: newStatus,
    },
  })
}

/**
 * Match a new order against the order book
 * This is the main entry point for the matching engine
 */
export const matchOrder = async (newOrder) => {
  return await prisma.$transaction(async (tx) => {
    // Reload the order with full details
    const order = await tx.order.findUnique({
      where: { id: newOrder.id },
      include: {
        side: true,
        type: true,
        status: true,
        instrument: true,
      },
    })

    if (!order) throw new Error('Order not found')

    // Get opposite side order book
    const oppositeSide = order.side.code === ORDER_SIDES.BUY ? ORDER_SIDES.SELL : ORDER_SIDES.BUY
    const oppositeOrders = await getOrderBook(tx, order.instrumentId, oppositeSide)

    let remainingQty = getRemainingQuantity(order)
    const executions = []

    // Try to match against each order in the book
    for (const counterOrder of oppositeOrders) {
      if (remainingQty.lte(0)) break

      // Check if orders can match
      const buyOrder = order.side.code === ORDER_SIDES.BUY ? order : counterOrder
      const sellOrder = order.side.code === ORDER_SIDES.SELL ? order : counterOrder

      if (!canMatch(buyOrder, sellOrder)) continue

      // Calculate fill quantity
      const counterRemaining = getRemainingQuantity(counterOrder)
      const fillQty = remainingQty.lt(counterRemaining) ? remainingQty : counterRemaining

      // Determine execution price
      const execPrice = getExecutionPrice(buyOrder, sellOrder)

      // Update balances
      await updateBuyerBalance(tx, buyOrder, fillQty, execPrice)
      await updateSellerBalance(tx, sellOrder, fillQty, execPrice)

      // Update positions
      await updatePosition(tx, buyOrder.accountId, order.instrumentId, fillQty, execPrice)
      await updatePosition(tx, sellOrder.accountId, order.instrumentId, fillQty.neg(), execPrice)

      // Create execution records
      await createExecution(tx, buyOrder, sellOrder, fillQty, execPrice)

      // Update order statuses
      const newBuyFilled = toDecimal(buyOrder.filledQuantity).add(fillQty)
      const newSellFilled = toDecimal(sellOrder.filledQuantity).add(fillQty)

      await updateOrderStatus(tx, buyOrder.id, newBuyFilled, buyOrder.quantity)
      await updateOrderStatus(tx, sellOrder.id, newSellFilled, sellOrder.quantity)

      executions.push({
        quantity: fillQty.toString(),
        price: execPrice.toString(),
        counterOrderId: counterOrder.id,
      })

      remainingQty = remainingQty.sub(fillQty)
    }

    return {
      orderId: order.id,
      executions,
      fullyFilled: remainingQty.lte(0),
      remainingQuantity: remainingQty.toString(),
    }
  })
}

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        side: true,
        type: true,
        status: true,
        instrument: true,
      },
    })

    if (!order) throw new Error('Order not found')

    // Check if order can be cancelled
    if (order.status.code === ORDER_STATUSES.FILLED) {
      throw new Error('Cannot cancel fully filled order')
    }
    if (order.status.code === ORDER_STATUSES.CANCELLED) {
      throw new Error('Order already cancelled')
    }

    // If it's a limit buy order, release reserved funds
    if (order.side.code === ORDER_SIDES.BUY && order.type.code === ORDER_TYPES.LIMIT) {
      const remainingQty = getRemainingQuantity(order)
      const price = toDecimal(order.price)
      const reservedAmount = remainingQty.mul(price)

      const balance = await tx.accountBalance.findUnique({
        where: {
          account_balance_unique: {
            accountId: order.accountId,
            currencyId: order.instrument.currencyId,
          },
        },
      })

      if (balance) {
        const newReserved = toDecimal(balance.reserved).sub(reservedAmount)
        const newAvailable = toDecimal(balance.available).add(reservedAmount)

        await tx.accountBalance.update({
          where: { id: balance.id },
          data: {
            reserved: newReserved,
            available: newAvailable,
          },
        })
      }
    }

    // Update order status to cancelled
    const cancelledStatus = await tx.orderStatus.findUnique({
      where: { code: ORDER_STATUSES.CANCELLED },
    })

    await tx.order.update({
      where: { id: orderId },
      data: {
        statusId: cancelledStatus.id,
      },
    })

    return { success: true, orderId }
  })
}

export default { matchOrder, cancelOrder }
