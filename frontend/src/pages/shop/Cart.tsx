/**
 * Cart Page - Shopping cart with item management
 */
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { formatImageUrl } from '@/utils/format'

export default function Cart() {
  const { items, updateQuantity, removeItem, totalItems, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()

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

  return (
    <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
      <div className="container-custom">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Giỏ hàng ({totalItems} sản phẩm)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {Array.isArray(items) && items.map((item) => {
              const isCombo = item.product.isCollection
              const itemPrice = item.product.price || 0
              
              return (
                <div key={`${isCombo ? 'combo' : 'product'}-${item.product.id}`} className="bg-white rounded-xl p-6 shadow-sm flex gap-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-lg overflow-hidden relative">
                      <img
                        src={formatImageUrl(item.product.thumbnail_url) || 'https://via.placeholder.com/200'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                      {isCombo && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                          COMBO
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg hover:text-[rgb(var(--color-wood))] mb-2">
                      {item.product.name}
                    </h3>
                    {isCombo && (
                      <p className="text-sm text-gray-600 mb-2">🎁 Bộ sưu tập combo</p>
                    )}
                    <p className="text-[rgb(var(--color-wood))] font-bold text-xl mb-4">
                      {itemPrice.toLocaleString('vi-VN')}₫
                      {isCombo && <span className="text-sm text-gray-500 ml-2">(giá ưu đãi)</span>}
                    </p>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
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
                          disabled={!isCombo && item.quantity >= item.product.stock}
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-2">Tạm tính</p>
                    <p className="font-bold text-xl">
                      {(itemPrice * item.quantity).toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </div>
              )
            })}

            <button onClick={clearCart} className="text-red-600 hover:text-red-700 font-medium">
              Xóa tất cả
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-xl mb-6">Tóm tắt đơn hàng</h3>

              <div className="space-y-4 mb-6">
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
