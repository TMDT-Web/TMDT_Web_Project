/**
 * Cart Page - Shopping cart with item management and collection support
 */
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { formatImageUrl } from '@/utils/format'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function Cart() {
  const { items, collections, updateQuantity, removeItem, removeCollection, totalItems, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()
  const [expandedCollections, setExpandedCollections] = useState<Set<number>>(new Set())

  // Group items by collection
  const getCollectionItems = (collectionId: number) => {
    const collection = collections.find(c => c.id === collectionId)
    if (!collection) return []
    return items.filter(item => collection.productIds.includes(item.product.id))
  }

  // Get items that don't belong to any collection
  const getIndividualItems = () => {
    const collectionProductIds = new Set(collections.flatMap(c => c.productIds))
    return items.filter(item => !collectionProductIds.has(item.product.id))
  }

  // Calculate original total (without collection discounts) for comparison
  const originalTotal = items.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0)
  const savings = originalTotal - totalPrice

  // Toggle collection expansion
  const toggleCollection = (collectionId: number) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId)
      } else {
        newSet.add(collectionId)
      }
      return newSet
    })
  }

  if (items.length === 0) {
    return (
      <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
        <div className="container-custom text-center py-20">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-3xl font-bold mb-4">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
          <Link to="/products" className="btn-primary inline-block">Tiếp tục mua sắm</Link>
        </div>
      </div>
    )
  }

  const individualItems = getIndividualItems()

  return (
    <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
      <div className="container-custom">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Giỏ hàng ({totalItems} sản phẩm)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Collections */}
            {collections.map((collection) => {
              const collectionItems = getCollectionItems(collection.id)
              if (collectionItems.length === 0) return null
              const isExpanded = expandedCollections.has(collection.id)
              
              return (
                <div key={`collection-${collection.id}`} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 shadow-sm border-2 border-amber-200">
                  {/* Collection Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-amber-800">Bộ sưu tập: {collection.name}</h3>
                        <p className="text-sm text-amber-600">{collectionItems.length} sản phẩm</p>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-sm text-gray-500 line-through">{collection.originalPrice.toLocaleString('vi-VN')}₫</p>
                      <p className="text-xl font-bold text-amber-700">{collection.salePrice.toLocaleString('vi-VN')}₫</p>
                      <p className="text-xs text-green-600 font-medium">Tiết kiệm {(collection.originalPrice - collection.salePrice).toLocaleString('vi-VN')}₫</p>
                    </div>
                    <button
                      onClick={() => toggleCollection(collection.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100 transition"
                      aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-amber-700" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-amber-700" />
                      )}
                    </button>
                  </div>
                  
                  {/* Collection Products - Collapsible */}
                  {isExpanded && (
                    <>
                      <div className="space-y-3 mb-4 pb-4 border-b border-amber-200">
                        {collectionItems.map((item) => (
                          <div key={item.product.id} className="flex gap-4 bg-white/50 rounded-lg p-3">
                            <Link to={`/products/${item.product.slug}`} className="flex-shrink-0">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={formatImageUrl(item.product.thumbnail_url) || 'https://via.placeholder.com/100'}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link to={`/products/${item.product.slug}`} className="font-medium hover:text-amber-700 block truncate">
                                {item.product.name}
                              </Link>
                              <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400 line-through">{item.product.price.toLocaleString('vi-VN')}₫</p>
                              <p className="text-xs text-amber-600">Đã bao gồm trong giá combo</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Remove Collection Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => removeCollection(collection.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Xóa bộ sưu tập
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Individual Items */}
            {individualItems.length > 0 && (
              <>
                {collections.length > 0 && (
                  <h3 className="font-semibold text-gray-700 mt-6">Sản phẩm lẻ</h3>
                )}
                {individualItems.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-xl p-6 shadow-sm flex gap-6">
                    <Link to={`/products/${item.product.slug}`} className="flex-shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={formatImageUrl(item.product.thumbnail_url) || 'https://via.placeholder.com/200'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />KO
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product.slug}`} className="font-bold text-lg hover:text-[rgb(var(--color-wood))] mb-2 block">
                        {item.product.name}
                      </Link>
                      <p className="text-[rgb(var(--color-wood))] font-bold text-xl mb-4">
                        {item.product.sale_price}₫
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border-2 border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="px-3 py-1 hover:bg-gray-100 font-bold"
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="px-4 py-1 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="px-3 py-1 hover:bg-gray-100 font-bold"
                            disabled={item.quantity >= item.product.stock}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-2">Tạm tính</p>
                      <p className="font-bold text-xl">
                        {(item.product.sale_price * item.quantity).toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            <button onClick={clearCart} className="text-red-600 hover:text-red-700 font-medium">
              Xóa tất cả
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-xl mb-6">Tóm tắt đơn hàng</h3>

              <div className="space-y-4 mb-6">
                {savings > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá gốc:</span>
                      <span className="font-medium text-gray-400 line-through">{originalTotal.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Tiết kiệm (combo):</span>
                      <span className="font-medium">-{savings.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{totalPrice.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium">
                    {totalPrice >= 500000 ? (
                      <span className="text-green-600">Miễn phí</span>
                    ) : (
                      '30,000₫'
                    )}
                  </span>
                </div>
                <div className="border-t pt-4 flex justify-between text-lg">
                  <span className="font-bold">Tổng cộng:</span>
                  <span className="font-bold text-[rgb(var(--color-wood))] text-2xl">
                    {(totalPrice + (totalPrice >= 500000 ? 0 : 30000)).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>

              <button onClick={() => navigate('/checkout')} className="btn-primary w-full mb-3">
                Tiến hành thanh toán
              </button>
              <Link to="/products" className="btn-secondary w-full block text-center">
                Tiếp tục mua sắm
              </Link>

              <div className="mt-6 pt-6 border-t space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Miễn phí giao hàng cho đơn từ 500k</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Đổi trả trong vòng 7 ngày</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Bảo hành chính hãng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
