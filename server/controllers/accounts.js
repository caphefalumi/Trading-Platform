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
        baseCurrency: true,
        balances: true,
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
    // Get account and positions
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        baseCurrency: true,
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

    // Compute cash balance by summing deposits/withdrawals from transactions
    const cashTxs = await prisma.transaction.findMany({
      where: {
        accountId,
        status: { code: 'COMPLETED' },
        txType: { code: { in: ['DEPOSIT', 'WITHDRAWAL'] } },
      },
      include: { txType: true },
    })
    // If you want to filter by currency, filter in JS:
    // const baseCurrencyId = account.baseCurrencyId
    // const filteredTxs = cashTxs.filter(tx => tx.currencyId === baseCurrencyId)
    let cashAvailable = 0
    for (const tx of cashTxs) {
      if (tx.txType.code === 'DEPOSIT') cashAvailable += Number(tx.amount)
      if (tx.txType.code === 'WITHDRAWAL') cashAvailable -= Number(tx.amount)
    }

    // Compute portfolio from positions and market prices
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
        name: account.email,
        currency: account.baseCurrency.code,
        balance: {
          available: cashAvailable,
          reserved: 0,
          total: cashAvailable,
        },
      },
      portfolio,
      totals: {
        cashAvailable,
        cashReserved: 0,
        portfolioValue,
        equity: cashAvailable + portfolioValue,
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
        available: formatDecimal(depositAmount),
        reserved: 0,
        total: formatDecimal(depositAmount),
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

      if (!account) {
        throw new Error('Account not found')
      }

      const withdrawalAmount = toDecimal(amount)

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
        available: formatDecimal(withdrawalAmount.neg()),
        reserved: 0,
        total: formatDecimal(withdrawalAmount.neg()),
      }
    })

    res.json({ success: true, balance: result })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const demoCreditFunds = async (req, res) => {
  const { accountId } = req.params
  const { amount, currencyCode } = req.body

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Demo credit amount must be greater than zero' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId },
        include: { balances: true, baseCurrency: true },
      })

      if (!account) {
        throw new Error('Account not found')
      }

      // Resolve currency for the demo credit. Prefer provided currencyCode, otherwise account base currency.
      let currencyId = account.baseCurrencyId
      if (currencyCode) {
        const currency = await tx.currency.findUnique({ where: { code: currencyCode } })
        if (!currency) throw new Error(`Currency ${currencyCode} not found`)
        currencyId = currency.id
      }

      const creditAmount = toDecimal(amount)

      const [ledgerTypeId, txMeta] = await Promise.all([
        getLedgerEntryTypeId('DEPOSIT'),
        getTransactionMeta('DEPOSIT'),
      ])

      await tx.ledgerEntry.create({
        data: {
          accountId,
          entryTypeId: ledgerTypeId,
          amount: creditAmount,
          currencyId,
          referenceTable: 'account_balances',
        },
      })

      await tx.transaction.create({
        data: {
          accountId,
          txTypeId: txMeta.txTypeId,
          statusId: txMeta.statusId,
          amount: creditAmount,
          currencyId,
        },
      })

      return {
        currencyId,
        available: formatDecimal(creditAmount),
        reserved: 0,
        total: formatDecimal(creditAmount),
      }
    })

    res.json({ success: true, balance: result })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
