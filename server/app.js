import dotenv from 'dotenv'
dotenv.config({ silent: true })
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import routes from './routes/router.js'
const app = express()
app.use(
  cors({
    origin: [
      'http://localhost:3000',
    ],
    credentials: true,
  }),
)

// Increase payload size limit for image uploads
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())
app.use(routes)

const PORT = process.env.PORT || 3001

// For local development
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

// Export for Vercel
export default app
