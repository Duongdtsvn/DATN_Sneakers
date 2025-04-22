import React, { useState } from 'react'
import CancelOrderModal from './CancelOrderModal'
import { Order } from '../types/order'
import { useTranslation } from 'react-i18next'

interface OrderItemProps {
  order: Order
  onCancel: (orderId: number, reason: string) => void
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onCancel }) => {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const canCancel = order?.status && ['cho_xac_nhan', 'dang_chuan_bi'].includes(order.status)
  const isPendingCancellation = order?.status === 'cho_xac_nhan_huy'

  if (!order) {
    console.error('OrderItem: Invalid order data')
    return null
  }

  // console.log('OrderItem rendered, order:', order.order_code)
  return (
    <div className='flex flex-col border border-gray-300 rounded-lg p-4 mb-4 bg-white shadow-sm'>
      <div className='flex items-center gap-4'>
        <div className='flex-1 space-y-1'>
          <p className='font-semibold text-gray-800'>
            {t('order_code')}: {order.order_code || 'N/A'}
          </p>
          <p className='text-gray-600 text-sm'>
            {t('order_date')}: {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : 'N/A'}
          </p>
          <p className='text-gray-600 text-sm'>
            {t('total_price')}: {order.total_price ? order.total_price.toLocaleString('vi-VN') : '0'} VNĐ
          </p>
          <p className='text-gray-600 text-sm'>
            {t('status')}:{' '}
            <span className={`font-medium ${order.status === 'huy_don_hang' ? 'text-red-500' : 'text-blue-600'}`}>
              {order.status ? t(order.status) : 'N/A'}
            </span>
          </p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm'
          >
            {isExpanded ? t('collapse') : t('details')}
          </button>
          {canCancel && (
            <button
              onClick={() => setIsModalOpen(true)}
              className='px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm'
            >
              {t('cancel')}
            </button>
          )}
          {isPendingCancellation && (
            <span className='px-3 py-1 bg-yellow-500 text-white rounded-md text-sm'>{t('pending_cancellation')}</span>
          )}
        </div>
      </div>

      <CancelOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onCancel}
        orderId={order.id}
      />

      {isExpanded && (
        <div className='mt-4 border-t border-gray-200 pt-4'>
          <p className='text-gray-700'>
            <strong>{t('recipient_name')}:</strong> {order.recipient_name || 'N/A'}
          </p>
          <p className='text-gray-700'>
            <strong>{t('recipient_phone')}:</strong> {order.recipient_phone || 'N/A'}
          </p>
          <p className='text-gray-700'>
            <strong>{t('recipient_address')}:</strong> {order.recipient_address || 'N/A'}
          </p>
          <p className='text-gray-700'>
            <strong>{t('shipping_fee')}:</strong>{' '}
            {order.shipping_fee ? order.shipping_fee.toLocaleString('vi-VN') : '0'} VNĐ
          </p>
          <p className='text-gray-700'>
            <strong>{t('promotion')}:</strong> {order.promotion ? order.promotion.toLocaleString('vi-VN') : '0'} VNĐ
          </p>
          <h4 className='mt-2 font-semibold text-gray-800'>{t('products')}:</h4>
          <ul className='mt-2 space-y-2'>
            {(order.order_details || []).map((detail) => (
              <li key={detail.id} className='flex items-center gap-4'>
                <img
                  src={detail.image_url || 'https://via.placeholder.com/48'}
                  alt={detail.product_name || 'Product'}
                  className='w-12 h-12 object-cover rounded border border-gray-300'
                />
                <div>
                  <p className='text-gray-800'>{detail.product_name || 'N/A'}</p>
                  <p className='text-gray-600 text-sm'>
                    {t('size')}: {detail.size || 'N/A'} | {t('quantity')}: {detail.quantity || 0} | {t('price')}:{' '}
                    {detail.price ? detail.price.toLocaleString('vi-VN') : '0'} VNĐ
                  </p>
                </div>
              </li>
            ))}
            {(!order.order_details || order.order_details.length === 0) && (
              <li className='text-gray-500'>{t('no_products')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default OrderItem
