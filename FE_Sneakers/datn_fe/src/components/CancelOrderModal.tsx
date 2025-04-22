import React, { useState } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'

Modal.setAppElement('#root')

interface CancelOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (orderId: number, reason: string) => void
  orderId: number
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ isOpen, onClose, onConfirm, orderId }) => {
  const { t } = useTranslation()
  const [reason, setReason] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError(t('cancellation_reason_required'))
      return
    }

    if (reason.trim().length < 10) {
      setError(t('cancellation_reason_min_length'))
      return
    }

    try {
      setIsLoading(true)
      setError('')
      await onConfirm(orderId, reason.trim())
      onClose()
    } catch (err) {
      setError(t('cancellation_failed'))
      console.error('Failed to cancel order:', err)
    } finally {
      setIsLoading(false)
    }
  }

  console.log('CancelOrderModal rendered, isOpen:', isOpen)
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className='bg-white p-6 rounded-lg max-w-md mx-auto mt-20'
      overlayClassName='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'
    >
      <h2 className='text-xl font-semibold mb-4'>{t('cancel_order')}</h2>
      <p className='mb-4'>{t('cancellation_warning')}</p>
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700'>Lý do hủy:</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className='mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500'
          placeholder={t('enter_cancellation_reason')}
        />
        {error && <p className='text-red-500 text-sm mt-1'>{error}</p>}
      </div>
      <div className='flex justify-end gap-2'>
        <button onClick={onClose} className='px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300'>
          {t('cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className='px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50'
        >
          {isLoading ? t('cancelling') : t('confirm_cancel')}
        </button>
      </div>
    </Modal>
  )
}

export default CancelOrderModal
