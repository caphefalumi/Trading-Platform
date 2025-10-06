import { Prisma } from '@prisma/client'
import prisma from '../utils/prisma.js'

const toDecimal = (value) => (value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value))

export const listInstruments = async (_req, res) => {
  try {
    const instruments = await prisma.instrument.findMany({
      include: {
        assetClass: true,
        currency: true,
      },
      orderBy: { symbol: 'asc' },
    })

    res.json(instruments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createInstrument = async (req, res) => {
  const { symbol, name, assetClassName, lotSize, tickSize, currencyCode } = req.body

  if (!symbol || !name || !assetClassName || !currencyCode) {
    return res.status(400).json({ error: 'Symbol, name, asset class and currency are required' })
  }

  try {
    const instrument = await prisma.$transaction(async (tx) => {
      const [assetClass, currency] = await Promise.all([
        tx.assetClass.upsert({
          where: { name: assetClassName },
          update: {},
          create: { name: assetClassName },
        }),
        tx.currency.findUnique({ where: { code: currencyCode } }),
      ])

      if (!currency) {
        throw new Error(`Currency ${currencyCode} not found`)
      }

      return tx.instrument.create({
        data: {
          symbol,
          name,
          assetClassId: assetClass.id,
          lotSize: toDecimal(lotSize || 0.0001),
          tickSize: toDecimal(tickSize || 0.01),
          currencyId: currency.id,
        },
        include: {
          assetClass: true,
          currency: true,
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
    const instrument = await prisma.instrument.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(lotSize ? { lotSize: toDecimal(lotSize) } : {}),
        ...(tickSize ? { tickSize: toDecimal(tickSize) } : {}),
      },
      include: {
        assetClass: true,
        currency: true,
      },
    })

    res.json(instrument)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
