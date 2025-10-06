import express from 'express'
import { createInstrument, listInstruments, updateInstrument } from '../controllers/instruments.js'

const router = express.Router()

router.get('/', listInstruments)
router.post('/', createInstrument)
router.put('/:id', updateInstrument)

export default router
