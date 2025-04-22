import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { FiChevronLeft, FiChevronRight, FiHeart } from 'react-icons/fi'

interface WishlistItem {
  product_id: number
  product_name: string
  slug: string
  image: string
  price: string
  product_size_id: number | null
  size_name: string | null
}

const Wishlist: React.FC = () => {
  const { t } = useTranslation()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Lấy wishlist từ localStorage
  const fetchWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    setWishlistItems(wishlist)
    // Reset về trang 1 nếu số trang giảm sau khi xóa
    const maxPage = Math.ceil(wishlist.length / itemsPerPage)
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage)
    } else if (wishlist.length === 0) {
      setCurrentPage(1)
    }
  }

  useEffect(() => {
    fetchWishlist()
    window.addEventListener('storage', fetchWishlist)
    return () => window.removeEventListener('storage', fetchWishlist)
  }, [])

  // Xóa sản phẩm khỏi wishlist
  const handleRemove = (item: WishlistItem) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const updatedWishlist = wishlist.filter(
      (i: WishlistItem) => i.product_id !== item.product_id || i.product_size_id !== item.product_size_id
    )
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
    setWishlistItems(updatedWishlist)
    window.dispatchEvent(new Event('storage'))
    toast.success(t('removed_from_wishlist', { name: item.product_name, size: item.size_name }), { autoClose: 1000 })
  }

  // Tính toán sản phẩm cho trang hiện tại
  const totalPages = Math.ceil(wishlistItems.length / itemsPerPage)
  const paginatedItems = wishlistItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Xử lý chuyển trang
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Tạo mảng số trang
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  return (
    <div className='container mx-auto px-2 sm:px-10 md:px-20 py-10 sm:py-20'>
      <h1 className='text-xl sm:text-2xl font-bold mb-6'>{t('wishlist')}</h1>
      {wishlistItems.length === 0 ? (
        <div className='flex flex-col items-center justify-center bg-white shadow-md rounded-lg p-6 mx-auto max-w-md'>
          <FiHeart className='text-red-300 text-6xl mb-4 animate-pulse' />
          <p className='text-lg text-gray-600 text-center'>{t('wishlist_empty')}</p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {paginatedItems.map((item) => (
              <div
                key={`${item.product_id}-${item.product_size_id}`}
                className='border rounded-lg p-3 hover:shadow-md transition bg-white'
              >
                <Link to={`/${item.slug}`} state={{ id: item.product_id }}>
                  <img src={item.image} alt={item.product_name} className='w-full h-32 object-cover rounded-md mb-2' />
                  <h3 className='text-sm font-semibold truncate'>{item.product_name}</h3>
                  <p className='text-xs text-gray-600'>
                    {t('size')}: {item.size_name || t('no_size')}
                  </p>
                  <p className='text-sm font-medium text-red-500'>{Number(item.price).toLocaleString('vi-VN')}đ</p>
                </Link>
                <button
                  onClick={() => handleRemove(item)}
                  className='mt-2 w-full bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition text-xs'
                >
                  {t('remove_from_wishlist')}
                </button>
              </div>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className='mt-6 flex justify-center items-center gap-2 flex-wrap'>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiChevronLeft />
                {t('previous')}
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('next')}
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Wishlist
