import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma.js'
import { Prisma } from '@prisma/client'
import { createSession, deleteSession } from '../utils/session.js'

// Input validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password) => {
  // At least 8 characters
  return password && password.length >= 8
}

const validateAccountName = (name) => {
  return name && name.trim().length >= 2
}

export const register = async (req, res) => {
  const { email, accountName, password } = req.body

  // Validate required fields
  if (!email || !accountName || !password) {
    return res.status(400).json({
      error: 'All fields are required.',
      fields: { email: !email, accountName: !accountName, password: !password },
    })
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      error: 'Please enter a valid email address.',
      fields: { email: true },
    })
  }

  // Validate account name
  if (!validateAccountName(accountName)) {
    return res.status(400).json({
      error: 'Account name must be at least 2 characters long.',
      fields: { accountName: true },
    })
  }

  // Validate password strength
  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long.',
      fields: { password: true },
    })
  }

  try {
    // Check if email already exists
    const existingAccount = await prisma.account.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingAccount) {
      return res.status(400).json({
        error: 'An account with this email already exists.',
        fields: { email: true },
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Get default currency
    const currency = await prisma.currency.findUnique({
      where: { code: 'USDT' },
    })

    if (!currency) {
      return res.status(500).json({
        error: 'System configuration error. Please contact support.',
      })
    }

    // Create account and balance in transaction
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          accountName: accountName.trim(),
          currencyId: currency.id,
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

    res.status(201).json({
      success: 'Account created successfully. You can now log in.',
    })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({
      error: 'An error occurred during registration. Please try again.',
    })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.',
      fields: { email: !email, password: !password },
    })
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      error: 'Please enter a valid email 123 address.',
      fields: { email: true },
    })
  }

  try {
    const account = await prisma.account.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        accountName: true,
        password: true,
        createdAt: true,
      },
    })

    if (!account) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      })
    }
    const isMatch = await bcrypt.compare(password, account.password)
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      })
    } // Create session
    const session = await createSession(account.id)
    res.cookie('sessionId', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })

    return res.status(200).json({
      success: 'Login successful',
      account: session.account,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'An error occurred during login. Please try again.',
    })
  }
}
export const oauthGoogle = async (req, res) => {
  const googleIdToken = req.body.token
  if (!googleIdToken) {
    return res.status(400).json({ error: 'No ID token provided' })
  }

  try {
    // Verify the Google ID token by calling Google's tokeninfo endpoint
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'GET',
      headers: { Authorization: `Bearer ${googleIdToken}` },
    })

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google token' })
    }

    const googleUser = await response.json()

    const { email, name } = googleUser

    let account = await prisma.account.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!account) {
      // Get default currency
      const currency = await prisma.currency.findUnique({
        where: { code: 'USDT' },
      })

      if (!currency) {
        return res.status(500).json({
          error: 'System configuration error. Please contact support.',
        })
      }

      // Create account with OAuth
      await prisma.$transaction(async (tx) => {
        account = await tx.account.create({
          data: {
            email: email.toLowerCase(),
            accountName: name || email.split('@')[0],
            currencyId: currency.id,
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
    }

    const session = await createSession(account.id)
    res.cookie('sessionId', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })

    return res.status(200).json({
      success: 'Login successful',
      account: session.account,
    })
  } catch (error) {
    console.error('OAuth Google error:', error)
    res.status(500).json({
      error: 'An error occurred during OAuth login. Please try again.',
    })
  }
}
export const logout = async (req, res) => {
  try {
    const token = req.cookies.sessionId

    if (token) {
      await deleteSession(token)
    }

    // Clear the cookie
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    })

    return res.status(200).json({
      success: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      error: 'An error occurred during logout.',
    })
  }
}

export const getCurrentAccount = async (req, res) => {
  try {
    // Account is attached by middleware
    if (!req.account) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    return res.status(200).json({
      account: req.account,
    })
  } catch (error) {
    console.error('Get current account error:', error)
    res.status(500).json({
      error: 'An error occurred.',
    })
  }
}
