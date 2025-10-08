import crypto from 'crypto'
import prisma from './prisma.js'

// Session expiration: 7 days
const SESSION_EXPIRATION_DAYS = 7

// Generate a secure random session token
export const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Create a new session for an account
export const createSession = async (accountId) => {
  const token = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRATION_DAYS)

  const session = await prisma.session.create({
    data: {
      accountId,
      token,
      expiresAt,
    },
    include: {
      account: {
        select: {
          id: true,
          email: true,
          accountName: true,
          createdAt: true,
        },
      },
    },
  })

  return session
}

// Validate and retrieve session
export const validateSession = async (token) => {
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      account: {
        select: {
          id: true,
          email: true,
          accountName: true,
          createdAt: true,
        },
      },
    },
  })

  if (!session) return null

  // Check if session has expired
  if (new Date() > session.expiresAt) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  return session
}

// Delete a session (logout)
export const deleteSession = async (token) => {
  if (!token) return

  await prisma.session.deleteMany({
    where: { token },
  })
}

// Delete all sessions for an account
export const deleteAllAccountSessions = async (accountId) => {
  await prisma.session.deleteMany({
    where: { accountId },
  })
}

// Clean up expired sessions (can be run periodically)
export const cleanupExpiredSessions = async () => {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
  return result.count
}
