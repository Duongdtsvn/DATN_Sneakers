import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { FiTag, FiCopy, FiX } from 'react-icons/fi'

const CouponPopup = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false) // Ban đầu không hiện
  const [isExiting, setIsExiting] = useState(false)
  const couponCode = 'FREESHIP'
  const couponCount = 3

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setIsVisible(true)
    }, 4000)
    return () => clearTimeout(initialTimer)
  }, [])

  // Logic hiện lại sau 30 giây khi đóng
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(true)
        setIsExiting(false)
      }, 30000) // 30 giây sau hiện lại
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
    }, 500)
  }

  const handleCopyCode = () => {
    navigator.clipboard
      .writeText(couponCode)
      .then(() => {
        toast.success(t('code_copied', { code: couponCode }), { autoClose: 2000 })
      })
      .catch(() => {
        toast.error(t('copy_failed'), { autoClose: 2000 })
      })
  }

  const handleViewMore = () => {
    toast.error(t('tham_lam'), { autoClose: 2000 })
  }

  const handleSnooze = () => {
    console.log('Snooze for 3 hours clicked')
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
    }, 500)
  }

  return (
    <div className='fixed top-4 right-4 z-50 mt-[200px]'>
      {isVisible && (
        <div
          className={`bg-white shadow-lg rounded-lg p-4 max-w-sm ${
            isExiting ? 'animate-slide-down' : 'animate-slide-up'
          }`}
        >
          <div className='flex justify-between items-center mb-3'>
            <div className='flex items-center gap-2'>
              <FiTag className='text-pink-500 text-xl' />
              <span className='text-lg font-bold text-red-500'>PoleSneakers</span>
            </div>
            <button onClick={handleClose} className='text-gray-500 hover:text-gray-700'>
              <FiX className='text-lg' />
            </button>
          </div>

          {/* Tiêu đề số lượng coupon */}
          <h2 className='text-lg font-bold text-gray-800 mb-2'>{t('coupons_found', { count: couponCount })}</h2>

          {/* Thông tin tỷ lệ thành công */}
          <div className='flex justify-between items-center text-sm text-gray-600 mb-3'>
            <span>{t('coupon_success_rate')}</span>
            <span className='text-orange-500 font-semibold'>{t('high')}</span>
          </div>

          {/* Mã giảm giá */}
          <div
            className='bg-orange-100 border border-dashed border-orange-300 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-orange-200 transition'
            onClick={handleCopyCode}
          >
            <div>
              <p className='text-lg font-bold text-gray-800'>{couponCode}</p>
              <p className='text-xs text-gray-500'>{t('worked_2_hrs_ago')}</p>
            </div>
            <div className='flex items-center gap-1 text-orange-500'>
              <span className='text-sm font-semibold'>73% {t('success')}</span>
              <FiCopy className='text-lg' />
            </div>
          </div>

          <button
            onClick={handleViewMore}
            className='w-full mt-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-semibold py-2 rounded-full hover:from-orange-500 hover:to-pink-600 transition'
          >
            {t('view_more_codes')}
          </button>

          <button onClick={handleSnooze} className='w-full mt-2 text-gray-500 text-sm underline hover:text-gray-700'>
            {t('snooze_for_3_hours')}
          </button>
        </div>
      )}
    </div>
  )
}

export default CouponPopup
