import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

interface Product {
  id: number
  product_name: string
  original_price: number
  discounted_price: number
  brand: { brand_name: string } | null
  image_product: { image_product: string }[] | null
  product_variants: { quantity: number; product_size: { name: string } }[] | null
  rating?: number
}

const SearchResults: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState<string>('')
  const [sizeFilter, setSizeFilter] = useState<string>('')
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams(location.search)
      const query = params.get('query') || ''

      try {
        const response = await fetch(
          `http://localhost:8000/api/products/search?query=${encodeURIComponent(query)}&page=${currentPage}&per_page=12&sort=${sortOption}`
        )
        if (!response.ok) throw new Error(t('error_fetching_search_results'))
        const data = await response.json()
        console.log('SearchResults API response:', data)

        if (!data.data || !data.data.data) {
          throw new Error(t('invalid_search_results'))
        }

        const productsWithRating = data.data.data.map((product: Product) => ({
          ...product,
          rating: 4
        }))

        setProducts(productsWithRating)
        setFilteredProducts(productsWithRating)

        const sizes = new Set<string>()
        productsWithRating.forEach((product: Product) => {
          product.product_variants?.forEach((variant) => {
            if (variant.quantity > 0) {
              sizes.add(variant.product_size.name)
            }
          })
        })
        setAvailableSizes(Array.from(sizes).sort((a, b) => parseInt(a) - parseInt(b)))

        setTotalPages(data.data.last_page)
      } catch (err: any) {
        setError(err.message || t('error_fetching_search_results'))
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [location.search, currentPage, sortOption, t])

  useEffect(() => {
    if (!sizeFilter) {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter((product) =>
        product.product_variants?.some((variant) => variant.product_size.name === sizeFilter && variant.quantity > 0)
      )
      setFilteredProducts(filtered)
    }
  }, [sizeFilter, products])

  const createSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleProductClick = (id: number, productName: string) => {
    const slug = createSlug(productName)
    navigate(`/${slug}`, { state: { id } })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number): number => {
    if (originalPrice <= 0) return 0
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
  }

  const SkeletonLoading = () => (
    <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8'>
      {Array(12)
        .fill(0)
        .map((_, index) => (
          <div key={index} className='bg-white shadow-lg rounded-lg p-4 text-center relative h-[18rem]'>
            <div className='absolute top-0 left-0 h-6 w-12 bg-gray-300 rounded-tr-md'></div>
            <div className='w-full h-48 bg-gray-300 rounded-md mb-4'></div>
            <div className='h-4 w-3/4 bg-gray-300 rounded mx-auto mb-2'></div>
            <div className='flex justify-center items-center mb-2 space-x-2'>
              <div className='h-4 w-16 bg-gray-300 rounded'></div>
              <div className='h-4 w-20 bg-gray-300 rounded'></div>
            </div>
          </div>
        ))}
    </div>
  )

  return (
    <div className='container mx-auto px-4 sm:px-8 md:px-16 my-12'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold mb-4'>{t('search_results')}</h2>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          {/* Bộ lọc giá */}
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-gray-700'>{t('sort_by_price')}:</span>
            <button
              onClick={() => setSortOption(sortOption === 'low-to-high' ? '' : 'low-to-high')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                sortOption === 'low-to-high' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {t('sort_low_to_high')}
            </button>
            <button
              onClick={() => setSortOption(sortOption === 'high-to-low' ? '' : 'high-to-low')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                sortOption === 'high-to-low' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {t('sort_high_to_low')}
            </button>
          </div>
          {/* Bộ lọc size */}
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-sm font-medium text-gray-700'>{t('filter_by_size')}:</span>
            <button
              onClick={() => setSizeFilter('')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                sizeFilter === '' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {t('filter_by_size_all')}
            </button>
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSizeFilter(sizeFilter === size ? '' : size)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  sizeFilter === size ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
      {loading && <SkeletonLoading />}
      {error && <p className='text-red-500'>{error}</p>}
      {!loading && !error && filteredProducts.length === 0 && <p className='text-gray-600'>{t('no_products_found')}</p>}
      {!loading && !error && filteredProducts.length > 0 && (
        <>
          <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8'>
            {filteredProducts.map((product) => {
              const discountPercentage = calculateDiscountPercentage(product.original_price, product.discounted_price)
              return (
                <div
                  key={product.id}
                  className='bg-white shadow-lg rounded-lg p-4 text-center relative cursor-pointer hover:shadow-xl transition-shadow duration-300 h-[18rem]'
                  onClick={() => handleProductClick(product.id, product.product_name)}
                >
                  {discountPercentage > 0 && (
                    <div className='absolute top-0 left-0 bg-red-600 text-white text-xs px-2 py-1 rounded-tr-md z-10'>
                      <p className='text-sm text-white-500'>-{discountPercentage}%</p>
                    </div>
                  )}
                  <div className='relative group'>
                    <img
                      src={product.image_product?.[0]?.image_product || 'https://via.placeholder.com/150'}
                      alt={product.product_name}
                      className='w-full h-48 object-cover rounded-md mb-4 transition-all duration-300 ease-in-out'
                    />
                    <div className='absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:from-white group-hover:to-white opacity-30 transition-all duration-200 ease-in-out z-0' />
                  </div>
                  <h3 className='text-sm mb-2 whitespace-nowrap overflow-hidden text-ellipsis'>
                    {product.product_name}
                  </h3>
                  <div className='flex justify-center items-center mb-2'>
                    <p className='text-gray-500 line-through text-sm mr-2'>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        product.original_price
                      )}
                    </p>
                    <p className='text-sm text-red-500 font-bold'>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        product.discounted_price
                      )}
                    </p>
                  </div>
                  {/* <div className='my-2'>
                    {Array.from({ length: product.rating || 4 }, (_, index) => (
                      <svg
                        key={index}
                        xmlns='http://www.w3.org/2000/svg'
                        fill='yellow'
                        viewBox='0 0 24 24'
                        width='20'
                        height='20'
                        className='inline'
                      >
                        <path d='M12 .587l3.668 7.431 8.232 1.186-5.958 5.759 1.406 8.206-7.348-3.86-7.348 3.86 1.406-8.206-5.958-5.759 8.232-1.186z' />
                      </svg>
                    ))}
                  </div> */}
                </div>
              )
            })}
          </div>
          {totalPages > 1 && (
            <div className='flex justify-center mt-8'>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className='px-4 py-2 mx-1 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50'
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(index + 1)}
                  className={`px-4 py-2 mx-1 rounded-lg ${
                    currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className='px-4 py-2 mx-1 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50'
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SearchResults
