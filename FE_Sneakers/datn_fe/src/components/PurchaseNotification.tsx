import { useState, useEffect } from 'react'

interface Notification {
  id: number
  buyerName: string
  productName: string
  productCode: string
  imageUrl: string
  timeAgo: string
}

const PurchaseNotification = () => {
  const notifications: Notification[] = [
    {
      id: 1,
      buyerName: 'Bùi Lê Hoàng Anh',
      productName: "Giày Onitsuka Tiger Runspark 'White Silver'",
      productCode: '1183B480-104',
      imageUrl:
        'https://scontent.fhan2-4.fna.fbcdn.net/v/t39.30808-6/482022875_629774439804638_5144918694120527923_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEvOhuKWRVHXFN9JBWxcJTh1_t8k_MqJWfX-3yT8yolZ0MhiCSvnh2xKfyVFnpxwCjGJ1vpUDP2xU7BrcFY_zEG&_nc_ohc=6w-7gkLhURkQ7kNvwGAja-J&_nc_oc=AdlWbPmwzN_6v3V1tVKWBzJ7sHiJuoCRcyWKEYOYn_Dz5aYLbE47x2oz4w_EynrVVFU&_nc_zt=23&_nc_ht=scontent.fhan2-4.fna&_nc_gid=Xu6C_5dLes7rtqcNN7VHkA&oh=00_AfF_6cYUdYmQZwz7x-jl9iVddFgInTleLMKuDKU1qKBRnw&oe=680D4E22', // Thay bằng URL ảnh thực tế
      timeAgo: '20 phút trước'
    },
    {
      id: 2,
      buyerName: 'Bùi Lê Hoàng Em',
      productName: 'Giày Nike Air Max 270',
      productCode: 'AH8050-005',
      imageUrl:
        'https://scontent.fhan2-4.fna.fbcdn.net/v/t39.30808-6/480919772_618912754224140_4071766667382725914_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeFpQaFjRTytxlQh__ExW3HtWJ00j9iGteJYnTSP2Ia14gr_z7T0jPnT7jsxNm6oJpRCu9_6cL0_1FLB7MerEeIk&_nc_ohc=iErft5bQFrgQ7kNvwHck3Zh&_nc_oc=Adla7SUyh_T9-Wv1prsd32VbDUig5FH-K1BXaSJRh3v5Vkf2Y8VJgsxBM622zeLn7Qg&_nc_zt=23&_nc_ht=scontent.fhan2-4.fna&_nc_gid=wrDwIdsJfKSr7qmXpw5I_g&oh=00_AfHaAGIvz2snMdHL_LuXVYALE6r8yfcMqkj9bMh1R38UGQ&oe=680D4A9C',
      timeAgo: '15 phút trước'
    },
    {
      id: 3,
      buyerName: 'Hoàng Anh Bùi Lê',
      productName: 'Giày Adidas Ultraboost 21',
      productCode: 'FY0378',
      imageUrl:
        'https://scontent.fhan2-3.fna.fbcdn.net/v/t39.30808-6/476955548_615781651203917_6796695433879999204_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeHCsxSQXslfWkdxHIAhN27mnFRBU7yCBgmcVEFTvIIGCS8MSBNZw7r1rjaiYHuGbsQsDniyVnc2W58AUCORoegI&_nc_ohc=u4WO8pqxIpIQ7kNvwHUpqD_&_nc_oc=AdnhWAr6ZUeDtqAQKjbyV5Gy8OQrsYpbb5eF-X31rMBnofNWhFg0fUkZVtdOq__NMog&_nc_zt=23&_nc_ht=scontent.fhan2-3.fna&_nc_gid=4GdlqVNO0LKfR-G1HS5kuA&oh=00_AfGnMla9JJebwma_E39h6TjZcjoMdC7n4QE_xU1Jye_OQQ&oe=680D618D',
      timeAgo: '10 phút trước'
    },
    {
      id: 4,
      buyerName: 'Hoàng Em Bùi LÊ',
      productName: 'Giày Puma RS-X3',
      productCode: '374665-01',
      imageUrl:
        'https://scontent.fhan2-4.fna.fbcdn.net/v/t39.30808-6/481666033_623215200460562_1341137909980728360_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeHciWly1rxbraqPpcQkWuRQXHmPUuGz2GdceY9S4bPYZ0DC8ar3MoIYqVWINX-Jch9Ep40HUza6AE_8eeGAbs2u&_nc_ohc=q3selpd_sOcQ7kNvwF0-ptD&_nc_oc=AdnqA41-v-6gJ2PugfcmqyxUD1j1W8yf9aFwQAmffw_sZEYflN5AcwsSrGo1mOc-PQw&_nc_zt=23&_nc_ht=scontent.fhan2-4.fna&_nc_gid=30n9iZyYTCRtpFv4TFoIJQ&oh=00_AfFG9Ev8bYCybdg0pE97osju2dAjOm5XkEjvKtJ8WFXKJw&oe=680D667A',
      timeAgo: '5 phút trước'
    }
  ]

  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentNotificationIndex((prevIndex) => (prevIndex + 1) % notifications.length)
        setIsVisible(true)
      }, 500)
    }, 3000)

    return () => clearInterval(interval)
  }, [notifications.length])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setCurrentNotificationIndex((prevIndex) => (prevIndex + 1) % notifications.length)
      setIsVisible(true)
    }, 500)
  }

  const currentNotification = notifications[currentNotificationIndex]

  return (
    <div className='fixed bottom-4 left-4 z-50'>
      {isVisible && (
        <div className='flex items-center bg-white shadow-lg rounded-lg p-3 max-w-sm animate-slide-up'>
          <img
            src={currentNotification.imageUrl}
            alt={currentNotification.productName}
            className='w-16 h-16 object-cover rounded-md mr-3'
          />

          <div className='flex-1'>
            <p className='text-sm font-semibold text-gray-800'>{currentNotification.buyerName}</p>
            <p className='text-xs text-gray-500'>vừa mua</p>
            <p className='text-sm font-semibold text-gray-800'>
              {currentNotification.productName} {currentNotification.productCode}
            </p>
            <p className='text-xs text-gray-500'>{currentNotification.timeAgo}</p>
          </div>

          <button onClick={handleClose} className='ml-3 text-gray-500 hover:text-gray-700'>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default PurchaseNotification
