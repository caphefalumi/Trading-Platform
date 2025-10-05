import express from 'express'
import authRoutes from './authRoutes.js'
import tradingRoutes from './tradingRoutes.js'
import accountRoutes from './accountRoutes.js'

const router = express.Router()

router.use('/api/auth', authRoutes)
router.use('/api', tradingRoutes)
router.use('/api', accountRoutes)

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export default router
