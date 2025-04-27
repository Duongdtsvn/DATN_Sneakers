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

const Chat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    axios
      .get('http://localhost:8000/api/conversations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then((response) => {
        setConversations(response.data)
      })
      .catch((error) => {
        console.error('Error fetching conversations:', error)
      })
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      axios
        .get(`http://localhost:8000/api/conversations/${selectedConversation.id}/messages`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then((response) => {
          setMessages(response.data)
        })
        .catch((error) => {
          console.error('Error fetching messages:', error)
        })

      const channel = echo.channel(`conversation.${selectedConversation.id}`)
      channel.listen('MessageSent', (e: { message: Message }) => {
        console.log('Pusher received:', e)
        setMessages((prev) => [...prev, e.message])
      })

      return () => {
        channel.stopListening('MessageSent')
        echo.leave(`conversation.${selectedConversation.id}`)
      }
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      await axios.post(
        `http://localhost:8000/api/conversations/${selectedConversation.id}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className='flex h-screen max-w-4xl mx-auto'>
      <div className='w-1/3 bg-gray-100 p-4 overflow-y-auto'>
        <h2 className='text-lg font-bold mb-4'>Conversations</h2>
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`p-2 cursor-pointer ${selectedConversation?.id === conv.id ? 'bg-blue-200' : ''}`}
            onClick={() => setSelectedConversation(conv)}
          >
            User ID: {conv.user_id} {conv.admin_id ? `(Admin: ${conv.admin_id})` : ''}
          </div>
        ))}
      </div>
      <div className='w-2/3 flex flex-col'>
        {selectedConversation ? (
          <>
            <div className='flex-1 p-4 overflow-y-auto'>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${message.sender_id === selectedConversation.user_id ? 'text-left' : 'text-right'}`}
                >
                  <div className='flex items-start'>
                    {message.sender_id === selectedConversation.user_id && (
                      <img
                        src={message.sender.image_user || 'default-avatar.png'}
                        alt={message.sender.name}
                        className='w-8 h-8 rounded-full mr-2'
                      />
                    )}
                    <div>
                      <p className='text-sm text-gray-500'>{message.sender.name}</p>
                      <p className='bg-gray-200 p-2 rounded-lg'>{message.content}</p>
                      <p className='text-xs text-gray-400'>{new Date(message.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className='p-4 border-t'>
              <div className='flex'>
                <input
                  type='text'
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className='flex-1 border rounded-l-lg p-2'
                  placeholder='Type a message...'
                />
                <button onClick={sendMessage} className='bg-blue-500 text-white px-4 rounded-r-lg'>
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className='flex-1 flex items-center justify-center'>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
