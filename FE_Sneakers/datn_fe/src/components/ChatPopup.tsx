import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import echo from '../echo'

interface Message {
  id: number
  sender_id: number
  content: string
  created_at: string
  sender: {
    id: number
    name: string
    image_user?: string
  }
}

interface Conversation {
  id: number
  user_id: number
  admin_id?: number
  messages: Message[]
}

const ChatPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const token = localStorage.getItem('token')
  const displayedMessageIds = useRef<Set<number>>(new Set())

  // Kết nối Echo và debug
  useEffect(() => {
    if (!token) {
      console.log('No token found, skipping Pusher connection')
      return
    }

    console.log('Connecting to Pusher...')
    echo.connect()

    echo.connector.pusher.connection.bind('connected', () => {
      console.log('Pusher connected successfully')
    })

    echo.connector.pusher.connection.bind('disconnected', () => {
      console.warn('Pusher disconnected, attempting to reconnect...')
      setTimeout(() => {
        console.log('Retrying Pusher connection...')
        echo.connect()
      }, 3000)
    })

    echo.connector.pusher.connection.bind('error', (err: any) => {
      console.error('Pusher connection error:', err)
    })

    // Kiểm tra auth errors
    echo.connector.pusher.bind('error', (err: any) => {
      console.error('Pusher global error (possibly auth):', err)
      if (err.error?.data?.code === -1) {
        console.error('Pusher auth failed, check token or authEndpoint')
      }
    })

    // Kiểm tra trạng thái kết nối
    const checkConnection = setInterval(() => {
      const state = echo.connector.pusher.connection.state
      console.log('Pusher connection state:', state)
      if (state !== 'connected') {
        console.warn('Pusher not connected, retrying...')
        echo.connect()
      }
    }, 5000)

    return () => {
      console.log('Disconnecting Pusher...')
      clearInterval(checkConnection)
      echo.disconnect()
    }
  }, [token])

  // Lấy danh sách conversation
  useEffect(() => {
    if (token) {
      axios
        .get('http://localhost:8000/api/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
          console.log('Fetched conversations:', response.data)
          setConversations(response.data)
          if (response.data.length > 0) {
            setSelectedConversation(response.data[0]) // Chọn conversation duy nhất
          }
        })
        .catch((error) => console.error('Error fetching conversations:', error))
    }
  }, [token])

  // Tạo hoặc lấy conversation duy nhất
  const createConversation = async () => {
    if (!token || conversations.length > 0) return
    try {
      const response = await axios.post(
        'http://localhost:8000/api/conversations/get-or-create',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const newConversation = response.data
      console.log('Created conversation:', newConversation)
      setConversations([newConversation])
      setSelectedConversation(newConversation)
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Không tạo được đoạn chat: Lỗi hệ thống')
    }
  }

  // Lấy tin nhắn và lắng nghe Pusher
  useEffect(() => {
    if (!token || !selectedConversation) {
      console.log('Skipping subscription: No token or selected conversation', { token, selectedConversation })
      return
    }

    // Lấy tin nhắn
    axios
      .get(`http://localhost:8000/api/conversations/${selectedConversation.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((response) => {
        console.log('Fetched messages:', response.data)
        setMessages(response.data)
        displayedMessageIds.current.clear()
        response.data.forEach((msg: Message) => displayedMessageIds.current.add(msg.id))
      })
      .catch((error) => console.error('Error fetching messages:', error))

    // Lắng nghe Pusher
    console.log(
      'Subscribing to channel:',
      `conversation.${selectedConversation.id}`,
      'with conversation:',
      selectedConversation
    )
    const channel = echo.channel(`conversation.${selectedConversation.id}`)

    channel.subscribed(() => {
      console.log('Successfully subscribed to channel:', `conversation.${selectedConversation.id}`)
    })

    // Listen cả event với và không namespace
    const handleMessage = (e: { message: Message }) => {
      console.log('Received Pusher message:', e.message, 'on channel:', `conversation.${selectedConversation.id}`)
      if (!displayedMessageIds.current.has(e.message.id)) {
        setMessages((prev) => {
          const newMessages = [...prev, e.message]
          console.log('Updated messages:', newMessages)
          return newMessages
        })
        displayedMessageIds.current.add(e.message.id)
      } else {
        console.log('Duplicate message ignored:', e.message.id)
      }
    }

    channel.listen('MessageSent', handleMessage)
    channel.listen('.MessageSent', handleMessage) // Thử với namespace
    channel.listen('App\\Events\\MessageSent', handleMessage) // Thử với full namespace

    return () => {
      console.log('Unsubscribing from channel:', `conversation.${selectedConversation.id}`)
      channel.stopListening('MessageSent')
      channel.stopListening('.MessageSent')
      channel.stopListening('App\\Events\\MessageSent')
      echo.leave(`conversation.${selectedConversation.id}`)
    }
  }, [selectedConversation, token])

  // Cuộn xuống cuối tin nhắn
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !token) return

    try {
      console.log('Sending message:', {
        conversationId: selectedConversation.id,
        content: newMessage
      })
      const response = await axios.post(
        `http://localhost:8000/api/conversations/${selectedConversation.id}/messages`,
        { content: newMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      console.log('Message sent successfully:', response.data)
      const sentMessage = response.data
      if (!displayedMessageIds.current.has(sentMessage.id)) {
        setMessages((prev) => [...prev, sentMessage])
        displayedMessageIds.current.add(sentMessage.id)
      }
      setNewMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
        alert(`Không gửi được tin nhắn: ${error.response.data.error || 'Lỗi không xác định'}`)
      } else {
        alert('Không gửi được tin nhắn: Lỗi kết nối')
      }
    }
  }

  // Nếu chưa đăng nhập, không hiển thị ô chat
  if (!token) return null

  return (
    <div className='fixed bottom-4 right-4 z-50 mb-20'>
      {/* Nút bật/tắt chat */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600 transition'
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Popup chat */}
      {isOpen && (
        <div className='w-96 bg-white rounded-lg shadow-xl flex flex-col h-[450px] sm:w-[28rem]'>
          {/* Header */}
          <div className='bg-blue-500 text-white p-2 rounded-t-lg'>
            <h3 className='text-sm font-bold'>Chat Support</h3>
          </div>

          {/* Danh sách conversation */}
          <div className='h-[120px] overflow-y-auto border-b'>
            <div className='p-2'>
              {conversations.length === 0 && (
                <button
                  onClick={createConversation}
                  className='w-full bg-blue-500 text-white px-2 py-1 rounded text-sm mb-2'
                >
                  Bắt đầu đoạn chat
                </button>
              )}
            </div>
            {conversations.length === 0 ? (
              <div className='p-2 text-gray-500 text-sm'>
                <p>Chưa có đoạn chat nào</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-2 cursor-pointer text-sm ${selectedConversation?.id === conv.id ? 'bg-blue-100' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className='font-semibold'>Đoạn chat #{conv.id}</div>
                  {conv.messages
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .slice(0, 3)
                    .map((msg) => (
                      <div key={msg.id} className='text-xs text-gray-600 truncate'>
                        {msg.sender?.name || 'Unknown'}:{' '}
                        {msg.content.length > 30 ? `${msg.content.slice(0, 30)}...` : msg.content}
                      </div>
                    ))}
                </div>
              ))
            )}
          </div>

          {/* Khu vực tin nhắn */}
          {selectedConversation ? (
            <div className='flex-1 flex flex-col'>
              <div className='flex-1 p-4 overflow-y-auto overflow-x-hidden max-h-[250px]'>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${message.sender_id === selectedConversation.user_id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-end ${message.sender_id === selectedConversation.user_id ? 'flex-row-reverse' : 'flex-row'} max-w-[60%]`}
                    >
                      <img
                        src={message.sender?.image_user || '/default-avatar.png'}
                        alt={message.sender?.name || 'Unknown'}
                        className='w-8 h-8 rounded-full mx-2'
                      />
                      <div className='flex flex-col'>
                        <p className='text-xs text-gray-500 mb-1'>{message.sender?.name || 'Unknown'}</p>
                        <p
                          className={`p-3 rounded-lg text-sm overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${
                            message.sender_id === selectedConversation.user_id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                          style={{ maxWidth: '100%', wordBreak: 'break-all', maxHeight: '150px', overflowY: 'auto' }}
                        >
                          {message.content}
                        </p>
                        <p className='text-xs text-gray-400 mt-1'>
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className='p-2 border-t'>
                <div className='flex'>
                  <input
                    type='text'
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className='flex-1 border rounded-l-lg p-2 text-sm'
                    placeholder='Nhập tin nhắn...'
                  />
                  <button onClick={sendMessage} className='bg-blue-500 text-white px-4 rounded-r-lg text-sm'>
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex-1 flex items-center justify-center text-sm text-gray-500'>Chưa có đoạn chat nào</div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatPopup
