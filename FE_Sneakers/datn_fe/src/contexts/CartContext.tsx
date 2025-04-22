// src/context/CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface CartContextType {
  cartCount: number
  updateCartCount: (count: number) => void
  clearCart: () => void
  fetchCartCount: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState<number>(0)

  const updateCartCount = (count: number) => {
    setCartCount(count)
  }

  const clearCart = () => {
    setCartCount(0)
  }

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await axios.get('http://localhost:8000/api/carts/list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const totalItems = response.data.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      setCartCount(totalItems)
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  useEffect(() => {
    fetchCartCount()
  }, [])

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount, clearCart, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
