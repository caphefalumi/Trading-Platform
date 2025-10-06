import express from 'express'
import {
  register,
  login,
  oauthGoogle,
  logout,
  getCurrentAccount,
} from '../controllers/authentication.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Register route - POST /api/auth/register
router.post('/register', register)

// Login route - POST /api/auth/login
router.post('/login', login)

router.post('/oauth/google', oauthGoogle)
// Logout route - POST /api/auth/logout
router.post('/logout', logout)

// Get current account - GET /api/auth/me
router.get('/me', requireAuth, getCurrentAccount)

export default router
