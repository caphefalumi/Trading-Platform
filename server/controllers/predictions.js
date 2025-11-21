// server/controllers/predictions.js
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import prisma from '../utils/prisma.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Python executable path - update this if needed
const PYTHON_PATH = process.env.PYTHON_PATH || 'C:\\Users\\Admin\\AppData\\Local\\Programs\\Python\\Python313\\python.exe'

/**
 * Execute Python LSTM prediction script
 * @returns {Promise<Object>} Prediction results from trained LSTM model
 */
function executeLSTMPrediction() {
  return new Promise((resolve, reject) => {
    // Path to the Python script
    const scriptPath = path.join(__dirname, '../../trading_bot/src/api_predict.py')

    // Spawn Python process with correct Python path
    const pythonProcess = spawn(PYTHON_PATH, [scriptPath])

    let outputData = ''
    let errorData = ''

    // Collect stdout data
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString()
      console.log('Python stdout:', data.toString())
    })

    // Collect stderr data
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString()
      console.error('Python stderr:', data.toString())
    })

    // Handle process completion
    pythonProcess.on('close', (code) => {
      console.log('Python process exited with code:', code)
      console.log('Output data length:', outputData.length)
      console.log('Error data length:', errorData.length)

      if (code !== 0) {
        console.error('Python LSTM prediction error:', errorData)
        console.error('Python stdout was:', outputData)
        reject(new Error(errorData || outputData || 'Python LSTM prediction script failed'))
        return
      }

      try {
        const result = JSON.parse(outputData)
        if (!result.success) {
          reject(new Error(result.error || 'Prediction failed'))
          return
        }
        resolve(result)
      } catch (error) {
        console.error('Failed to parse output:', outputData)
        reject(new Error(`Failed to parse Python output: ${error.message}`))
      }
    })

    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('Failed to spawn Python process:', error)
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
  })
}

/**
 * GET /api/predictions/:instrumentId
 * Get LSTM price predictions for Bitcoin
 * Currently only supports BTCUSDT
 */
export const getPredictions = async (req, res) => {
  try {
    const { instrumentId } = req.params

    // Get instrument details
    const instrument = await prisma.instrument.findUnique({
      where: { id: instrumentId }
    })

    if (!instrument) {
      return res.status(404).json({
        success: false,
        error: 'Instrument not found'
      })
    }

    // Check if this is Bitcoin - support both BTCUSDT and BTC-USD symbols
    const isBTC = instrument.symbol === 'BTCUSDT' || instrument.symbol === 'BTC-USD' || instrument.symbol === 'BTCUSD'

    if (!isBTC) {
      return res.status(400).json({
        success: false,
        error: 'LSTM predictions currently only available for Bitcoin',
        message: 'This prediction model is trained specifically for Bitcoin. Other instruments are not yet supported.',
        supportedSymbols: ['BTCUSDT', 'BTC-USD', 'BTCUSD']
      })
    }

    // Execute LSTM prediction
    const predictions = await executeLSTMPrediction()

    // Add instrument information to response
    const response = {
      ...predictions,
      instrument: {
        id: instrument.id,
        symbol: instrument.symbol,
        name: instrument.name
      }
    }

    res.json(response)

  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate predictions'
    })
  }
}

/**
 * POST /api/predictions/batch
 * Get predictions for multiple instruments
 * Note: Currently only Bitcoin is supported by the LSTM model
 */
export const getBatchPredictions = async (req, res) => {
  try {
    const { instrumentIds } = req.body

    if (!Array.isArray(instrumentIds) || instrumentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'instrumentIds array is required'
      })
    }

    // Get all instruments
    const instruments = await prisma.instrument.findMany({
      where: {
        id: { in: instrumentIds }
      }
    })

    const results = []

    // Process each instrument
    for (const instrument of instruments) {
      // Check if this is Bitcoin
      const isBTC = instrument.symbol === 'BTCUSDT' || instrument.symbol === 'BTC-USD' || instrument.symbol === 'BTCUSD'

      if (isBTC) {
        // Use LSTM prediction for Bitcoin
        try {
          const predictions = await executeLSTMPrediction()
          results.push({
            instrumentId: instrument.id,
            symbol: instrument.symbol,
            ...predictions
          })
        } catch (error) {
          results.push({
            instrumentId: instrument.id,
            symbol: instrument.symbol,
            success: false,
            error: error.message
          })
        }
      } else {
        // Other instruments not supported yet
        results.push({
          instrumentId: instrument.id,
          symbol: instrument.symbol,
          success: false,
          error: 'LSTM predictions only available for Bitcoin',
          supportedSymbols: ['BTCUSDT', 'BTC-USD', 'BTCUSD']
        })
      }
    }

    res.json({
      success: true,
      predictions: results
    })

  } catch (error) {
    console.error('Batch prediction error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate batch predictions'
    })
  }
}
