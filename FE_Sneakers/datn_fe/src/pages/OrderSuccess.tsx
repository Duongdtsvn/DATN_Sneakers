import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { useCart } from '../contexts/CartContext'
import axios from 'axios'

interface OrderSuccessState {
  orderCode: string
  status: 'success' | 'failed'
  message: string
  purchased_items?: any[]
}

const OrderSuccess: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { fetchCartCount } = useCart()
  const state = location.state as OrderSuccessState

  const isSuccess = state?.status === 'success'

  useEffect(() => {
    if (isSuccess) {
      fetchCartCount()
    }
  }, [isSuccess, fetchCartCount])

  const handleContinueShopping = () => {
    navigate('/')
  }

  const handleViewOrders = () => {
    navigate('/account/orders')
  }

  if (!state) {
    navigate('/')
    return null
  }

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12'>
      <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center'>
        {isSuccess ? (
          <CheckCircleIcon className='mx-auto h-16 w-16 text-green-500' />
        ) : (
          <XCircleIcon className='mx-auto h-16 w-16 text-red-500' />
        )}

        <h2 className={`mt-4 text-2xl font-bold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          {isSuccess ? t('payment_successful') : t('payment_failed')}
        </h2>

        <p className='mt-2 text-gray-600'>{state.message}</p>

        {state.orderCode && (
          <p className='mt-4 text-sm text-gray-500'>
            {t('order_code')}: <span className='font-medium'>{state.orderCode}</span>
          </p>
        )}

        <div className='mt-8 space-y-3'>
          {isSuccess && (
            <button
              onClick={handleViewOrders}
              className='w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors'
            >
              {t('view_orders')}
            </button>
          )}

          <button
            onClick={handleContinueShopping}
            className={`w-full ${
              isSuccess
                ? 'border border-blue-500 text-blue-500 hover:bg-blue-50'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } py-2 px-4 rounded-md transition-colors`}
          >
            {t('continue_shopping')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess
