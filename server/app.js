import dotenv from 'dotenv'
dotenv.config({ silent: true })
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'
const app = express()
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://tm-project-weld.vercel.app',
    ],
    credentials: true,
  }),
)

// Increase payload size limit for image uploads
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())
app.use('/', authRoutes)

const PORT = process.env.PORT || 3001

// For local development
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

// Export for Vercel
export default app
