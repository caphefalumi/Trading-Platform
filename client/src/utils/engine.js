// Simple frontend order submission API wrapper
import apiClient from './api'

export async function submitOrder(orderData) {
  // orderData should match backend expected fields
  // Use the public /api/orders endpoint instead of internal /api/engines/order
  try {
    const response = await apiClient.post('/api/orders', orderData)
    return response.data
  } catch (error) {
    // Handle error (show feedback, etc)
    console.error('Order submission error:', error.response?.data || error)
    throw error.response?.data || error
  }
}

// Example usage in a component:
// import { submitOrder } from '@/utils/engine'
// await submitOrder({ 
//   accountId: 'account-id',
//   instrumentId: 'instrument-id',
//   side: 'BUY' or 'SELL',
//   type: 'LIMIT' or 'MARKET',
//   quantity: 1.5,
//   price: 50000 (for LIMIT orders),
//   timeInForce: 'GTC' or 'IOC'
// })
