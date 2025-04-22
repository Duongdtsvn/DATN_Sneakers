import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiShoppingCart, FiUser, FiMenu, FiX, FiChevronDown, FiHeart } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import Search from './Search'
import { useCart } from '../contexts/CartContext'

interface User {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  image_user?: string
  role_id: number
}

const Header = () => {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileProductOpen, setMobileProductOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const { cartCount, updateCartCount } = useCart()
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('token')

  // Hàm lấy số lượng giỏ hàng từ API
  const fetchCartCount = async () => {
    if (!isLoggedIn) {
      updateCartCount(0)
      return
    }

    try {
      const response = await axios.get('http://localhost:8000/api/carts/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      const items = response.data.items || []
      const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      updateCartCount(totalItems)
    } catch (error: any) {
      console.error('Error fetching cart count:', error)
      updateCartCount(0)
    }
  }

  // Hàm lấy thông tin người dùng từ API
  const fetchUserInfo = async () => {
    if (!isLoggedIn) {
      setUser(null)
      return
    }

    const token = localStorage.getItem('token')

    try {
      const response = await axios.get('http://localhost:8000/api/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      let userData: any = response.data

      if (response.data.data) {
        userData = response.data.data
      } else if (response.data.user) {
        userData = response.data.user
      } else {
      }

      if (!userData) {
        setUser(null)
        return
      }

      const userName = userData.name || userData.full_name || userData.username || 'User'
      if (userName === 'User') {
        console.warn('[DEBUG] No name field found, falling back to "User"')
      } else {
        console.log('[DEBUG] Found name:', userName)
      }

      const roleId = Number(userData.role_id) || 3
      if (![1, 2, 3].includes(roleId)) {
        console.warn('[DEBUG] Invalid role_id:', roleId, 'Defaulting to 3')
      }

      const processedUser: User = {
        id: userData.id || 0,
        name: userName,
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        image_user: userData.image_user || '',
        role_id: roleId
      }

      setUser(processedUser)
      localStorage.setItem('user', JSON.stringify(processedUser))
    } catch (error: any) {
      console.error('[DEBUG] Error fetching user info:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      setUser(null)
      if (error.response?.status === 401) {
        localStorage.clear()
        toast.error(t('session_expired'), { autoClose: 1000 })
        navigate('/login')
      }
    }
  }

  // Hàm lấy số lượng sản phẩm trong wishlist từ localStorage
  const updateWishlistCount = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    setWishlistCount(wishlist.length)
  }

  // Gọi API và cập nhật wishlist khi component mount hoặc isLoggedIn thay đổi
  useEffect(() => {
    fetchCartCount()
    fetchUserInfo()
    updateWishlistCount()

    // Lắng nghe sự kiện storage để cập nhật wishlistCount khi localStorage thay đổi
    const handleStorageChange = () => {
      updateWishlistCount()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isLoggedIn])

  const handleLogout = () => {
    localStorage.clear()
    updateCartCount(0)
    setWishlistCount(0)
    setUser(null)
    toast.success(t('logout_success'), { autoClose: 1000 })
    navigate('/login')
    setMenuOpen(false)
  }

  const handleLinkClick = () => {
    setMenuOpen(false)
    setMobileProductOpen(false)
  }

  const text = 'PoleSneakers'

  return (
    <header className='bg-white shadow-md sticky top-0 z-50 p-2'>
      <div className='container mx-auto px-6 md:px-20 py-4 flex justify-between items-center'>
        <Link to='/' className='flex space-x-0.5 text-2xl font-serif font-bold tracking-wider'>
          {text.split('').map((char, index) => (
            <span
              key={index}
              className='text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 animate-blink'
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {char}
            </span>
          ))}
        </Link>

        <nav className='hidden md:flex space-x-8'>
          <Link to='/' className='nav-link'>
            {t('home')}
          </Link>
          <div className='relative group hidden md:block'>
            <button className='nav-link'>{t('products')}</button>
            <div className='absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300'>
              <Link to='/giay-nam' className='dropdown-link'>
                {t('men_shoes')}
              </Link>
              <Link to='/giay-nu' className='dropdown-link'>
                {t('women_shoes')}
              </Link>
            </div>
          </div>
          <Link to='/product-sale' className='nav-link'>
            {t('sale')}
          </Link>
          <Link to='/news' className='nav-link'>
            {t('news')}
          </Link>
          <Link to='/contact' className='nav-link'>
            {t('contact')}
          </Link>
        </nav>

        <div className='flex items-center space-x-4 md:space-x-6'>
          <div className='relative hidden md:block'>
            <Search value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {!isLoggedIn ? (
            <Link to='/login' className='icon-link'>
              <FiUser />
            </Link>
          ) : (
            <div className='relative group'>
              <div className='w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer'>
                <img
                  src={user?.image_user || 'https://m.yodycdn.com/blog/meme-ech-xanh-yody-vn-55.jpg'}
                  alt='Avatar'
                  className='w-full h-full rounded-full object-cover'
                />
              </div>
              <div className='absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300'>
                <p className='px-4 py-2 bg-gray-300 text-blue-600'>{t('greeting', { name: user?.name || 'User' })}</p>
                <Link to='/profile' className='dropdown-link'>
                  {t('profile')}
                </Link>
                <Link to='/orders' className='dropdown-link'>
                  {t('orders')}
                </Link>
                {(user?.role_id === 1 || user?.role_id === 2) && (
                  <a
                    href='http://datn_sneakers.test/admin'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='dropdown-link'
                  >
                    {t('Admin Dashboard')}
                  </a>
                )}
                <button onClick={handleLogout} className='w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100'>
                  {t('logout')}
                </button>
              </div>
            </div>
          )}

          <Link to='/wishlist' className='relative icon-link'>
            <FiHeart />
            {wishlistCount > 0 && (
              <span className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link to='/cart' className='relative icon-link'>
            <FiShoppingCart />
            {cartCount > 0 && (
              <span className='cart-badge absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                {cartCount}
              </span>
            )}
          </Link>

          <button onClick={() => setMenuOpen(!menuOpen)} className='md:hidden text-gray-600 text-2xl'>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className='md:hidden absolute top-16 left-0 w-full bg-white shadow-md py-4'
        >
          <nav className='flex flex-col space-y-4 px-6'>
            <Link to='/' className='mobile-nav-link' onClick={handleLinkClick}>
              {t('home')}
            </Link>
            <div>
              <button
                onClick={() => setMobileProductOpen(!mobileProductOpen)}
                className='mobile-nav-link flex justify-between w-full'
              >
                {t('products')}
                <FiChevronDown
                  className={`transition-transform duration-300 ${mobileProductOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {mobileProductOpen && (
                <div className='pl-4 space-y-2'>
                  <Link to='/giay-nam' className='dropdown-link' onClick={handleLinkClick}>
                    {t('men_shoes')}
                  </Link>
                  <Link to='/giay-nu' className='dropdown-link' onClick={handleLinkClick}>
                    {t('women_shoes')}
                  </Link>
                </div>
              )}
            </div>
            <Link to='/product-sale' className='mobile-nav-link' onClick={handleLinkClick}>
              {t('sale')}
            </Link>
            <Link to='/news' className='mobile-nav-link' onClick={handleLinkClick}>
              {t('news')}
            </Link>
            <Link to='/contact' className='mobile-nav-link' onClick={handleLinkClick}>
              {t('contact')}
            </Link>
            <Link to='/wishlist' className='mobile-nav-link' onClick={handleLinkClick}>
              {t('wishlist')} {wishlistCount > 0 && `(${wishlistCount})`}
            </Link>
            {isLoggedIn && (
              <>
                <p className='mobile-nav-link text-blue-600'>{t('greeting', { name: user?.name || 'User' })}</p>
                <Link to='/profile' className='mobile-nav-link' onClick={handleLinkClick}>
                  {t('profile')}
                </Link>
                <Link to='/orders' className='mobile-nav-link' onClick={handleLinkClick}>
                  {t('orders')}
                </Link>
                {(user?.role_id === 1 || user?.role_id === 2) && (
                  <a
                    href='http://datn_sneakers.test/admin'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='mobile-nav-link'
                    onClick={handleLinkClick}
                  >
                    {t('Admin Dashboard')}
                  </a>
                )}
                <button onClick={handleLogout} className='mobile-nav-link text-left'>
                  {t('logout')}
                </button>
              </>
            )}
            <input
              key={i18n.language}
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-300'
              placeholder={t('search_placeholder')}
            />
          </nav>
        </motion.div>
      )}
    </header>
  )
}

export default Header
