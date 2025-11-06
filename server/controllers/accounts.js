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
  const { amount, currencyCode } = req.body

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Deposit amount must be greater than zero' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId },
        include: { baseCurrency: true },
      })

      if (!account) {
        throw new Error('Account not found')
      }

      // Enforce deposits only in USDT
      const requestedCurrencyCode = currencyCode ? currencyCode.toUpperCase() : null
      const accountBaseCurrencyCode = account.baseCurrency?.code?.toUpperCase()
      if (requestedCurrencyCode) {
        if (requestedCurrencyCode !== 'USDT') {
          throw new Error('Deposits are allowed only in USDT')
        }
      } else if (accountBaseCurrencyCode && accountBaseCurrencyCode !== 'USDT') {
        // If no currencyCode provided, require the account base currency to be USDT
        throw new Error('Deposits are allowed only in USDT')
      }

      // Use provided currency or default to account's base currency
      let currencyId = account.baseCurrencyId
      if (currencyCode) {
        const currency = await tx.currency.findUnique({ where: { code: currencyCode } })
        if (!currency) throw new Error(`Currency ${currencyCode} not found`)
        currencyId = currency.id
      }

      const depositAmount = toDecimal(amount)

      // Get or create account balance for this currency
      let balance = await tx.accountBalance.findUnique({
        where: {
          accountId_currencyId: {
            accountId,
            currencyId,
          },
        },
      })

      if (!balance) {
        balance = await tx.accountBalance.create({
          data: {
            accountId,
            currencyId,
            available: 0,
            reserved: 0,
            total: 0,
          },
        })
      }

      const newAvailable = toDecimal(balance.available).add(depositAmount)
      const newTotal = toDecimal(balance.total).add(depositAmount)

      const updatedBalance = await tx.accountBalance.update({
        where: { id: balance.id },
        data: {
          available: newAvailable,
          total: newTotal,
        },
      })

      const [ledgerTypeId, txMeta] = await Promise.all([
        getLedgerEntryTypeId('DEPOSIT'),
        getTransactionMeta('DEPOSIT'),
      ])

      await tx.ledgerEntry.create({
        data: {
          accountId,
          entryTypeId: ledgerTypeId,
          amount: depositAmount,
          referenceTable: 'account_balances',
          referenceId: updatedBalance.id,
        },
      })

      await tx.transaction.create({
        data: {
          accountId,
          txTypeId: txMeta.txTypeId,
          statusId: txMeta.statusId,
          amount: depositAmount,
        },
      })

      return {
        // include the currencyId so callers (client/UI) know which currency this balance refers to
        currencyId,
        available: formatDecimal(updatedBalance.available),
        reserved: formatDecimal(updatedBalance.reserved),
        total: formatDecimal(updatedBalance.total),
      }
    })

    res.json({ success: true, balance: result })
  } catch (error) {
    console.error('Deposit error:', error)
    res.status(400).json({ error: error.message })
  }
}

export const withdrawFunds = async (req, res) => {
  const { accountId } = req.params
  const { amount, currencyCode } = req.body

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Withdrawal amount must be greater than zero' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId },
        include: { baseCurrency: true },
      })

      if (!account) {
        throw new Error('Account not found')
      }

      // Use provided currency or default to account's base currency
      let currencyId = account.baseCurrencyId
      if (currencyCode) {
        const currency = await tx.currency.findUnique({ where: { code: currencyCode } })
        if (!currency) throw new Error(`Currency ${currencyCode} not found`)
        currencyId = currency.id
      }

      const withdrawalAmount = toDecimal(amount)

      // Get account balance for this currency
      const balance = await tx.accountBalance.findUnique({
        where: {
          accountId_currencyId: {
            accountId,
            currencyId,
          },
        },
      })

      if (!balance) {
        throw new Error('No balance found for this currency')
      }

      const currentAvailable = toDecimal(balance.available)

      // Check sufficient funds
      if (currentAvailable.lt(withdrawalAmount)) {
        throw new Error('Insufficient funds')
      }

      const newAvailable = currentAvailable.sub(withdrawalAmount)
      const newTotal = toDecimal(balance.total).sub(withdrawalAmount)

      const updatedBalance = await tx.accountBalance.update({
        where: { id: balance.id },
        data: {
          available: newAvailable,
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
          referenceTable: 'account_balances',
          referenceId: balance.id,
        },
      })

      await tx.transaction.create({
        data: {
          accountId,
          txTypeId: txMeta.txTypeId,
          statusId: txMeta.statusId,
          amount: withdrawalAmount.neg(),
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
    console.error('Withdrawal error:', error)
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

      // Enforce demo credits only in USDT (keep demo flow aligned with deposit policy)
      const requestedCurrencyCode = currencyCode ? currencyCode.toUpperCase() : null
      const accountBaseCurrencyCode = account.baseCurrency?.code?.toUpperCase()
      if (requestedCurrencyCode) {
        if (requestedCurrencyCode !== 'USDT') {
          throw new Error('Demo credits are allowed only in USDT')
        }
      } else if (accountBaseCurrencyCode && accountBaseCurrencyCode !== 'USDT') {
        throw new Error('Demo credits are allowed only in USDT')
      }

      // Resolve currency for the demo credit. Prefer provided currencyCode, otherwise account base currency.
      let currencyId = account.baseCurrencyId
      if (currencyCode) {
        const currency = await tx.currency.findUnique({ where: { code: currencyCode } })
        if (!currency) throw new Error(`Currency ${currencyCode} not found`)
        currencyId = currency.id
      }

      const creditAmount = toDecimal(amount)

      // Get or create account balance for this currency
      let balance = await tx.accountBalance.findUnique({
        where: {
          accountId_currencyId: {
            accountId,
            currencyId,
          },
        },
      })

      if (!balance) {
        balance = await tx.accountBalance.create({
          data: {
            accountId,
            currencyId,
            available: 0,
            reserved: 0,
            total: 0,
          },
        })
      }

      const newAvailable = toDecimal(balance.available).add(creditAmount)
      const newTotal = toDecimal(balance.total).add(creditAmount)

      const updatedBalance = await tx.accountBalance.update({
        where: { id: balance.id },
        data: {
          available: newAvailable,
          total: newTotal,
        },
      })

      const [ledgerTypeId, txMeta] = await Promise.all([
        getLedgerEntryTypeId('DEPOSIT'),
        getTransactionMeta('DEPOSIT'),
      ])

      await tx.ledgerEntry.create({
        data: {
          accountId,
          entryTypeId: ledgerTypeId,
          amount: creditAmount,
          referenceTable: 'account_balances',
          referenceId: balance.id,
        },
      })

      await tx.transaction.create({
        data: {
          accountId,
          txTypeId: txMeta.txTypeId,
          statusId: txMeta.statusId,
          amount: creditAmount,
        },
      })

      return {
        currencyId,
        available: formatDecimal(updatedBalance.available),
        reserved: formatDecimal(updatedBalance.reserved),
        total: formatDecimal(updatedBalance.total),
      }
    })

    res.json({ success: true, balance: result })
  } catch (error) {
    console.error('Demo credit error:', error)
    res.status(400).json({ error: error.message })
  }
}

export const getAccountBalance = async (req, res) => {
  const { accountId } = req.params
  const { currencyCode } = req.query

  try {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        baseCurrency: true,
        balances: {
          include: {
            currency: true,
          },
        },
      },
    })

    if (!account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    // If specific currency requested, return that balance
    if (currencyCode) {
      const balance = account.balances.find(b => b.currency.code === currencyCode)
      if (!balance) {
        return res.json({
          currency: currencyCode,
          available: 0,
          reserved: 0,
          total: 0,
        })
      }
      return res.json({
        currency: balance.currency.code,
        available: formatDecimal(balance.available),
        reserved: formatDecimal(balance.reserved),
        total: formatDecimal(balance.total),
      })
    }

    // Return all balances
    const balances = account.balances.map(b => ({
      currency: b.currency.code,
      currencySymbol: b.currency.symbol,
      available: formatDecimal(b.available),
      reserved: formatDecimal(b.reserved),
      total: formatDecimal(b.total),
    }))

    res.json({
      accountId: account.id,
      email: account.email,
      baseCurrency: account.baseCurrency.code,
      balances,
    })
  } catch (error) {
    console.error('Get balance error:', error)
    res.status(400).json({ error: error.message })
  }
}
