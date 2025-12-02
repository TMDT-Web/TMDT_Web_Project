/**
 * Cart Context - Hybrid: Local Storage + Server-Side API
 * 
 * For unauthenticated users: Uses localStorage
 * For authenticated users: Uses server-side cart API (generated client)
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartService } from '@/client'
import type { CartItemResponse, ProductResponse, CollectionWithProductsResponse } from '@/client'
import { storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/constants/config'
import { useAuth } from './AuthContext'

// Local cart item structure (for non-authenticated users)
interface LocalCartItem {
  product: ProductResponse | any  // Compatible with old Product type
  quantity: number
  variant?: string  // Optional variant (color, size, etc.)
  collectionId?: number  // Track if this item was added as part of a collection
}

// Collection in cart structure
interface CartCollection {
  id: number
  name: string
  salePrice: number  // Discounted price for the whole collection
  originalPrice: number  // Sum of individual product prices
  productIds: number[]  // Products that belong to this collection
}

interface CartContextType {
  items: LocalCartItem[]
  collections: CartCollection[]  // Collections currently in cart
  totalItems: number
  totalPrice: number  // Price considering collection discounts
  isLoading: boolean
  addItem: (product: any, quantity?: number) => Promise<void>
  addCollection: (collection: CollectionWithProductsResponse) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  removeCollection: (collectionId: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  syncCart: () => Promise<void>  // Sync local cart to server after login
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<LocalCartItem[]>([])
  const [collections, setCollections] = useState<CartCollection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()

  // Load collections from localStorage on mount
  useEffect(() => {
    const savedCollections = storage.get<CartCollection[]>(STORAGE_KEYS.CART_COLLECTIONS)
    if (savedCollections && Array.isArray(savedCollections)) {
      setCollections(savedCollections)
    }
  }, [])

  // Save collections to localStorage when changed
  useEffect(() => {
    if (collections.length > 0) {
      storage.set(STORAGE_KEYS.CART_COLLECTIONS, collections)
    } else {
      storage.remove(STORAGE_KEYS.CART_COLLECTIONS)
    }
  }, [collections])

  // Load cart on mount and when auth status changes
  useEffect(() => {
    // Skip loading while auth is still initializing
    if (authLoading) {
      return
    }
    
    loadCart()
  }, [isAuthenticated, authLoading])

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
        const localItems: LocalCartItem[] = (cartData?.items || []).map((item: CartItemResponse) => ({
          product: {
            id: item.product_id,
            name: item.product.name,
            slug: item.product.slug,
            price: item.product.price,
            thumbnail_url: item.product.thumbnail_url,
            stock: item.product.stock,
            // Add other fields as needed
          },
          quantity: item.quantity,
        }))
        
        setItems(localItems)
      } catch (error) {
        console.error('Failed to load cart from server:', error)
        const status = (error as any)?.response?.status
        if (status === 401) {
          // Token might be expired - clear items and fall back to local
          console.warn('Cart API returned 401 - may indicate expired token')
        }
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
          requestBody: {
            product_id: item.product.id,
            quantity: item.quantity,
          }
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
  const addItem = async (product: any, quantity = 1, collectionId?: number) => {
    if (isAuthenticated) {
      try {
        setIsLoading(true)
        // ✅ Use generated CartService - server will handle merging
        await CartService.addToCartApiV1CartAddPost({
          requestBody: {
            product_id: product.id,
            quantity: quantity,
          }
        })
        
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
        const existingItem = prev.find((item) => item.product.id === product.id)
        
        if (existingItem) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity, collectionId: collectionId || item.collectionId }
              : item
          )
        }
        
        return [...prev, { product, quantity, collectionId }]
      })
    }
  }

  /**
   * Add entire collection to cart
   */
  const addCollection = async (collection: CollectionWithProductsResponse) => {
    if (!collection.products || collection.products.length === 0) {
      throw new Error('Collection has no products')
    }

    const products = collection.products
    const originalPrice = products.reduce((sum, p) => sum + (p.price || 0), 0)
    const salePrice = collection.sale_price || originalPrice

    // Add collection to tracking
    const newCollection: CartCollection = {
      id: collection.id,
      name: collection.name,
      salePrice: salePrice,
      originalPrice: originalPrice,
      productIds: products.map(p => p.id),
    }

    // Check if collection already exists
    setCollections(prev => {
      const exists = prev.find(c => c.id === collection.id)
      if (exists) return prev
      return [...prev, newCollection]
    })

    // Add each product to cart with collection tracking
    for (const product of products) {
      if (isAuthenticated) {
        try {
          await CartService.addToCartApiV1CartAddPost({
            requestBody: {
              product_id: product.id,
              quantity: 1,
            }
          })
        } catch (error) {
          console.error(`Failed to add product ${product.id} to cart:`, error)
        }
      } else {
        // For local cart, add with collection tracking
        setItems(prev => {
          const existingItem = prev.find(item => item.product.id === product.id)
          if (existingItem) {
            return prev.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1, collectionId: collection.id }
                : item
            )
          }
          return [...prev, { product, quantity: 1, collectionId: collection.id }]
        })
      }
    }

    // Reload cart if authenticated
    if (isAuthenticated) {
      await loadCart()
    }
  }

  /**
   * Remove collection from cart (removes all its products)
   */
  const removeCollection = async (collectionId: number) => {
    const collection = collections.find(c => c.id === collectionId)
    if (!collection) return

    // Remove each product that belongs to this collection
    for (const productId of collection.productIds) {
      await removeItem(productId)
    }

    // Remove collection from tracking
    setCollections(prev => prev.filter(c => c.id !== collectionId))
  }

  /**
   * Remove item from cart
   */
  const removeItem = async (productId: number) => {
    // Also check if removing this item breaks any collection
    setCollections(prev => {
      return prev.filter(collection => {
        // Keep collections that still have all their products in cart
        const remainingProducts = collection.productIds.filter(id => 
          id !== productId && items.some(item => item.product.id === id)
        )
        return remainingProducts.length === collection.productIds.length
      })
    })

    if (isAuthenticated) {
      try {
        setIsLoading(true)
        // Find the cart item ID
        const cartData = await CartService.getCartApiV1CartGet()
        const itemToRemove = cartData.items.find(item => item.product_id === productId)
        
        if (itemToRemove) {
          // ✅ Use generated CartService
          await CartService.removeFromCartApiV1CartItemIdDelete({ itemId: itemToRemove.id })
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
        const itemToUpdate = cartData.items.find(item => item.product_id === productId)
        
        if (itemToUpdate) {
          // ✅ Use generated CartService
          await CartService.updateCartItemApiV1CartItemIdPut({
            itemId: itemToUpdate.id,
            requestBody: {
              quantity: quantity,
            }
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
    // Also clear collections
    setCollections([])
    storage.remove(STORAGE_KEYS.CART_COLLECTIONS)
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  
  // Calculate total price considering collection discounts
  const totalPrice = (() => {
    let price = 0
    const processedCollectionIds = new Set<number>()
    
    for (const item of items) {
      // Check if this item belongs to a collection in cart
      const itemCollection = collections.find(c => c.productIds.includes(item.product.id))
      
      if (itemCollection && !processedCollectionIds.has(itemCollection.id)) {
        // Check if ALL products of this collection are in cart with quantity >= 1
        const allProductsInCart = itemCollection.productIds.every(productId =>
          items.some(i => i.product.id === productId && i.quantity >= 1)
        )
        
        if (allProductsInCart) {
          // Use collection's sale price instead of individual prices
          price += itemCollection.salePrice
          processedCollectionIds.add(itemCollection.id)
          continue
        }
      }
      
      // If not part of a complete collection, use individual price
      if (!processedCollectionIds.has(item.collectionId || 0)) {
        const itemCollectionMaybeIncomplete = collections.find(c => c.id === item.collectionId)
        if (itemCollectionMaybeIncomplete) {
          // Check again
          const allIn = itemCollectionMaybeIncomplete.productIds.every(pid =>
            items.some(i => i.product.id === pid && i.quantity >= 1)
          )
          if (allIn) {
            price += itemCollectionMaybeIncomplete.salePrice
            processedCollectionIds.add(itemCollectionMaybeIncomplete.id)
            continue
          }
        }
        
        // Individual product pricing
        price += (item.product.price || 0) * item.quantity
      }
    }
    
    return price
  })()

  return (
    <CartContext.Provider
      value={{
        items,
        collections,
        totalItems,
        totalPrice,
        isLoading,
        addItem,
        addCollection,
        removeItem,
        removeCollection,
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
