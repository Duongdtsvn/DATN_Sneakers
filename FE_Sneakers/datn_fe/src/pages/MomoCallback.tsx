import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { useCart } from '../contexts/CartContext'

const MomoCallback: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { fetchCartCount } = useCart()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error(t('no_token'))

        const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder') || '{}')
        const { orderId, resultCode } = pendingOrder

        if (resultCode === '0') {
          // Payment successful - create orders
          const orderPromises = pendingOrder.products.map(async (product: any) => {
            const selectedSizeObj = product.sizes?.find((s: any) => s.size === (product.variant || product.size))
            if (!selectedSizeObj) {
              throw new Error(`Size ${product.variant || product.size} not found for product ${product.name}`)
            }

            return axios.post(
              `http://localhost:8000/api/orders/buy/${encodeURIComponent(product.name)}`,
              {
                shipping_info: pendingOrder.shippingInfo,
                quantity: product.quantity,
                product_size_id: selectedSizeObj.product_size_id,
                payment_method: 'momo',
                status: 'paid',
                momo_order_id: orderId
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
          })

          await Promise.all(orderPromises)

          // Update cart count immediately after successful payment
          await fetchCartCount()

          toast.success(t('payment_successful'), { autoClose: 2000 })
          localStorage.removeItem('pendingOrder')
          navigate('/order-success', {
            state: {
              orderCode: orderId,
              status: 'success',
              message: t('payment_successful')
            }
          })
        } else {
          // Payment failed
          toast.error(t('payment_failed'), { autoClose: 2000 })
          navigate('/order-success', {
            state: {
              orderCode: orderId,
              status: 'failed',
              message: t('payment_failed')
            }
          })
        }
      } catch (error: any) {
        console.error('Error processing MoMo callback:', error)
        toast.error(error.message || t('payment_processing_error'), { autoClose: 2000 })
        navigate('/cart')
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [location, navigate, t, fetchCartCount])

  return (
    <div className='min-h-screen bg-gray-100 font-sans flex flex-col items-center justify-center'>
      {isProcessing ? (
        <>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4'></div>
          <p className='text-gray-600'>{t('processing_payment')}</p>
        </>
      ) : (
        <p className='text-gray-600'>{t('redirecting')}</p>
      )}
    </div>
  )
}

export default MomoCallback
