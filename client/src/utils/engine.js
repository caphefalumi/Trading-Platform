// Simple frontend engine API wrapper
import apiClient from './api'

export async function submitOrder(orderData) {
  // orderData should match backend expected fields
  try {
    const response = await apiClient.post('/engine/order', orderData)
    return response.data
  } catch (error) {
    // Handle error (show feedback, etc)
    throw error.response?.data || error
  }
}

// Example usage in a component:
// import { submitOrder } from '@/utils/engine'
// await submitOrder({ ...orderFields })
