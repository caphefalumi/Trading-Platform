import { Prisma } from '@prisma/client'
import prisma from '../utils/prisma.js'

const toDecimal = (value) => (value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value))

const formatDecimal = (value) => Number.parseFloat(value.toString())

export const listUserAccounts = async (req, res) => {
  const { userId } = req.params
  try {
    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        currency: true,
        balance: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    res.json(accounts)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const getAccountSummary = async (req, res) => {
  const { accountId } = req.params
  try {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        currency: true,
        balance: true,
        positions: {
          include: {
            instrument: {
              include: {
                marketQuotes: {
                  orderBy: { timestamp: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })

    if (!account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    const balance = account.balance || {
      available: new Prisma.Decimal(0),
      reserved: new Prisma.Decimal(0),
      total: new Prisma.Decimal(0),
    }

    const portfolio = account.positions.map((position) => {
      const lastQuote = position.instrument.marketQuotes[0]
      const markPrice = lastQuote?.lastPrice || lastQuote?.bidPrice || lastQuote?.askPrice || new Prisma.Decimal(0)
      const marketValue = toDecimal(position.quantity).mul(toDecimal(markPrice))
      return {
        instrumentId: position.instrumentId,
        symbol: position.instrument.symbol,
        name: position.instrument.name,
        quantity: formatDecimal(position.quantity),
        averagePrice: formatDecimal(position.averagePrice),
        markPrice: formatDecimal(markPrice),
        marketValue: formatDecimal(marketValue),
      }
    })

    const portfolioValue = portfolio.reduce((sum, holding) => sum + holding.marketValue, 0)

    res.json({
      account: {
        id: account.id,
        name: account.accountName,
        currency: account.currency.code,
        balance: {
          available: formatDecimal(balance.available),
          reserved: formatDecimal(balance.reserved),
          total: formatDecimal(balance.total),
        },
      },
      portfolio,
      totals: {
        cashAvailable: formatDecimal(balance.available),
        cashReserved: formatDecimal(balance.reserved),
        portfolioValue,
        equity: formatDecimal(balance.available) + portfolioValue,
      },
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const getLedgerEntryTypeId = async (code) => {
  const entryType = await prisma.ledgerEntryType.findUnique({ where: { code } })
  if (!entryType) {
    throw new Error(`Ledger entry type ${code} not configured`)
  }
  return entryType.id
}

const getTransactionMeta = async (typeCode) => {
  const [txType, status] = await Promise.all([
    prisma.transactionType.findUnique({ where: { code: typeCode } }),
    prisma.transactionStatus.findUnique({ where: { code: 'COMPLETED' } }),
  ])
  if (!txType) {
    throw new Error(`Transaction type ${typeCode} not configured`)
  }
  if (!status) {
    throw new Error('Transaction status COMPLETED not configured')
  }
  return { txTypeId: txType.id, statusId: status.id }
}

export const depositFunds = async (req, res) => {
  const { accountId } = req.params
  const { amount } = req.body

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Deposit amount must be greater than zero' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId },
        include: { balance: true, currency: true },
      })

      if (!account) {
        throw new Error('Account not found')
      }

      const depositAmount = toDecimal(amount)
      const balance = account.balance
        ? {
            available: toDecimal(account.balance.available),
            reserved: toDecimal(account.balance.reserved),
            total: toDecimal(account.balance.total),
          }
        : {
            available: new Prisma.Decimal(0),
            reserved: new Prisma.Decimal(0),
            total: new Prisma.Decimal(0),
          }

      const updatedBalance = {
        available: balance.available.add(depositAmount),
        reserved: balance.reserved,
      }
      updatedBalance.total = updatedBalance.available.add(updatedBalance.reserved)

      if (account.balance) {
        await tx.accountBalance.update({
          where: { accountId },
          data: {
            available: updatedBalance.available,
            reserved: updatedBalance.reserved,
            total: updatedBalance.total,
          },
        })
      } else {
        await tx.accountBalance.create({
          data: {
            accountId,
            currencyId: account.currencyId,
            available: updatedBalance.available,
            reserved: updatedBalance.reserved,
            total: updatedBalance.total,
          },
        })
      }

      const [ledgerTypeId, txMeta] = await Promise.all([
        getLedgerEntryTypeId('DEPOSIT'),
        getTransactionMeta('DEPOSIT'),
      ])

      await tx.ledgerEntry.create({
        data: {
          accountId,
          entryTypeId: ledgerTypeId,
          amount: depositAmount,
          currencyId: account.currencyId,
        },
      })

      await tx.transaction.create({
        data: {
          accountId,
          txTypeId: txMeta.txTypeId,
          statusId: txMeta.statusId,
          amount: depositAmount,
          currencyId: account.currencyId,
        },
      })

      return {
        available: formatDecimal(updatedBalance.available),
        reserved: formatDecimal(updatedBalance.reserved),
        total: formatDecimal(updatedBalance.total),
      }
    })

    res.json({ success: true, balance: result })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const withdrawFunds = async (req, res) => {
  const { accountId } = req.params
  const { amount } = req.body

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Withdrawal amount must be greater than zero' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId },
        include: { balance: true, currency: true },
      })

      if (!account || !account.balance) {
        throw new Error('Account or balance not found')
      }

      const withdrawalAmount = toDecimal(amount)
      const available = toDecimal(account.balance.available)

      if (available.lt(withdrawalAmount)) {
        throw new Error('Insufficient available balance')
      }

      const reserved = toDecimal(account.balance.reserved)
      const newAvailable = available.sub(withdrawalAmount)
      const newTotal = newAvailable.add(reserved)

      await tx.accountBalance.update({
        where: { accountId },
        data: {
          available: newAvailable,
          reserved,
          total: newTotal,
        },
      })

      const [ledgerTypeId, txMeta] = await Promise.all([
        getLedgerEntryTypeId('WITHDRAWAL'),
        getTransactionMeta('WITHDRAWAL'),
      ])

      await tx.ledgerEntry.create({
        data: {
          accountId,
          entryTypeId: ledgerTypeId,
          amount: withdrawalAmount.neg(),
          currencyId: account.currencyId,
        },
      })

      await tx.transaction.create({
        data: {
          accountId,
          txTypeId: txMeta.txTypeId,
          statusId: txMeta.statusId,
          amount: withdrawalAmount.neg(),
          currencyId: account.currencyId,
        },
      })

      return {
        available: formatDecimal(newAvailable),
        reserved: formatDecimal(reserved),
        total: formatDecimal(newTotal),
      }
    })

    res.json({ success: true, balance: result })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
