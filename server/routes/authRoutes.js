import express from 'express'
import { localRegister, localLogin } from '../controllers/authentication.js'

const router = express.Router()

// Register route
router.post('/register', localRegister)

router.post('/login', localLogin)

export default router
