import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Gán Pusher vào window để Laravel Echo sử dụng
window.Pusher = Pusher

const echo = new Echo({
  broadcaster: 'pusher',
  key: 'c1c7ff3f6141d637ab84',
  cluster: 'ap1',
  forceTLS: true,
  authEndpoint: 'http://localhost:8000/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }
})

// Kiểm tra token trước khi connect
const connectWithRetry = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    console.error('No token found, cannot connect to Pusher')
    return
  }

  console.log('Initializing Pusher connection...')
  echo.connect()

  echo.connector.pusher.bind('error', (err: any) => {
    console.error('Pusher error:', err)
    if (err.error?.data?.code === -1) {
      console.error('Pusher auth failed, retrying in 3s...')
      setTimeout(connectWithRetry, 3000)
    }
  })
}

// Khởi động kết nối
connectWithRetry()

export default echo
