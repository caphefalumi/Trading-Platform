import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma.js'
import { Prisma } from '@prisma/client'

const localRegister = async (req, res) => {
  const { email, username, password } = req.body
  const provider = 'local'

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' })
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    })

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already exists.' })
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already exists.' })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          provider,
        },
      })

      const currency = await tx.currency.findUnique({ where: { code: 'USDT' } })
      if (!currency) {
        throw new Error('Default currency not configured')
      }

      const account = await tx.account.create({
        data: {
          userId: user.id,
          accountName: `${username} Primary`,
          currencyId: currency.id,
          isPrimary: true,
        },
      })

      await tx.accountBalance.create({
        data: {
          accountId: account.id,
          currencyId: currency.id,
          available: new Prisma.Decimal(0),
          reserved: new Prisma.Decimal(0),
          total: new Prisma.Decimal(0),
        },
      })
    })

    res.status(201).json({ success: 'Account created.' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const localLogin = async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' })
    }

    return res.status(200).json({
      success: 'User is authorized',
      user: {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export { localRegister, localLogin }
