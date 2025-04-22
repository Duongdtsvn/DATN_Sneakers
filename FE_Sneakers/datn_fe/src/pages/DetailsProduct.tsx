import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { FaBox, FaTruck, FaExchangeAlt } from 'react-icons/fa'
import { FiHeart, FiShoppingCart, FiDollarSign } from 'react-icons/fi'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import { useCart } from '../contexts/CartContext'
import CommentsSection from '../components/CommentsSection'

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
  quantity?: number
  images: string[]
  sizes: { size: string; quantity: number; product_size_id: number }[]
  category: { id: number; category_name: string }
}

interface User {
  id: number
  name: string
  role_id: number // 1 = Admin, 3 = User
}

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = (location.state as { id?: number }) || {}
  const { t } = useTranslation()
  const { updateCartCount } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null)
  const [selectedSizeQuantity, setSelectedSizeQuantity] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({})
  const [error, setError] = useState<string | null>(null)
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(false)
  const [suggestedError, setSuggestedError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  const checkFavoriteStatus = (productId: number, sizeId: number | null) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    return wishlist.some(
      (item: { product_id: number; product_size_id: number | null }) =>
        item.product_id === productId && item.product_size_id === sizeId
    )
  }

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError(t('no_product_id'))
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const productResponse = await fetch(`http://localhost:8000/api/detail-product/${id}`)
        if (!productResponse.ok) {
          throw new Error(t('http_error', { status: productResponse.status }))
        }
        const productData = await productResponse.json()

        const newProduct: Product = {
          id: productData.data.id,
          slug: productData.data.slug || generateSlug(productData.data.product_name),
          name: productData.data.product_name,
          original_price: productData.data.original_price.toString(),
          discounted_price: productData.data.discounted_price.toString(),
          imageUrl: productData.data.image || 'https://via.placeholder.com/500',
          rating: productData.data.rating || 5,
          description: productData.data.description || t('no_description'),
          product_code: productData.data.product_code || 'SP123',
          quantity:
            productData.data.quantity ||
            productData.data.product_variant.reduce((sum: number, variant: any) => sum + variant.quantity, 0),
          images: productData.data.image_product.map((img: any) => img.image_product) || [],
          sizes:
            productData.data.product_variant.map((variant: any) => ({
              size: variant.product_size.name,
              quantity: variant.quantity,
              product_size_id: variant.product_size.id
            })) || [],
          category: {
            id: productData.data.category.id,
            category_name: productData.data.category.category_name
          }
        }

        setProduct(newProduct)
        setSelectedImage(newProduct.imageUrl || (newProduct.images.length > 0 ? newProduct.images[0] : null))
        fetchSuggestedProducts(productData.data.category.id)
        setIsFavorite(checkFavoriteStatus(newProduct.id, selectedSizeId))

        const token = localStorage.getItem('token')
        if (token) {
          try {
            const userResponse = await axios.get('http://localhost:8000/api/user', {
              headers: { Authorization: `Bearer ${token}` }
            })
            setUser(userResponse.data)
          } catch (userError: any) {
            console.error('Lỗi khi lấy thông tin người dùng:', userError)
          }
        }
      } catch (error: any) {
        setError(error.message || t('error_fetching_product'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [id, t])

  useEffect(() => {
    if (product) {
      setIsFavorite(checkFavoriteStatus(product.id, selectedSizeId))
    }
  }, [product, selectedSizeId])

  const fetchSuggestedProducts = async (categoryId: number) => {
    setSuggestedLoading(true)
    setSuggestedError(null)
    try {
      const response = await fetch(`http://localhost:8000/api/productbycategory/${categoryId}`)
      if (!response.ok) {
        throw new Error(t('http_error', { status: response.status }))
      }
      const data = await response.json()

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error(t('invalid_suggested_products_data'))
      }

      const suggested = data.data
        .filter((item: any) => item.id !== id)
        .slice(0, 6)
        .map((item: any) => ({
          id: item.id,
          slug: item.slug || generateSlug(item.product_name),
          name: item.product_name,
          original_price: item.original_price.toString(),
          discounted_price: item.discounted_price.toString(),
          imageUrl: item.image || 'https://via.placeholder.com/500',
          rating: item.rating || 5,
          description: item.description || t('no_description'),
          product_code: item.product_code || 'SP123',
          quantity: item.quantity || 0,
          images: item.image_product?.map((img: any) => img.image_product) || [],
          sizes:
            item.product_variant?.map((variant: any) => ({
              size: variant.product_size.name,
              quantity: variant.quantity,
              product_size_id: variant.product_size.id
            })) || [],
          category: {
            id: item.category.id,
            category_name: item.category.category_name
          }
        }))

      setSuggestedProducts(suggested)
    } catch (error: any) {
      setSuggestedError(error.message || t('error_fetching_suggested_products'))
    } finally {
      setSuggestedLoading(false)
    }
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (isNaN(value) || value < 1) {
      setQuantity(1)
    } else if (value > selectedSizeQuantity) {
      setQuantity(selectedSizeQuantity)
    } else {
      setQuantity(value)
    }
  }

  const handleAddToCart = async () => {
    if (!product || !selectedSize || !selectedSizeId) {
      toast.error(t('select_size_before_adding_to_cart'), { autoClose: 1000 })
      return
    }

    try {
      const response = await axios.post(
        'http://localhost:8000/api/carts/add',
        {
          product_id: product.id,
          quantity,
          product_size_id: selectedSizeId
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      toast.success(
        t('added_to_cart', {
          quantity,
          name: response.data.product_name,
          size: response.data.size
        }),
        { autoClose: 2000 }
      )

      const cartResponse = await axios.get('http://localhost:8000/api/carts/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      const totalItems = cartResponse.data.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      updateCartCount(totalItems)
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error(t('please_login_to_add_to_cart'), { autoClose: 2000 })
        navigate('/login')
      } else {
        toast.error(error.response?.data?.message || t('error_adding_to_cart'), { autoClose: 2000 })
      }
    }
  }

  const handleBuyNow = () => {
    if (!product || !selectedSize) {
      toast.error(t('select_size_before_buying'), { autoClose: 1000 })
      return
    }
    navigate('/checkout', {
      state: { products: [{ ...product, quantity, variant: selectedSize }], quantity }
    })
  }

  const handleToggleFavorite = () => {
    if (!product) return
    if (!selectedSize || !selectedSizeId) {
      toast.error(t('select_size_before_adding_to_wishlist'), { autoClose: 1000 })
      return
    }

    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const item = {
      product_id: product.id,
      product_name: product.name,
      slug: product.slug || generateSlug(product.name),
      image: product.imageUrl,
      price: product.discounted_price,
      product_size_id: selectedSizeId,
      size_name: selectedSize
    }

    if (isFavorite) {
      const updatedWishlist = wishlist.filter(
        (i: { product_id: number; product_size_id: number | null }) =>
          i.product_id !== item.product_id || i.product_size_id !== item.product_size_id
      )
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
      setIsFavorite(false)
      toast.success(t('removed_from_wishlist', { name: product.name, size: selectedSize }), { autoClose: 1000 })
    } else {
      wishlist.push(item)
      localStorage.setItem('wishlist', JSON.stringify(wishlist))
      setIsFavorite(true)
      toast.success(t('added_to_wishlist', { name: product.name, size: selectedSize }), { autoClose: 1000 })
    }

    window.dispatchEvent(new Event('storage'))
  }

  const handleImageClick = (image: string) => {
    setSelectedImage(image)
  }

  const handleSizeClick = (size: string, sizeQuantity: number, productSizeId: number) => {
    setSelectedSize(size)
    setSelectedSizeId(productSizeId)
    setSelectedSizeQuantity(sizeQuantity)
    setQuantity(1)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomStyle({ transform: 'scale(2)', transformOrigin: `${x}% ${y}%` })
  }

  const handleMouseLeave = () => {
    setZoomStyle({ transform: 'scale(1)', transformOrigin: 'center center' })
  }

  const SkeletonLoading = () => (
    <div className='container mx-auto px-2 sm:px-10 md:px-20 py-10 sm:py-20 animate-pulse'>
      <div className='flex flex-col md:flex-row gap-6'>
        <div className='md:w-1/2 flex flex-col items-center'>
          <div className='w-full max-w-xs sm:max-w-sm md:max-w-md h-[400px] bg-gray-300 rounded-lg'></div>
          <div className='flex gap-2 mt-4'>
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <div key={index} className='w-10 h-10 sm:w-20 sm:h-14 bg-gray-300 rounded-lg'></div>
              ))}
          </div>
        </div>
        <div className='md:w-1/2 px-[30px] md:px-0'>
          <div className='h-8 bg-gray-300 rounded w-3/4 mb-2'></div>
          <div className='h-4 bg-gray-300 rounded w-1/4 mb-2'></div>
          <div className='flex flex-wrap gap-4'>
            <div className='h-4 bg-gray-300 rounded w-1/3 mb-2'></div>
            <div className='h-4 bg-gray-300 rounded w-1/3 mb-2'></div>
          </div>
          <div className='mt-4 flex items-center gap-2'>
            <div className='h-6 bg-gray-300 rounded w-1/4'></div>
            <div className='h-6 bg-gray-300 rounded w-1/4'></div>
            <div className='h-4 bg-gray-300 rounded w-1/6'></div>
          </div>
          <div className='mt-4'>
            <div className='h-4 bg-gray-300 rounded w-1/4 mb-2'></div>
            <div className='flex gap-2 mt-2'>
              {Array(4)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className='w-10 h-10 bg-gray-300 rounded-full'></div>
                ))}
            </div>
          </div>
          <div className='mt-4 flex items-center gap-2'>
            <div className='h-4 bg-gray-300 rounded w-1/4'></div>
            <div className='w-16 h-8 bg-gray-300 rounded-md'></div>
            <div className='h-4 bg-gray-300 rounded w-1/3'></div>
          </div>
          <div className='mt-4 flex gap-2'>
            <div className='h-10 bg-gray-300 rounded-md w-24 sm:w-28'></div>
            <div className='h-10 bg-gray-300 rounded-md w-24 sm:w-28'></div>
          </div>
          <div className='mt-4'>
            <div className='h-4 bg-gray-300 rounded w-1/4 mb-2'></div>
            <div className='h-4 bg-gray-300 rounded w-full mb-2'></div>
            <div className='h-4 bg-gray-300 rounded w-3/4 mb-2'></div>
            <div className='h-4 bg-gray-300 rounded w-1/2'></div>
          </div>
          <div className='mt-6 flex flex-col sm:flex-row gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-5 h-5 bg-gray-300 rounded-full'></div>
              <div className='h-4 bg-gray-300 rounded w-1/2'></div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-5 h-5 bg-gray-300 rounded-full'></div>
              <div className='h-4 bg-gray-300 rounded w-1/2'></div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-5 h-5 bg-gray-300 rounded-full'></div>
              <div className='h-4 bg-gray-300 rounded w-1/2'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const SuggestedSkeleton = () => (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 animate-pulse'>
      {Array(6)
        .fill(0)
        .map((_, index) => (
          <div key={index} className='border rounded-lg p-4'>
            <div className='w-full h-48 bg-gray-300 rounded-md mb-2'></div>
            <div className='h-4 bg-gray-300 rounded w-3/4 mb-2'></div>
            <div className='h-4 bg-gray-300 rounded w-1/2'></div>
          </div>
        ))}
    </div>
  )

  if (isLoading) return <SkeletonLoading />
  if (error) return <p className='text-lg text-center text-red-600'>{error}</p>
  if (!product || !id) {
    return <p className='text-lg sm:text-xl text-center text-gray-600'>{t('no_products_to_display')}</p>
  }

  return (
    <div className='container mx-auto px-2 sm:px-10 md:px-20 py-10 sm:py-20'>
      <div className='flex flex-col md:flex-row gap-6'>
        <div className='md:w-1/2 flex flex-col items-center'>
          <div className='relative w-full h-[400px] max-w-xs sm:max-w-sm md:max-w-md overflow-hidden'>
            <img
              src={selectedImage || product.imageUrl}
              alt={product.name}
              className='w-full h-auto object-cover rounded-lg shadow-md transition-transform duration-300'
              style={zoomStyle}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          <div className='flex gap-2 mt-4 flex-wrap justify-center'>
            {product.images.length > 0 ? (
              product.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} variant ${index + 1}`}
                  onClick={() => handleImageClick(image)}
                  className={`w-10 h-10 sm:w-20 sm:h-14 object-cover rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    selectedImage === image ? 'border-red-500' : 'border-gray-300'
                  } hover:border-red-500 hover:shadow-md`}
                />
              ))
            ) : (
              <p className='text-sm text-gray-500'>{t('no_images_to_display')}</p>
            )}
          </div>
        </div>

        <div className='md:w-1/2 px-[30px] md:px-0'>
          <h1 className='text-xl sm:text-2xl font-bold'>{product.name}</h1>
          <p className='text-green-600 text-sm mt-1'>{product.quantity ? t('in_stock') : t('out_of_stock')}</p>
          <div className='flex flex-wrap gap-4 text-sm mt-1'>
            <span className='text-blue-500'>{t('brand', { brand: product.category.category_name })}</span> |
            <span className='text-blue-500'>{t('product_code', { code: product.product_code })}</span>
          </div>

          <div className='mt-4 flex items-center gap-2'>
            {product.original_price && (
              <p className='text-base sm:text-lg text-gray-500 line-through'>
                {Number(product.original_price).toLocaleString('vi-VN')}đ
              </p>
            )}
            <p className='text-xl sm:text-2xl font-bold'>{Number(product.discounted_price).toLocaleString('vi-VN')}đ</p>
            {product.original_price && Number(product.original_price) > Number(product.discounted_price) && (
              <p className='text-sm text-white bg-red-500 px-2 rounded-md py-1'>
                -
                {Math.round(
                  ((Number(product.original_price) - Number(product.discounted_price)) /
                    Number(product.original_price)) *
                    100
                )}
                %
              </p>
            )}
          </div>

          <div className='mt-4'>
            <p className='text-sm font-semibold'>{t('select_shoe_size')}</p>
            <div className='flex gap-2 mt-2 flex-wrap'>
              {product.sizes.length > 0 ? (
                product.sizes.map((sizeObj) => {
                  const { size, quantity: sizeQuantity, product_size_id } = sizeObj
                  const isAvailable = sizeQuantity > 0
                  return (
                    <button
                      key={product_size_id}
                      onClick={() => isAvailable && handleSizeClick(size, sizeQuantity, product_size_id)}
                      disabled={!isAvailable}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm sm:text-base ${
                        selectedSize === size
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : isAvailable
                            ? 'border-gray-300 hover:border-black hover:bg-gray-100'
                            : 'border-gray-300 bg-gray-200 opacity-50 cursor-not-allowed'
                      } transition`}
                    >
                      {size}
                    </button>
                  )
                })
              ) : (
                <p className='text-sm text-gray-500'>{t('no_sizes_available')}</p>
              )}
            </div>
          </div>

          <div className='mt-4 flex items-center gap-2'>
            <p className='text-sm font-semibold'>{t('quantity')}</p>
            <input
              type='number'
              value={quantity}
              onChange={handleQuantityChange}
              min='1'
              max={selectedSizeQuantity}
              disabled={!selectedSize}
              className='w-16 h-8 border rounded-md text-center text-base focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <p className='text-sm text-gray-600'>
              {selectedSize
                ? t('products_available_for_size', { quantity: selectedSizeQuantity, size: selectedSize })
                : t('please_select_size')}
            </p>
          </div>

          <div className='mt-4 flex gap-4 flex-wrap'>
            <button
              onClick={handleAddToCart}
              className='bg-yellow-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-yellow-600 transition text-sm sm:text-base flex items-center gap-2'
            >
              <FiShoppingCart />
              {t('add_to_cart')}
            </button>
            <button
              onClick={handleBuyNow}
              className='bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-600 transition text-sm sm:text-base flex items-center gap-2'
            >
              <FiDollarSign />
              {t('buy_now')}
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`px-4 sm:px-6 py-2 rounded-md transition text-sm sm:text-base flex items-center gap-2 ${
                isFavorite ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <FiHeart className={isFavorite ? 'fill-current' : ''} />
              {isFavorite ? t('remove_from_wishlist') : t('add_to_wishlist')}
            </button>
          </div>

          <div className='mt-4'>
            <p className='text-sm font-semibold'>{t('product_description')}</p>
            <div className='text-sm text-gray-600 mt-1' dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>

          <div className='mt-6 flex flex-col sm:flex-row gap-4'>
            <div className='flex items-center gap-2'>
              <FaBox className='text-red-500' />
              <p className='text-sm'>{t('careful_packaging')}</p>
            </div>
            <div className='flex items-center gap-2'>
              <FaExchangeAlt className='text-red-500' />
              <p className='text-sm'>{t('free_returns')}</p>
            </div>
            <div className='flex items-center gap-2'>
              <FaTruck className='text-red-500' />
              <p className='text-sm'>{t('fast_delivery')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className='mt-12'>
        <h2 className='text-xl sm:text-2xl font-bold mb-6'>{t('you_may_like')}</h2>
        {suggestedLoading ? (
          <SuggestedSkeleton />
        ) : suggestedError ? (
          <p className='text-red-600'>{suggestedError}</p>
        ) : suggestedProducts.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6'>
            {suggestedProducts.map((suggestedProduct) => {
              const discountPercentage =
                suggestedProduct.original_price &&
                Number(suggestedProduct.original_price) > Number(suggestedProduct.discounted_price)
                  ? Math.round(
                      ((Number(suggestedProduct.original_price) - Number(suggestedProduct.discounted_price)) /
                        Number(suggestedProduct.original_price)) *
                        100
                    )
                  : 0

              return (
                <div
                  key={suggestedProduct.id}
                  className='border rounded-lg p-4 hover:shadow-lg transition cursor-pointer relative'
                  onClick={() => navigate(`/${suggestedProduct.slug}`, { state: { id: suggestedProduct.id } })}
                >
                  {discountPercentage > 0 && (
                    <div className='absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded'>
                      -{discountPercentage}%
                    </div>
                  )}
                  <img
                    src={suggestedProduct.imageUrl}
                    alt={suggestedProduct.name}
                    className='w-full h-48 object-cover rounded-md mb-2'
                  />
                  <h3 className='text-sm font-semibold truncate'>{suggestedProduct.name}</h3>
                  <div className='flex items-center gap-2 mt-1'>
                    {suggestedProduct.original_price &&
                      Number(suggestedProduct.original_price) > Number(suggestedProduct.discounted_price) && (
                        <p className='text-sm text-gray-500 line-through'>
                          {Number(suggestedProduct.original_price).toLocaleString('vi-VN')}đ
                        </p>
                      )}
                    <p className='text-sm font-bold text-red-500'>
                      {Number(suggestedProduct.discounted_price).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className='text-gray-600'>{t('no_suggested_products')}</p>
        )}
      </div>

      <CommentsSection productId={id} user={user} />
    </div>
  )
}

export default ProductDetail
