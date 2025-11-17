// server/routes/predictionRoutes.js
import express from 'express'
import { getPredictions, getBatchPredictions } from '../controllers/predictions.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// All prediction routes require authentication
router.use(authenticateToken)

// Get predictions for a specific instrument
router.get('/:instrumentId', getPredictions)

// Get predictions for multiple instruments
router.post('/batch', getBatchPredictions)

export default router
