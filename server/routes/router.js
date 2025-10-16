import express from 'express'
import authRoutes from './authRoutes.js'
import accountRoutes from './accountRoutes.js'
import instrumentRoutes from './instrumentRoutes.js'
import orderRoutes from './orderRoutes.js'
import engineRoutes from './engineRoutes.js'
const router = express.Router()

router.use('/api/auth', authRoutes)
router.use('/api/accounts', accountRoutes)
router.use('/api/instruments', instrumentRoutes)
router.use('/api/orders', orderRoutes)
router.use('/api/engines', engineRoutes)
router.use('/instruments', instrumentRoutes)
export default router
