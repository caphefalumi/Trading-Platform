import { Prisma } from '@prisma/client'
import prisma from '../utils/prisma.js'

const toDecimal = (value) => (value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value))

export const listInstruments = async (_req, res) => {
  try {
    const instruments = await prisma.instruments.findMany({
      include: {
        currencies: true,
      },
      orderBy: { symbol: 'asc' },
    })

    res.json(instruments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createInstrument = async (req, res) => {
  const { symbol, name, lotSize, tickSize, currencyCode } = req.body

  if (!symbol || !name || !currencyCode) {
    return res.status(400).json({ error: 'Symbol, name and currency are required' })
  }

  try {
    const instrument = await prisma.$transaction(async (tx) => {
      const currency = await tx.currencies.findUnique({ where: { code: currencyCode } })

      if (!currency) {
        throw new Error(`Currency ${currencyCode} not found`)
      }

      return tx.instruments.create({
        data: {
          symbol,
          name,
          lot_size: toDecimal(lotSize || 0.0001),
          tick_size: toDecimal(tickSize || 0.01),
          currency_id: currency.id,
        },
        include: {
          currencies: true,
        },
      })
    })

    res.status(201).json(instrument)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateInstrument = async (req, res) => {
  const { id } = req.params
  const { name, lotSize, tickSize } = req.body

  try {
    const instrument = await prisma.instruments.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(lotSize ? { lot_size: toDecimal(lotSize) } : {}),
        ...(tickSize ? { tick_size: toDecimal(tickSize) } : {}),
      },
      include: {
        currencies: true,
      },
    })

    res.json(instrument)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
