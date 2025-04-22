import { PaginatedOrders } from '../types/order'
import { toast } from 'react-toastify'

export const getOrders = async (
  page: number = 1,
  status: string = '',
  t: (key: string) => string
): Promise<PaginatedOrders> => {
  try {
    const token = localStorage.getItem('token')
    console.log('API Token:', token ? 'Present' : 'Missing')
    if (!token) {
      throw new Error(t('no_token'))
    }

    const url = `http://localhost:8000/api/orders?page=${page}${status ? `&status=${status}` : ''}`
    console.log('Fetching orders:', url)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API Error Response:', errorData)
      throw new Error(errorData.message || `${t('fetch_error')}: ${response.status}`)
    }

    const data = await response.json()
    console.log('API Response:', data)

    // Kiểm tra format
    if (!data || !Array.isArray(data.data)) {
      console.error('Invalid API response format:', data)
      throw new Error(t('invalid_response'))
    }

    return {
      data: data.data || [],
      links: data.links || { first: '', last: '', prev: null, next: null },
      meta: data.meta || {
        current_page: 1,
        from: 1,
        last_page: 1,
        path: '',
        per_page: 10,
        to: 0,
        total: 0
      }
    }
  } catch (error) {
    console.error('Get orders error:', error)
    toast.error(error.message || t('fetch_error'), { autoClose: 2000 })
    throw error
  }
}

export const cancelOrder = async (
  orderId: number,
  reason: string,
  t: (key: string) => string
): Promise<{ message: string }> => {
  try {
    const token = localStorage.getItem('token')
    console.log('API Token for cancel:', token ? 'Present' : 'Missing')
    if (!token) {
      throw new Error(t('no_token'))
    }

    const response = await fetch(`http://localhost:8000/api/orders/${orderId}/request-cancellation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ cancellation_reason: reason })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Cancel API Error:', errorData)
      throw new Error(errorData.message || `${t('update_error')}: ${response.status}`)
    }

    const data = await response.json()
    console.log('Cancel order response:', data)
    return data
  } catch (error) {
    console.error('Cancel order error:', error)
    toast.error(error.message || t('update_error'), { autoClose: 2000 })
    throw error
  }
}
