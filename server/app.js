import dotenv from 'dotenv'
dotenv.config({ silent: true })
import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import routes from './routes/router.js'
import cryptoRoutes from "./routes/crypto.js"; // Import the crypto routes
import engineRoutes from './routes/engineRoutes.js' // Import the engine routes
import proxyRoutes from './routes/proxyRoutes.js' // Import the proxy routes
import { ensureReferenceData } from './utils/referenceData.js'
import marketDataAgent from './services/marketDataAgent.js'
import websocketService from './services/websocket.js'

const app = express()
const httpServer = createServer(app)
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  }),
)

// Increase payload size limit for image uploads
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())
app.use("/api/crypto", cryptoRoutes); //Added code line
app.use('/api/engine', engineRoutes) //Added code line
app.use(proxyRoutes) //Added code line
app.use(routes)

const PORT = process.env.PORT || 3001

if (process.env.NODE_ENV !== 'test') {
  ensureReferenceData()
    .then(() => {
      httpServer.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`)
        
        // Initialize WebSocket service
        websocketService.initialize(httpServer)
        
        // Start market data agent
        marketDataAgent.start()
      })
    })
    .catch((error) => {
      console.error('Failed to prepare reference data', error)
      process.exit(1)
    })

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutdown signal received: closing server...')
    marketDataAgent.stop()
    websocketService.stop()
    httpServer.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

export default app
