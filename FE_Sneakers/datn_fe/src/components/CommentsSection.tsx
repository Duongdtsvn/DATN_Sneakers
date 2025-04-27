import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

interface Reply {
  id: number
  comment_id: number
  user_id: number
  content: string
  created_at: string
  user: {
    id: number
    name: string
  }
}

interface Comment {
  id: number
  product_id: number
  user_id: number
  content: string
  created_at: string
  user: {
    id: number
    name: string
  }
  replies: Reply[]
}

interface User {
  id: number
  name: string
  role_id: number // 1 = Admin, 3 = User
}

interface CommentsSectionProps {
  productId: number
  user: User | null
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ productId, user }) => {
  const { t } = useTranslation()
  const [comments, setComments] = useState<Comment[]>([])
  const [commentContent, setCommentContent] = useState<string>('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState<string>('')
  const [replyContent, setReplyContent] = useState<string>('')
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const commentsPerPage = 3

  // Tính toán phân trang
  const indexOfLastComment = currentPage * commentsPerPage
  const indexOfFirstComment = indexOfLastComment - commentsPerPage
  const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment)
  const totalPages = Math.ceil(comments.length / commentsPerPage)

  // Hàm thử lại request
  const retryRequest = async (fn: () => Promise<any>, retries: number, delay: number) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        if (i === retries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // Lấy danh sách bình luận
  useEffect(() => {
    const fetchComments = async () => {
      setCommentsLoading(true)
      setCommentsError(null)
      try {
        const response = await retryRequest(
          () => axios.get(`http://localhost:8000/api/detail-product/${productId}/comments`, { timeout: 5000 }),
          3,
          1000
        )
        if (!Array.isArray(response.data)) {
          throw new Error('Định dạng dữ liệu bình luận không hợp lệ: Cần một mảng')
        }
        setComments(response.data)
      } catch (error: any) {
        let errorMessage = t('error_fetching_comments')
        if (error.code === 'ERR_NETWORK') {
          errorMessage =
            'Không thể kết nối đến server. Vui lòng kiểm tra backend (server có chạy trên localhost:8000 không?).'
        } else if (error.response) {
          errorMessage = error.response.data?.message || `Lỗi server: ${error.response.status}`
        } else {
          errorMessage = error.message
        }
        setCommentsError(errorMessage)
      } finally {
        setCommentsLoading(false)
      }
    }

    if (productId) {
      fetchComments()
    } else {
      setCommentsError(t('no_product_id'))
      setCommentsLoading(false)
    }
  }, [productId, t])

  // Xử lý gửi bình luận
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) {
      toast.error(t('comment_cannot_be_empty'), { autoClose: 1000 })
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error(t('please_login_to_comment'), { autoClose: 2000 })
      return
    }

    try {
      const response = await retryRequest(
        () =>
          axios.post(
            'http://localhost:8000/api/comments',
            { product_id: productId, content: commentContent },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            }
          ),
        3,
        1000
      )

      setComments([...comments, response.data.comment])
      setCommentContent('')
      toast.success(t('comment_added'), { autoClose: 2000 })
      setCurrentPage(Math.ceil((comments.length + 1) / commentsPerPage))
    } catch (error: any) {
      let errorMessage = t('error_adding_comment')
      if (error.code === 'ERR_NETWORK') {
        errorMessage =
          'Không thể kết nối đến server. Vui lòng kiểm tra backend (server có chạy trên localhost:8000 không?).'
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Lỗi server: ${error.response.status}`
      } else {
        errorMessage = error.message
      }
      toast.error(errorMessage, { autoClose: 2000 })
    }
  }

  // Xử lý gửi trả lời
  const handleReplySubmit = async (e: React.FormEvent, commentId: number) => {
    e.preventDefault()
    if (!replyContent.trim()) {
      toast.error(t('reply_cannot_be_empty'), { autoClose: 1000 })
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error(t('please_login_to_reply'), { autoClose: 2000 })
      return
    }

    try {
      const response = await retryRequest(
        () =>
          axios.post(
            'http://localhost:8000/api/replies',
            { comment_id: commentId, content: replyContent },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            }
          ),
        3,
        1000
      )

      setComments(
        comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: [...(comment.replies || []), response.data.reply] }
            : comment
        )
      )
      setReplyContent('')
      setReplyingCommentId(null)
      toast.success(t('reply_added'), { autoClose: 2000 })
    } catch (error: any) {
      let errorMessage = t('error_adding_reply')
      if (error.code === 'ERR_NETWORK') {
        errorMessage =
          'Không thể kết nối đến server. Vui lòng kiểm tra backend (server có chạy trên localhost:8000 không?).'
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Lỗi server: ${error.response.status}`
      } else {
        errorMessage = error.message
      }
      toast.error(errorMessage, { autoClose: 2000 })
    }
  }

  // Xử lý sửa bình luận
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const handleUpdateComment = async (commentId: number) => {
    if (!editingContent.trim()) {
      toast.error(t('comment_cannot_be_empty'), { autoClose: 1000 })
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error(t('please_login_to_comment'), { autoClose: 2000 })
      return
    }

    try {
      const response = await axios.put(
        `http://localhost:8000/api/comments/${commentId}`,
        { content: editingContent },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      setComments(comments.map((c) => (c.id === commentId ? response.data.comment : c)))
      setEditingCommentId(null)
      setEditingContent('')
      toast.success(t('comment_updated'), { autoClose: 2000 })
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error_updating_comment'), { autoClose: 2000 })
    }
  }

  // Xử lý xóa bình luận
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm(t('confirm_delete_comment'))) return

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error(t('please_login_to_comment'), { autoClose: 2000 })
      return
    }

    try {
      await axios.delete(`http://localhost:8000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setComments(comments.filter((c) => c.id !== commentId))
      toast.success(t('comment_deleted'), { autoClose: 2000 })
      if (currentComments.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error_deleting_comment'), { autoClose: 2000 })
    }
  }

  // Skeleton loading
  const CommentsSkeleton = () => (
    <div className='space-y-4 animate-pulse'>
      {Array(3)
        .fill(0)
        .map((_, index) => (
          <div key={index} className='bg-white p-6 rounded-lg shadow-sm'>
            <div className='h-4 bg-gray-200 rounded w-1/4 mb-3'></div>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
          </div>
        ))}
    </div>
  )

  // Phân trang
  const Pagination = () => (
    <div className='flex justify-center items-center gap-2 mt-6'>
      <button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className='px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        ←
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`px-3 py-1 rounded-full ${
            currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className='px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        →
      </button>
    </div>
  )

  return (
    <div className='mt-12 max-w-3xl mx-auto'>
      <h2 className='text-2xl font-bold text-gray-800 mb-8 text-center'>{t('customer_comments')}</h2>

      {/* Form bình luận */}
      {user ? (
        <div className='mb-8 bg-white p-6 rounded-lg shadow-sm'>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={t('write_your_comment')}
              className='w-full h-24 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
              required
            />
            <button
              type='submit'
              className='mt-3 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-200 text-sm font-medium'
            >
              {t('submit_comment')}
            </button>
          </form>
        </div>
      ) : (
        <div className='mb-8 text-center text-sm text-gray-600'>
          {t('please_login_to_comment')}{' '}
          <a href='/login' className='text-blue-500 hover:underline'>
            {t('login')}
          </a>
        </div>
      )}

      {/* Danh sách bình luận */}
      {commentsLoading ? (
        <CommentsSkeleton />
      ) : commentsError ? (
        <div className='text-center text-red-600 p-6 bg-white rounded-lg shadow-sm'>{commentsError}</div>
      ) : currentComments.length > 0 ? (
        <div className='space-y-4'>
          {currentComments.map((comment) => (
            <div key={comment.id} className='bg-white p-6 rounded-lg shadow-sm transition duration-200 hover:shadow-md'>
              {editingCommentId === comment.id ? (
                <div>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className='w-full h-24 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                    required
                  />
                  <div className='flex gap-2 mt-3'>
                    <button
                      onClick={() => handleUpdateComment(comment.id)}
                      className='bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 text-sm'
                    >
                      {t('save')}
                    </button>
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 text-sm'
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-semibold text-gray-800'>{comment.user.name}</p>
                      <p className='text-xs text-gray-500'>{new Date(comment.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                    {user?.role_id === 1 && (
                      <div className='flex gap-3'>
                        <button
                          onClick={() => handleEditComment(comment)}
                          className='text-blue-500 hover:text-blue-600 text-sm'
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className='text-red-500 hover:text-red-600 text-sm'
                        >
                          {t('delete')}
                        </button>
                      </div>
                    )}
                  </div>
                  <p className='text-sm text-gray-600 mt-3'>{comment.content}</p>

                  {/* Hiển thị replies */}
                  {comment.replies?.length > 0 && (
                    <div className='mt-4 ml-6 border-l-2 border-gray-200 pl-4 space-y-2'>
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className='text-sm'>
                          <p className='font-semibold text-gray-800'>
                            {reply.user.name} <span className='text-xs text-gray-500'>(Admin)</span>
                          </p>
                          <p className='text-gray-600'>{reply.content}</p>
                          <p className='text-xs text-gray-500'>{new Date(reply.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Form trả lời cho admin */}
                  {user?.role_id === 1 && (
                    <div className='mt-4'>
                      {replyingCommentId === comment.id ? (
                        <form onSubmit={(e) => handleReplySubmit(e, comment.id)}>
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={t('write_your_reply')}
                            className='w-full h-20 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                            required
                          />
                          <div className='flex gap-2 mt-2'>
                            -three-quarters-from-bottom
                            <button
                              type='submit'
                              className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 text-sm'
                            >
                              {t('submit_reply')}
                            </button>
                            <button
                              type='button'
                              onClick={() => setReplyingCommentId(null)}
                              className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 text-sm'
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setReplyingCommentId(comment.id)}
                          className='text-blue-500 hover:text-blue-600 text-sm'
                        >
                          {t('reply')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center text-gray-600 p-6 bg-white rounded-lg shadow-sm'>{t('no_comments')}</div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && <Pagination />}
    </div>
  )
}

export default CommentsSection
