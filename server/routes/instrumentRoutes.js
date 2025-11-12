import express from 'express'
import prisma from '../utils/prisma.js'

const router = express.Router()

// GET /instruments - list all instruments
router.get('/', async (req, res) => {
  try {
    const instruments = await prisma.instruments.findMany({})
    res.json(instruments)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch instruments.' })
  }
})

export default router
