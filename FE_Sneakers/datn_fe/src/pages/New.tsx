import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiFileText } from 'react-icons/fi'

interface News {
  id: number
  title: string
  image: string
  content: string
  author: string
  published_at: string
  created_at?: string
  updated_at?: string
}

interface ApiResponse {
  status: boolean
  message: string
  data: News[] | null
}

const NewsList: React.FC = () => {
  const [newsList, setNewsList] = useState<News[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 4
  const navigate = useNavigate()

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get<ApiResponse>('http://localhost:8000/api/news', { timeout: 10000 })
        if (response.data.status) {
          setNewsList(response.data.data || [])
          setMessage(response.data.data && response.data.data.length > 0 ? '' : 'Hiện tại không có tin tức nào')
        } else {
          setError(`Lỗi từ server: ${response.data.message}`)
        }
      } catch (err) {
        setError('Lỗi khi gọi API: ' + (err.response?.data?.message || err.message))
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const totalPages = Math.ceil(newsList.length / itemsPerPage)
  const paginatedNews = newsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const handleNewsClick = (id: number) => {
    navigate(`/news/${id}`)
  }

  if (loading)
    return (
      <div className='flex justify-center items-center h-screen'>
        <p className='text-lg text-gray-500 animate-pulse'>Đang tải...</p>
      </div>
    )
  if (error)
    return (
      <div className='flex justify-center items-center h-screen'>
        <p className='text-lg text-red-500'>{error}</p>
      </div>
    )

  return (
    <div className='container mx-auto px-4 py-10'>
      <h1 className='text-3xl font-bold text-center mb-10 text-gray-800'>Tin tức</h1>
      {message ? (
        <div className='flex flex-col items-center justify-center bg-white shadow-md rounded-lg p-6 mx-auto max-w-md'>
          <FiFileText className='text-blue-300 text-6xl mb-4 animate-pulse' />
          <p className='text-lg text-gray-600 text-center'>{message}</p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-screen-xl mx-auto'>
            {paginatedNews.map((news) => (
              <div
                key={news.id}
                className='bg-white shadow-lg rounded-xl overflow-hidden cursor-pointer transform hover:shadow-xl transition-all duration-300'
                onClick={() => handleNewsClick(news.id)}
              >
                <div className='relative overflow-hidden'>
                  <img
                    src={news.image}
                    alt={news.title}
                    className='w-full h-48 object-cover rounded-t-xl transform hover:scale-105 transition-transform duration-300'
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/30 to-transparent'></div>
                </div>
                <div className='p-4'>
                  <h2 className='text-xl font-bold text-gray-800 line-clamp-1 hover:text-blue-600 transition-colors'>
                    {news.title}
                  </h2>
                  <p className='text-sm text-gray-600 line-clamp-2 mt-2'>{news.content}</p>
                  <div className='flex justify-between items-center mt-3'>
                    <p className='text-xs text-gray-500'>Tác giả: {news.author || 'Admin'}</p>
                    <p className='text-xs text-gray-500'>{new Date(news.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className='flex justify-center items-center mt-10 gap-2 flex-wrap'>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full flex items-center gap-1 text-sm ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiChevronLeft />
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 rounded-full text-sm ${
                    currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-full flex items-center gap-1 text-sm ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sau
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NewsList
