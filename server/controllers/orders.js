import { Prisma } from '@prisma/client'
import prisma from '../utils/prisma.js'

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
const formatDecimal = (value) => Number.parseFloat(value.toString())

const fetchReference = async (tx, model, code) => {
  const record = await tx[model].findUnique({ where: { code } })
  if (!record) {
    throw new Error(`${model} with code ${code} not configured`)
  }
  return record
}

const getOppositeSide = (side) => (side === ORDER_SIDES.BUY ? ORDER_SIDES.SELL : ORDER_SIDES.BUY)

const recordLedgerEntry = async (
  tx,
  { accountId, amount, currencyId, entryTypeCode, referenceId },
) => {
  const entryType = await fetchReference(tx, 'ledgerEntryType', entryTypeCode)
  await tx.ledgerEntry.create({
    data: {
      accountId,
      entryTypeId: entryType.id,
      amount,
      currencyId,
      referenceId,
      referenceTable: 'orders',
    },
  })
}

const updateMarketQuote = async (tx, instrumentId, price, quantity) => {
  await tx.marketQuote.create({
    data: {
      instrumentId,
      lastPrice: price,
      bidPrice: price,
      askPrice: price,
      volume: quantity,
      timestamp: new Date(),
    },
  })
}

const applyBuyFill = async (tx, { order, fillQty, tradePrice, counterOrder, references }) => {
  const fillValue = tradePrice.mul(fillQty)

  const buyerBalance = await tx.accountBalance.findUnique({ where: { accountId: order.accountId } })
  if (!buyerBalance) {
    throw new Error('Buyer balance not found')
  }

  const available = toDecimal(buyerBalance.available)
  const reserved = toDecimal(buyerBalance.reserved)

  let newAvailable = available
  let newReserved = reserved

  if (references.typeCode === ORDER_TYPES.LIMIT) {
    if (!order.price) {
      throw new Error('Limit order missing price')
    }
    const limitPrice = toDecimal(order.price)
    const reservedRelease = limitPrice.mul(fillQty)
    newReserved = reserved.sub(reservedRelease)
    const refund = limitPrice.sub(tradePrice).mul(fillQty)
    newAvailable = available.add(refund)
  } else {
    if (available.lt(fillValue)) {
      throw new Error('Insufficient funds for market order execution')
    }
    newAvailable = available.sub(fillValue)
  }

  const newTotal = newAvailable.add(newReserved)

  await tx.accountBalance.update({
    where: { accountId: order.accountId },
    data: {
      available: newAvailable,
      reserved: newReserved,
      total: newTotal,
    },
  })

  const position = await tx.position.findUnique({
    where: {
      accountId_instrumentId: {
        accountId: order.accountId,
        instrumentId: order.instrumentId,
      },
    },
  })

  const previousQty = position ? toDecimal(position.quantity) : new Prisma.Decimal(0)
  const previousValue = position
    ? toDecimal(position.averagePrice).mul(previousQty)
    : new Prisma.Decimal(0)
  const newQty = previousQty.add(fillQty)
  const totalValue = previousValue.add(fillValue)
  const newAvg = newQty.gt(0) ? totalValue.div(newQty) : new Prisma.Decimal(0)

  if (position) {
    await tx.position.update({
      where: { id: position.id },
      data: {
        quantity: newQty,
        averagePrice: newAvg,
      },
    })
  } else {
    await tx.position.create({
      data: {
        accountId: order.accountId,
        instrumentId: order.instrumentId,
        quantity: newQty,
        averagePrice: newAvg,
      },
    })
  }

  await recordLedgerEntry(tx, {
    accountId: order.accountId,
    amount: fillValue.neg(),
    currencyId: order.instrument.currencyId,
    entryTypeCode: 'TRADE_FILL',
    referenceId: order.id,
  })

  await recordLedgerEntry(tx, {
    accountId: counterOrder.accountId,
    amount: fillValue,
    currencyId: order.instrument.currencyId,
    entryTypeCode: 'TRADE_FILL',
    referenceId: counterOrder.id,
  })
}

const applySellFill = async (tx, { order, fillQty, tradePrice }) => {
  const fillValue = tradePrice.mul(fillQty)
  const sellerBalance = await tx.accountBalance.findUnique({
    where: { accountId: order.accountId },
  })
  if (!sellerBalance) {
    throw new Error('Seller balance not found')
  }

  const available = toDecimal(sellerBalance.available).add(fillValue)
  const reserved = toDecimal(sellerBalance.reserved)
  const total = available.add(reserved)

  await tx.accountBalance.update({
    where: { accountId: order.accountId },
    data: {
      available,
      reserved,
      total,
    },
  })

  const position = await tx.position.findUnique({
    where: {
      accountId_instrumentId: {
        accountId: order.accountId,
        instrumentId: order.instrumentId,
      },
    },
  })

  if (!position) {
    throw new Error('Position not found for sell order')
  }

  const newQty = toDecimal(position.quantity).sub(fillQty)

  if (newQty.lte(0)) {
    await tx.position.delete({ where: { id: position.id } })
  } else {
    await tx.position.update({
      where: { id: position.id },
      data: { quantity: newQty },
    })
  }
}

const updateOrderFillState = async (
  tx,
  { orderId, fillQty, remainingQty, filledQty, statusId },
) => {
  await tx.order.update({
    where: { id: orderId },
    data: {
      filledQuantity: filledQty,
      remainingQuantity: remainingQty,
      statusId,
    },
  })
}

const matchOrder = async (tx, orderRecord, references) => {
  const results = []
  let remaining = toDecimal(orderRecord.remainingQuantity)
  let filled = toDecimal(orderRecord.filledQuantity)

  while (remaining.gt(0)) {
    const counterOrder = await tx.order.findFirst({
      where: {
        instrumentId: orderRecord.instrumentId,
        status: { code: ORDER_STATUSES.OPEN },
        side: { code: getOppositeSide(references.sideCode) },
      },
      include: {
        account: true,
        instrument: true,
        type: true,
      },
      orderBy:
        references.sideCode === ORDER_SIDES.BUY
          ? [{ price: 'asc' }, { createdAt: 'asc' }]
          : [{ price: 'desc' }, { createdAt: 'asc' }],
    })

    if (!counterOrder) {
      break
    }

    if (references.typeCode === ORDER_TYPES.LIMIT) {
      if (!orderRecord.price) {
        break
      }
      if (!counterOrder.price) {
        break
      }
      if (references.sideCode === ORDER_SIDES.BUY && counterOrder.price.gt(orderRecord.price)) {
        break
      }
      if (references.sideCode === ORDER_SIDES.SELL && counterOrder.price.lt(orderRecord.price)) {
        break
      }
    }

    const counterRemaining = toDecimal(counterOrder.remainingQuantity)
    const fillQty = remaining.lt(counterRemaining) ? remaining : counterRemaining
    const tradePrice = counterOrder.price || orderRecord.price

    if (!tradePrice) {
      throw new Error('Unable to determine trade price')
    }

    const tradePriceDecimal = toDecimal(tradePrice)

    if (references.sideCode === ORDER_SIDES.BUY) {
      await applyBuyFill(tx, {
        order: orderRecord,
        fillQty,
        tradePrice: tradePriceDecimal,
        counterOrder,
        references,
      })
      await applySellFill(tx, {
        order: counterOrder,
        fillQty,
        tradePrice: tradePriceDecimal,
      })
    } else {
      await applySellFill(tx, {
        order: orderRecord,
        fillQty,
        tradePrice: tradePriceDecimal,
      })
      await applyBuyFill(tx, {
        order: counterOrder,
        fillQty,
        tradePrice: tradePriceDecimal,
        counterOrder: orderRecord,
        references: { ...references, typeCode: counterOrder.type.code },
      })
    }

    const newRemaining = remaining.sub(fillQty)
    const newFilled = filled.add(fillQty)
    const counterNewRemaining = counterRemaining.sub(fillQty)
    const counterNewFilled = toDecimal(counterOrder.filledQuantity || 0).add(fillQty)

    const orderStatusId = newRemaining.gt(0)
      ? references.partialStatusId
      : references.filledStatusId
    const counterStatusId = counterNewRemaining.gt(0)
      ? references.partialStatusId
      : references.filledStatusId

    await updateOrderFillState(tx, {
      orderId: orderRecord.id,
      fillQty,
      remainingQty: newRemaining,
      filledQty: newFilled,
      statusId: orderStatusId,
    })

    await updateOrderFillState(tx, {
      orderId: counterOrder.id,
      fillQty,
      remainingQty: counterNewRemaining,
      filledQty: counterNewFilled,
      statusId: counterStatusId,
    })

    await tx.execution.create({
      data: {
        orderId: orderRecord.id,
        instrumentId: orderRecord.instrumentId,
        counterpartyOrderId: counterOrder.id,
        price: tradePriceDecimal,
        quantity: fillQty,
      },
    })

    await tx.execution.create({
      data: {
        orderId: counterOrder.id,
        instrumentId: counterOrder.instrumentId,
        counterpartyOrderId: orderRecord.id,
        price: tradePriceDecimal,
        quantity: fillQty,
      },
    })

    await updateMarketQuote(tx, orderRecord.instrumentId, tradePriceDecimal, fillQty)

    results.push({
      counterOrderId: counterOrder.id,
      quantity: formatDecimal(fillQty),
      price: formatDecimal(tradePriceDecimal),
    })

    remaining = newRemaining
    filled = newFilled
  }

  return { fills: results, remaining, filled }
}

export const placeOrder = async (req, res) => {
  const { accountId, instrumentId, side, type, quantity, price, timeInForce } = req.body

  if (!accountId || !instrumentId || !side || !type || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [account, instrument] = await Promise.all([
        tx.account.findUnique({
          where: { id: accountId },
          include: {
            balances: {
              include: {
                currency: true
              }
            }
          },
        }),
        tx.instrument.findUnique({
          where: { id: instrumentId },
          include: { currency: true }
        }),
      ])

      if (!account) {
        throw new Error('Account not found')
      }

      if (!instrument) {
        throw new Error('Instrument not found')
      }

      // Get or create account balance for the instrument's currency
      let accountBalance = account.balances.find(b => b.currencyId === instrument.currencyId)

      if (!accountBalance) {
        accountBalance = await tx.accountBalance.create({
          data: {
            accountId,
            currencyId: instrument.currencyId,
            available: 0,
            reserved: 0,
            total: 0,
          },
        })
      }

      const sideCode = side.toUpperCase()
      const typeCode = type.toUpperCase()
      const tifCode = (timeInForce || 'GTC').toUpperCase()

      if (!Object.values(ORDER_SIDES).includes(sideCode)) {
        throw new Error('Invalid order side')
      }

      if (!Object.values(ORDER_TYPES).includes(typeCode)) {
        throw new Error('Invalid order type')
      }

      const [sideRef, typeRef, tifRef, openStatus, partialStatus, filledStatus, cancelledStatus] =
        await Promise.all([
          fetchReference(tx, 'orderSide', sideCode),
          fetchReference(tx, 'orderType', typeCode),
          fetchReference(tx, 'timeInForceType', tifCode),
          fetchReference(tx, 'orderStatus', ORDER_STATUSES.OPEN),
          fetchReference(tx, 'orderStatus', ORDER_STATUSES.PARTIAL),
          fetchReference(tx, 'orderStatus', ORDER_STATUSES.FILLED),
          fetchReference(tx, 'orderStatus', ORDER_STATUSES.CANCELLED),
        ])

      const qtyDecimal = toDecimal(quantity)
      if (qtyDecimal.lte(0)) {
        throw new Error('Quantity must be greater than zero')
      }

      let priceDecimal = null
      if (typeCode === ORDER_TYPES.LIMIT) {
        if (!price) {
          throw new Error('Price is required for limit orders')
        }
        priceDecimal = toDecimal(price)
        if (priceDecimal.lte(0)) {
          throw new Error('Price must be greater than zero')
        }
      }

      // Balance checking for BUY orders
      if (sideCode === ORDER_SIDES.BUY) {
        const available = toDecimal(accountBalance.available)

        if (typeCode === ORDER_TYPES.LIMIT) {
          // For limit orders, reserve the full amount
          const reserve = priceDecimal.mul(qtyDecimal)
          if (available.lt(reserve)) {
            throw new Error(`Insufficient available balance. Required: ${reserve.toString()}, Available: ${available.toString()}`)
          }
          const newAvailable = available.sub(reserve)
          const newReserved = toDecimal(accountBalance.reserved).add(reserve)
          await tx.accountBalance.update({
            where: { id: accountBalance.id },
            data: {
              available: newAvailable,
              reserved: newReserved,
              total: newAvailable.add(newReserved),
            },
          })
        } else if (typeCode === ORDER_TYPES.MARKET) {
          // For market orders, we'll check funds during matching
          // but ensure some balance exists
          if (available.lte(0)) {
            throw new Error('Insufficient balance for market order')
          }
        }
      }

      if (sideCode === ORDER_SIDES.SELL) {
        const position = await tx.position.findUnique({
          where: {
            accountId_instrumentId: {
              accountId,
              instrumentId,
            },
          },
        })
        if (!position || toDecimal(position.quantity).lt(qtyDecimal)) {
          throw new Error('Insufficient holdings for sell order')
        }
      }

      const order = await tx.order.create({
        data: {
          accountId,
          instrumentId,
          sideId: sideRef.id,
          typeId: typeRef.id,
          statusId: openStatus.id,
          timeInForceId: tifRef.id,
          price: priceDecimal,
          quantity: qtyDecimal,
          remainingQuantity: qtyDecimal,
        },
        include: {
          instrument: true,
        },
      })

      const matchResult = await matchOrder(tx, order, {
        sideCode,
        typeCode,
        partialStatusId: partialStatus.id,
        filledStatusId: filledStatus.id,
        cancelledStatusId: cancelledStatus.id,
      })

      if (matchResult.fills.length === 0 && typeCode === ORDER_TYPES.MARKET) {
        throw new Error('No liquidity available to execute market order')
      }

      if (matchResult.remaining.gt(0) && typeCode === ORDER_TYPES.MARKET) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            statusId: cancelledStatus.id,
            remainingQuantity: new Prisma.Decimal(0),
          },
        })
      }

      if (matchResult.remaining.gt(0) && typeCode === ORDER_TYPES.LIMIT && tifCode === 'IOC') {
        if (sideCode === ORDER_SIDES.BUY && priceDecimal) {
          const balance = await tx.accountBalance.findUnique({ where: { accountId } })
          if (balance) {
            const available = toDecimal(balance.available)
            const reserved = toDecimal(balance.reserved)
            const releaseAmount = priceDecimal.mul(matchResult.remaining)
            const newAvailable = available.add(releaseAmount)
            const newReserved = reserved.sub(releaseAmount)
            await tx.accountBalance.update({
              where: { accountId },
              data: {
                available: newAvailable,
                reserved: newReserved,
                total: newAvailable.add(newReserved),
              },
            })
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            statusId: cancelledStatus.id,
            remainingQuantity: new Prisma.Decimal(0),
          },
        })
      }

      const updatedOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          status: true,
          side: true,
          type: true,
        },
      })

      return {
        order: updatedOrder,
        fills: matchResult.fills,
      }
    })

    res.status(201).json(result)
  } catch (error) {
    console.error('❌ Place Order Error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      accountId: req.body.accountId,
      instrumentId: req.body.instrumentId,
    })
    res.status(400).json({ error: error.message })
  }
}

export const listAccountOrders = async (req, res) => {
  const { accountId } = req.params
  const { status, instrumentId, startDate, endDate, limit = 100 } = req.query

  try {
    const where = { accountId }

    // Add optional filters
    if (status) {
      const statusRecord = await prisma.orderStatus.findUnique({ where: { code: status.toUpperCase() } })
      if (statusRecord) {
        where.statusId = statusRecord.id
      }
    }

    if (instrumentId) {
      where.instrumentId = instrumentId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        status: true,
        side: true,
        type: true,
        instrument: true,
        executions: {
          select: {
            id: true,
            price: true,
            quantity: true,
            executedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    })

    // Format the response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      instrumentId: order.instrumentId,
      symbol: order.instrument.symbol,
      side: order.side.code,
      type: order.type.code,
      status: order.status.code,
      price: order.price ? formatDecimal(order.price) : null,
      quantity: formatDecimal(order.quantity),
      filledQuantity: formatDecimal(order.filledQuantity),
      remainingQuantity: formatDecimal(order.quantity) - formatDecimal(order.filledQuantity),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      executions: order.executions.map(exec => ({
        id: exec.id,
        price: formatDecimal(exec.price),
        quantity: formatDecimal(exec.quantity),
        executedAt: exec.executedAt,
      })),
    }))

    res.json(formattedOrders)
  } catch (error) {
    console.error('List orders error:', error)
    res.status(500).json({ error: error.message })
  }
}

export const getOrderBook = async (req, res) => {
  const { instrumentId } = req.params
  try {
    const [buys, sells] = await Promise.all([
      prisma.order.findMany({
        where: {
          instrumentId,
          status: { code: ORDER_STATUSES.OPEN },
          side: { code: ORDER_SIDES.BUY },
        },
        orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
      }),
      prisma.order.findMany({
        where: {
          instrumentId,
          status: { code: ORDER_STATUSES.OPEN },
          side: { code: ORDER_SIDES.SELL },
        },
        orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
      }),
    ])

    res.json({
      bids: buys.map((order) => ({
        id: order.id,
        price: formatDecimal(order.price || 0),
        quantity: formatDecimal(order.remainingQuantity),
      })),
      asks: sells.map((order) => ({
        id: order.id,
        price: formatDecimal(order.price || 0),
        quantity: formatDecimal(order.remainingQuantity),
      })),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const listAccountExecutions = async (req, res) => {
  const accountId = req.params.accountId
  if (!accountId) return res.status(400).json({ error: 'Missing accountId' })
  try {
    const executions = await prisma.execution.findMany({
      where: {
        order: {
          accountId: accountId,
        },
      },
      include: {
        order: true,
      },
      orderBy: { executedAt: 'desc' },
      take: 50,
    })
    res.json(executions)
  } catch (err) {
    console.error('Failed to fetch executions:', err)
    res.status(500).json({ error: err.message })
  }
}

export const cancelOrder = async (req, res) => {
  const { orderId } = req.params
  const { accountId } = req.body

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Fetch the order with all necessary details
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          side: true,
          type: true,
          status: true,
          instrument: true,
        },
      })

      if (!order) {
        throw new Error('Order not found')
      }

      // Verify ownership if accountId is provided
      if (accountId && order.accountId !== accountId) {
        throw new Error('Unauthorized: Order does not belong to this account')
      }

      // Check if order can be cancelled
      if (order.status.code === ORDER_STATUSES.FILLED) {
        throw new Error('Cannot cancel fully filled order')
      }
      if (order.status.code === ORDER_STATUSES.CANCELLED) {
        throw new Error('Order already cancelled')
      }

      const remainingQty = toDecimal(order.quantity).sub(toDecimal(order.filledQuantity))

      // If it's a limit buy order, release reserved funds
      if (order.side.code === ORDER_SIDES.BUY && order.type.code === ORDER_TYPES.LIMIT && order.price) {
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
              reserved: newReserved.lt(0) ? new Prisma.Decimal(0) : newReserved,
              available: newAvailable,
              total: toDecimal(balance.total),
            },
          })
        }
      }

      // Update order status to cancelled
      const cancelledStatus = await tx.orderStatus.findUnique({
        where: { code: ORDER_STATUSES.CANCELLED },
      })

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          statusId: cancelledStatus.id,
          updatedAt: new Date(),
        },
        include: {
          status: true,
          side: true,
          type: true,
          instrument: true,
        },
      })

      return {
        success: true,
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status.code,
          instrumentSymbol: updatedOrder.instrument.symbol,
          side: updatedOrder.side.code,
          type: updatedOrder.type.code,
          cancelledAt: updatedOrder.updatedAt,
        },
      }
    })

    res.json(result)
  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(400).json({ error: error.message })
  }
}
