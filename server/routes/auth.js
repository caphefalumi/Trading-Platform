import express from 'express'
import { localRegister, localLogin } from '../scripts/authentication.js'

const router = express.Router()

// Register route
router.post('/register', localRegister)

// Login route
router.post('/login', localLogin)

export default router
