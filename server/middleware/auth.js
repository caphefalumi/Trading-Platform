import { validateSession } from '../utils/session.js'

// Middleware to require authentication
export const requireAuth = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies?.sessionId

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const session = await validateSession(token)

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    // Attach account and session to request
    req.account = session.account
    req.session = session

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication error' })
  }
}

// Middleware to optionally attach account if authenticated
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.sessionId

    if (token) {
      const session = await validateSession(token)
      if (session) {
        req.account = session.account
        req.session = session
      }
    }

    next()
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    next()
  }
}
