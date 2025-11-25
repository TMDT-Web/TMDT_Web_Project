/**
 * Cart Context - Hybrid: Local Storage + Server-Side API
 * 
 * For unauthenticated users: Uses localStorage
 * For authenticated users: Uses server-side cart API (generated client)
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartService } from '@/client'
import type { CartItemResponse, ProductResponse } from '@/client'
import { storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/constants/config'
import { useAuth } from './AuthContext'

// Local cart item structure (for non-authenticated users)
interface LocalCartItem {
  product: ProductResponse | any  // Compatible with old Product type
  quantity: number
  variant?: string  // Optional variant (color, size, etc.)
}

interface CartContextType {
  items: LocalCartItem[]
  totalItems: number
  totalPrice: number
  isLoading: boolean
  addItem: (product: any, quantity?: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  syncCart: () => Promise<void>  // Sync local cart to server after login
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<LocalCartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, user } = useAuth()

  // Load cart on mount
  useEffect(() => {
    loadCart()
  }, [isAuthenticated])

  /**
   * Load cart from server (if authenticated) or localStorage
   */
  const loadCart = async () => {
    if (isAuthenticated) {
      try {
        setIsLoading(true)
        // ✅ Use generated CartService
        const cartData = await CartService.getCartApiV1CartGet()

        // Convert server cart items to local format
        // Convert server cart items to local format
        const localItems: LocalCartItem[] = (cartData?.items || []).map((item: any) => {
          // If it's a collection/combo item
          if (item.collection_id && item.collection) {
            return {
              product: {
                id: item.collection.id,
                name: item.collection.name,
                slug: item.collection.slug,
                price: item.collection.sale_price || 0,
                thumbnail_url: item.collection.banner_url,
                stock: 999, // Collections don't have direct stock
                isCollection: true, // Flag to identify this is a combo
                collectionId: item.collection.id,
              },
              quantity: item.quantity,
              cartItemId: item.id,
            }
          }

          // Regular product item
          return {
            product: {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              price: item.product.sale_price || item.product.price,
              thumbnail_url: item.product.thumbnail_url,
              stock: item.product.stock,
              isCollection: false,
            },
            quantity: item.quantity,
            cartItemId: item.id,
          }
        })

        setItems(localItems)
      } catch (error) {
        console.error('Failed to load cart from server:', error)
        // Fallback to localStorage
        loadLocalCart()
      } finally {
        setIsLoading(false)
      }
    } else {
      // Not authenticated - load from localStorage
      loadLocalCart()
    }
  }

  /**
   * Load cart from localStorage
   */
  const loadLocalCart = () => {
    const savedCart = storage.get<LocalCartItem[]>(STORAGE_KEYS.CART)
    if (savedCart && Array.isArray(savedCart)) {
      setItems(savedCart)
    } else {
      setItems([])
    }
  }

  /**
   * Save cart to localStorage (for non-authenticated users)
   */
  useEffect(() => {
    if (!isAuthenticated && items.length > 0) {
      storage.set(STORAGE_KEYS.CART, items)
    }
  }, [items, isAuthenticated])

  /**
   * Sync local cart to server after login
   */
  const syncCart = async () => {
    if (!isAuthenticated) return

    const localCart = storage.get<LocalCartItem[]>(STORAGE_KEYS.CART)
    if (!localCart || localCart.length === 0) return

    try {
      // Add each local item to server cart
      for (const item of localCart) {
        await CartService.addToCartApiV1CartAddPost({
          product_id: item.product.id,
          quantity: item.quantity,
        })
      }

      // Clear local cart after sync
      storage.remove(STORAGE_KEYS.CART)

      // Reload from server
      await loadCart()
    } catch (error) {
      console.error('Failed to sync cart to server:', error)
    }
  }

  /**
   * Add item to cart
   */
  /**
   * Add item to cart
   */
  const addItem = async (product: any, quantity = 1) => {
    if (isAuthenticated) {
      try {
        setIsLoading(true)
        // ✅ Use generated CartService - server will handle merging
        // Pass is_collection flag explicitly to prevent ID collision
        await CartService.addToCartApiV1CartAddPost({
          product_id: product.id,
          quantity: quantity,
          is_collection: !!product.isCollection
        } as any)

        // Reload cart from server
        await loadCart()
      } catch (error) {
        console.error('Failed to add item to cart:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    } else {
      // Local cart update
      setItems((prev) => {
        // Check if item exists (matching ID AND isCollection flag)
        const existingItem = prev.find((item) =>
          item.product.id === product.id &&
          !!item.product.isCollection === !!product.isCollection
        )

        if (existingItem) {
          return prev.map((item) =>
            item.product.id === product.id && !!item.product.isCollection === !!product.isCollection
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }

        return [...prev, { product, quantity }]
      })
    }
  }
  /**
   * Remove item from cart
   */
  const removeItem = async (productId: number) => {
    if (isAuthenticated) {
      try {
        setIsLoading(true)
        // Find the cart item ID
        const cartData = await CartService.getCartApiV1CartGet()
        // Check both product_id and collection_id
        const itemToRemove = (cartData.items as any[]).find(item =>
          item.product_id === productId || item.collection_id === productId
        )

        if (itemToRemove) {
          // ✅ Use generated CartService
          await CartService.removeFromCartApiV1CartItemIdDelete(itemToRemove.id)
          await loadCart()
        }
      } catch (error) {
        console.error('Failed to remove item from cart:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    } else {
      // Local cart update
      setItems((prev) => prev.filter((item) => item.product.id !== productId))
    }
  }

  /**
   * Update item quantity
   */
  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId)
      return
    }

    if (isAuthenticated) {
      try {
        setIsLoading(true)
        // Find the cart item ID
        const cartData = await CartService.getCartApiV1CartGet()
        // Check both product_id and collection_id
        const itemToUpdate = (cartData.items as any[]).find(item =>
          item.product_id === productId || item.collection_id === productId
        )

        if (itemToUpdate) {
          // ✅ Use generated CartService
          await CartService.updateCartItemApiV1CartItemIdPut(itemToUpdate.id, {
            quantity: quantity,
          })
          await loadCart()
        }
      } catch (error) {
        console.error('Failed to update cart item:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    } else {
      // Local cart update
      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      )
    }
  }

  /**
   * Clear entire cart
   */
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        setIsLoading(true)
        // ✅ Use generated CartService
        await CartService.clearCartApiV1CartDelete()
        setItems([])
      } catch (error) {
        console.error('Failed to clear cart:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    } else {
      // Local cart clear
      setItems([])
      storage.remove(STORAGE_KEYS.CART)
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        syncCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
