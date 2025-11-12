import { Prisma } from '@prisma/client'
import prisma from './prisma.js'
import { randomUUID } from 'crypto'

const ORDER_SIDE_DATA = [
  { code: 'BUY', description: 'Buy orders' },
  { code: 'SELL', description: 'Sell orders' },
]

const ORDER_STATUS_DATA = [
  { code: 'OPEN', description: 'Open order' },
  { code: 'PARTIALLY_FILLED', description: 'Order partially filled' },
  { code: 'FILLED', description: 'Order filled' },
  { code: 'CANCELLED', description: 'Order cancelled' },
]

const ORDER_TYPE_DATA = [
  { code: 'LIMIT', description: 'Limit order' },
  { code: 'MARKET', description: 'Market order' },
]

const TIF_DATA = [
  { code: 'GTC', description: 'Good till cancelled' },
  { code: 'IOC', description: 'Immediate or cancel' },
]

const LEDGER_ENTRY_TYPES = [
  { code: 'DEPOSIT', description: 'Cash deposit', category: 'CASH' },
  { code: 'WITHDRAWAL', description: 'Cash withdrawal', category: 'CASH' },
  { code: 'TRADE_FILL', description: 'Trade execution', category: 'TRADE' },
]

const TX_TYPES = [
  { code: 'DEPOSIT', description: 'Deposit', category: 'CASH' },
  { code: 'WITHDRAWAL', description: 'Withdrawal', category: 'CASH' },
]

const TX_STATUSES = [
  { code: 'PENDING', description: 'Pending' },
  { code: 'COMPLETED', description: 'Completed' },
]

const ensureRecord = async (model, data, identifier = 'code') => {
  await prisma[model].upsert({
    where: { [identifier]: data[identifier] },
    update: data,
    create: data,
  })
}

export const ensureReferenceData = async () => {
  await Promise.all(ORDER_SIDE_DATA.map((item) => ensureRecord('order_sides', item)))
  await Promise.all(ORDER_STATUS_DATA.map((item) => ensureRecord('order_statuses', item)))
  await Promise.all(ORDER_TYPE_DATA.map((item) => ensureRecord('order_types', item)))
  await Promise.all(TIF_DATA.map((item) => ensureRecord('time_in_force_types', item)))
  await Promise.all(LEDGER_ENTRY_TYPES.map((item) => ensureRecord('ledger_entry_types', item)))
  await Promise.all(TX_TYPES.map((item) => ensureRecord('transaction_types', item)))
  await Promise.all(TX_STATUSES.map((item) => ensureRecord('transaction_statuses', item)))

  const usdt = await prisma.currencies.upsert({
    where: { code: 'USDT' },
    update: { name: 'Tether USD', symbol: '$' },
    create: { id: randomUUID(), code: 'USDT', name: 'Tether USD', symbol: '$' },
  })

  await prisma.instruments.upsert({
    where: { symbol: 'BTCUSDT' },
    update: {},
    create: {
      id: randomUUID(),
      symbol: 'BTCUSDT',
      name: 'Bitcoin / Tether',
      lot_size: new Prisma.Decimal(0.0001),
      tick_size: new Prisma.Decimal(0.01),
      currency_id: usdt.id,
    },
  })

  await prisma.instruments.upsert({
    where: { symbol: 'ETHUSDT' },
    update: {},
    create: {
      id: randomUUID(),
      symbol: 'ETHUSDT',
      name: 'Ethereum / Tether',
      lot_size: new Prisma.Decimal(0.001),
      tick_size: new Prisma.Decimal(0.01),
      currency_id: usdt.id,
    },
  })
}
