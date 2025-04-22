import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import { useCart } from '../contexts/CartContext'

interface CartItem {
  id: number
  product_id: number
  product_name: string
  image: string
  quantity: number
  product_size_id: number | null
  size_name: string
  original_price: string
  discounted_price: string
  total_price: string
}

interface Product {
  id: number
  slug?: string
  name: string
  original_price: string
  discounted_price: string
  product_code: string
  imageUrl: string | null
  rating: number
  description: string
  quantity: number
  variant: string
  size?: string
  images?: string[]
  sizes?: { size: string; quantity: number; product_size_id: number }[]
  category?: { id: number; category_name: string }
}

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { cartCount, updateCartCount, clearCart } = useCart()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [totalCartPrice, setTotalCartPrice] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState<boolean>(false)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null)
  const [removeAction, setRemoveAction] = useState<'update' | 'delete' | null>(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/carts/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      setCartItems(response.data.items)
      setTotalCartPrice(response.data.total_cart_price)
      const totalItems = response.data.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      updateCartCount(totalItems)
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error(t('please_login_to_view_cart'), { autoClose: 2000 })
        navigate('/login')
      } else {
        setError(error.response?.data?.message || t('error_fetching_cart'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (item: CartItem, action: 'increase' | 'decrease') => {
    try {
      if (action === 'decrease' && item.quantity === 1) {
        toast.info(t('confirm_remove_item'), {
          position: 'top-center',
          autoClose: 2000
        })
        setItemToRemove(item)
        setRemoveAction('update')
        setShowConfirmModal(true)
        return
      }

      const response = await axios.put(
        'http://localhost:8000/api/carts/update',
        {
          product_id: item.product_id,
          product_size_id: item.product_size_id,
          action
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (action === 'decrease' && response.data.quantity === undefined) {
        setCartItems(cartItems.filter((cartItem) => cartItem.id !== item.id))
        setSelectedItems(selectedItems.filter((id) => id !== item.id))
      } else {
        setCartItems(
          cartItems.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: response.data.quantity, total_price: response.data.total_price }
              : cartItem
          )
        )
      }

      const updatedCart = await axios.get('http://localhost:8000/api/carts/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      setCartItems(updatedCart.data.items)
      setTotalCartPrice(updatedCart.data.total_cart_price)
      const totalItems = updatedCart.data.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      updateCartCount(totalItems)

      toast.success(response.data.message, { autoClose: 1000 })
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error_updating_cart'), { autoClose: 2000 })
    }
  }

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      const item = cartItems.find((item) => item.id === cartItemId)
      if (!item) return

      toast.info(t('confirm_remove_item'), {
        position: 'top-center',
        autoClose: 2000
      })

      setItemToRemove(item)
      setRemoveAction('delete')
      setShowConfirmModal(true)
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error_removing_item'), { autoClose: 2000 })
    }
  }

  const confirmRemove = async () => {
    if (!itemToRemove || !removeAction) return

    try {
      if (removeAction === 'update') {
        const response = await axios.put(
          'http://localhost:8000/api/carts/update',
          {
            product_id: itemToRemove.product_id,
            product_size_id: itemToRemove.product_size_id,
            action: 'decrease'
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )

        if (response.data.quantity === undefined) {
          setCartItems(cartItems.filter((cartItem) => cartItem.id !== itemToRemove.id))
          setSelectedItems(selectedItems.filter((id) => id !== itemToRemove.id))
        }
      } else if (removeAction === 'delete') {
        const response = await axios.delete(`http://localhost:8000/api/carts/remove/${itemToRemove.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })

        setCartItems(cartItems.filter((item) => item.id !== itemToRemove.id))
        setSelectedItems(selectedItems.filter((id) => id !== itemToRemove.id))

        toast.success(response.data.message, { autoClose: 1000 })
      }

      const updatedCart = await axios.get('http://localhost:8000/api/carts/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      setCartItems(updatedCart.data.items)
      setTotalCartPrice(updatedCart.data.total_cart_price)
      const totalItems = updatedCart.data.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      updateCartCount(totalItems)

      toast.success(t('item_removed'), { autoClose: 1000 })
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error_removing_item'), { autoClose: 2000 })
    } finally {
      setShowConfirmModal(false)
      setItemToRemove(null)
      setRemoveAction(null)
    }
  }

  const cancelRemove = () => {
    setShowConfirmModal(false)
    setItemToRemove(null)
    setRemoveAction(null)
  }

  const handleSelectItem = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
      setSelectAll(false)
    } else {
      setSelectedItems([...selectedItems, itemId])
      if (selectedItems.length + 1 === cartItems.length) {
        setSelectAll(true)
      }
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([])
      setSelectAll(false)
    } else {
      setSelectedItems(cartItems.map((item) => item.id))
      setSelectAll(true)
    }
  }

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error(t('please_select_at_least_one_item'), { autoClose: 2000 })
      return
    }

    const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.id))
    const products: Product[] = selectedCartItems.map((item) => ({
      id: item.product_id,
      name: item.product_name,
      original_price: item.original_price,
      discounted_price: item.discounted_price,
      product_code: `PROD-${item.product_id}`,
      imageUrl: item.image,
      rating: 0,
      description: '',
      quantity: item.quantity,
      variant: item.size_name,
      size: item.size_name,
      images: [item.image],
      sizes: item.product_size_id
        ? [{ size: item.size_name, quantity: item.quantity, product_size_id: item.product_size_id }]
        : undefined,
      category: undefined
    }))

    navigate('/checkout', { state: { products } })
  }

  const calculateSelectedTotal = () => {
    return cartItems
      .filter((item) => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + Number(item.total_price), 0)
  }

  const SkeletonLoading = () => (
    <div className='container mx-auto px-11 py-11 animate-pulse'>
      <div className='bg-white shadow-lg rounded-2xl p-6'>
        <div className='h-8 bg-gray-200 rounded-lg w-1/4 mb-6'></div>
        {Array(3)
          .fill(0)
          .map((_, index) => (
            <div key={index} className='flex items-center border-b py-4'>
              <div className='w-20 h-20 bg-gray-200 rounded-lg mr-4'></div>
              <div className='flex-1'>
                <div className='h-6 bg-gray-200 rounded-lg w-3/4 mb-2'></div>
                <div className='h-4 bg-gray-200 rounded-lg w-1/4 mb-2'></div>
                <div className='h-4 bg-gray-200 rounded-lg w-1/3'></div>
              </div>
              <div className='w-32 h-10 bg-gray-200 rounded-lg'></div>
            </div>
          ))}
        <div className='mt-6 flex justify-between'>
          <div className='h-6 bg-gray-200 rounded-lg w-1/4'></div>
          <div className='h-10 bg-gray-200 rounded-lg w-32'></div>
        </div>
      </div>
    </div>
  )

  if (loading) return <SkeletonLoading />
  if (error) return <p className='text-lg text-center text-red-600 font-semibold'>{error}</p>

  return (
    <div className='container mx-auto px-8 py-12'>
      <h1 className='text-2xl font-bold text-gray-800 mb-8'>{t('your_cart')}</h1>
      <div className='bg-white shadow-xl rounded-2xl overflow-hidden'>
        {cartItems.length === 0 ? (
          <div className='text-center py-16'>
            <svg
              className='w-24 h-24 mx-auto text-gray-400 mb-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
              />
            </svg>
            <p className='text-lg text-gray-600 mb-6'>{t('cart_is_empty')}</p>
            <button
              onClick={() => navigate('/')}
              className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md'
            >
              {t('continue_shopping')}
            </button>
          </div>
        ) : (
          <div className='p-6'>
            {/* Select All */}
            <div className='flex items-center mb-6'>
              <input
                type='checkbox'
                checked={selectAll}
                onChange={handleSelectAll}
                className='w-5 h-5 text-blue-600 rounded focus:ring-blue-500'
                aria-label={t('select_all')}
              />
              <span className='ml-3 text-sm font-medium text-gray-700'>
                {t('select_all')} ({cartItems.length})
              </span>
            </div>

            {/* Header for Desktop */}
            <div className='hidden md:grid grid-cols-6 gap-4 text-sm font-semibold text-gray-600 border-b pb-3 mb-6'>
              <div className='col-span-2'>{t('product')}</div>
              <div className='text-center'>{t('unit_price')}</div>
              <div className='text-center'>{t('quantity')}</div>
              <div className='text-center'>{t('total_price')}</div>
              <div className='text-center'>{t('action')}</div>
            </div>

            {/* Cart Items */}
            {cartItems.map((item) => (
              <div
                key={item.id}
                className='grid grid-cols-1 md:grid-cols-6 gap-4 items-center py-4 border-b hover:bg-gray-50 transition-all duration-200'
              >
                <div className='col-span-2 flex items-center'>
                  <input
                    type='checkbox'
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className='w-5 h-5 text-blue-600 rounded focus:ring-blue-500'
                    aria-label={`${t('select')} ${item.product_name}`}
                  />
                  <img
                    src={item.image}
                    alt={item.product_name}
                    className='w-20 h-20 object-cover rounded-lg ml-4 mr-4 shadow-sm'
                  />
                  <div>
                    <h2 className='text-base font-semibold text-gray-800'>{item.product_name}</h2>
                    <p className='text-sm text-gray-500'>
                      {t('size')}: {item.size_name}
                    </p>
                  </div>
                </div>
                <div className='text-sm text-center'>
                  {item.original_price && Number(item.original_price) > Number(item.discounted_price) ? (
                    <>
                      <p className='line-through text-gray-400'>
                        đ{Number(item.original_price).toLocaleString('vi-VN')}
                      </p>
                      <p className='text-gray-800 font-medium'>
                        đ{Number(item.discounted_price).toLocaleString('vi-VN')}
                      </p>
                    </>
                  ) : (
                    <p className='text-gray-800 font-medium'>
                      đ{Number(item.discounted_price).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
                <div className='flex items-center justify-center'>
                  <button
                    onClick={() => handleUpdateQuantity(item, 'decrease')}
                    className='w-10 h-10 border border-gray-300 rounded-l-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center'
                    aria-label={t('decrease_quantity')}
                  >
                    -
                  </button>
                  <span className='w-12 h-10 border-t border-b border-gray-300 text-gray-800 flex items-center justify-center font-medium'>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item, 'increase')}
                    className='w-10 h-10 border border-gray-300 rounded-r-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center'
                    aria-label={t('increase_quantity')}
                  >
                    +
                  </button>
                </div>
                <div className='text-sm font-semibold text-gray-800 text-center'>
                  đ{Number(item.total_price).toLocaleString('vi-VN')}
                </div>
                <div className='text-center'>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className='text-red-500 hover:text-red-600 text-sm font-medium transition-all duration-200'
                    aria-label={`${t('remove')} ${item.product_name}`}
                  >
                    {t('remove')}
                  </button>
                </div>
              </div>
            ))}

            {/* Sticky Checkout Bar */}
            <div className='sticky bottom-0 bg-white border-t pt-4 mt-6'>
              <div className='flex justify-between items-center'>
                <div>
                  <p className='text-sm text-gray-600'>
                    {t('selected_items')}: {selectedItems.length}
                  </p>
                  <p className='text-lg font-semibold text-gray-800'>
                    {t('total')}: đ{calculateSelectedTotal().toLocaleString('vi-VN')}
                  </p>
                </div>
                <button
                  onClick={handleCheckout}
                  className={`py-3 px-8 rounded-full text-white text-sm font-semibold transition-all duration-300 shadow-md ${
                    selectedItems.length > 0
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  disabled={selectedItems.length === 0}
                  aria-label={t('proceed_to_checkout')}
                >
                  {t('buy_now')} ({selectedItems.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && itemToRemove && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50'>
          <div className='bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100'>
            {/* <h3 className='text-xl font-semibold text-gray-800 mb-3'>{t('confirm_remove_item')}</h3> */}
            <p className='text-sm text-gray-600 mb-6'>
              {t('remove_item_message')} <span className='font-medium'>{itemToRemove.product_name}</span>?
            </p>
            <div className='flex justify-end gap-3'>
              <button
                onClick={cancelRemove}
                className='px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-all duration-200'
                aria-label={t('cancel')}
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmRemove}
                className='px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200'
                aria-label={t('yes_remove')}
              >
                {t('yes_remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage
