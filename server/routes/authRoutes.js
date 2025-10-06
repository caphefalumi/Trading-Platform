import express from 'express'
import { register, login, logout, getCurrentAccount } from '../controllers/authentication.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Register route - POST /api/auth/register
router.post('/register', register)

// Login route - POST /api/auth/login
router.post('/login', login)

// Logout route - POST /api/auth/logout
router.post('/logout', logout)

// Get current account - GET /api/auth/me
router.get('/me', requireAuth, getCurrentAccount)

export default router
