/**
 * Checkout Page - Order checkout with shipping info
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { orderService } from '@/services/order.service'
import { PaymentGateway } from '@/types'
import { formatImageUrl } from '@/utils/format'

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    shipping_contact_name: user?.full_name || '',
    shipping_contact_phone: user?.phone || '',
    shipping_address: '',
    notes: '',
    payment_gateway: 'cod' as PaymentGateway,
    use_reward_points: false
  })

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (data) => {
      clearCart()
      if (data.payment?.payment_url) {
        // Redirect to payment gateway
        window.location.href = data.payment.payment_url
      } else {
        // COD order success - data is OrderResponse directly
        alert(`Đặt hàng thành công!\nMã đơn hàng: #${data.id}\nTổng tiền: ${data.total_amount.toLocaleString('vi-VN')}₫`)
        navigate('/')
      }
    },
    onError: (error: any) => {
      console.error('Order creation error:', error)
      console.error('Error response:', error?.response?.data)

      // Extract detailed error message
      let errorMessage = 'Đặt hàng thất bại. Vui lòng thử lại!'

      if (error?.response?.data?.detail) {
        const detail = error.response.data.detail
        // If detail is an array of validation errors
        if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) =>
            `${err.loc?.join('.') || 'Field'}: ${err.msg}`
          ).join('\n')
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else {
          errorMessage = JSON.stringify(detail)
        }
      } else if (error?.message) {
        errorMessage = error.message
      }

      // Check if authentication error
      if (error?.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!')
        navigate('/login')
        return
      }

      alert(errorMessage)
    }
  })

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const shippingFee = totalPrice >= 500000 ? 0 : 30000
  const finalTotal = totalPrice + shippingFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('Vui lòng đăng nhập để đặt hàng!')
      return
    }

    // Map form data and cart items to backend API structure
    const orderPayload: any = {
      full_name: formData.shipping_contact_name,
      phone_number: formData.shipping_contact_phone,
      shipping_address: formData.shipping_address,
      payment_method: formData.payment_gateway,
      items: items.map(item => {
        const orderItem: any = {
          product_id: item.product.id,
          quantity: item.quantity,
          is_collection: !!(item.product as any).isCollection // Explicitly mark collections to prevent ID collision
        }
        // Only add variant if it exists
        if (item.variant) {
          orderItem.variant = item.variant
        }
        return orderItem
      })
    }

    // Only add note if it exists
    if (formData.notes && formData.notes.trim()) {
      orderPayload.note = formData.notes.trim()
    }

    console.log('Order payload:', orderPayload) // Debug log

    createOrderMutation.mutate(orderPayload)
  }

  return (
    <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
      <div className="container-custom">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="font-bold text-xl mb-6">Thông tin giao hàng</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]" value={formData.shipping_contact_name}
                      onChange={(e) => setFormData({ ...formData, shipping_contact_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={formData.shipping_contact_phone}
                      onChange={(e) => setFormData({ ...formData, shipping_contact_phone: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Địa chỉ giao hàng *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={formData.shipping_address}
                      onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Ghi chú</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      placeholder="Ghi chú về đơn hàng (tùy chọn)"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="font-bold text-xl mb-6">Phương thức thanh toán</h2>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))] transition">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={formData.payment_gateway === 'cod'}
                      onChange={(e) => setFormData({ ...formData, payment_gateway: e.target.value as PaymentGateway })}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))] transition">
                    <input
                      type="radio"
                      name="payment"
                      value="momo"
                      checked={formData.payment_gateway === 'momo'}
                      onChange={(e) => setFormData({ ...formData, payment_gateway: e.target.value as PaymentGateway })}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Ví MoMo</div>
                      <div className="text-sm text-gray-600">Thanh toán qua ví điện tử MoMo</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))] transition">
                    <input
                      type="radio"
                      name="payment"
                      value="vnpay"
                      checked={formData.payment_gateway === 'vnpay'}
                      onChange={(e) => setFormData({ ...formData, payment_gateway: e.target.value as PaymentGateway })}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">VNPay</div>
                      <div className="text-sm text-gray-600">Thanh toán qua cổng VNPay</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))] transition">
                    <input
                      type="radio"
                      name="payment"
                      value="bank_transfer"
                      checked={formData.payment_gateway === 'bank_transfer'}
                      onChange={(e) => setFormData({ ...formData, payment_gateway: e.target.value as PaymentGateway })}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Chuyển khoản ngân hàng</div>
                      <div className="text-sm text-gray-600">Chuyển khoản trực tiếp qua ngân hàng</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h3 className="font-bold text-xl mb-6">Đơn hàng ({items.length} sản phẩm)</h3>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {Array.isArray(items) && items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={formatImageUrl(item.product.thumbnail_url) || 'https://via.placeholder.com/100'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-gray-600 text-sm">SL: {item.quantity}</p>
                        <p className="font-medium">{(item.product.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium">{totalPrice.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium">
                      {shippingFee === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        `${shippingFee.toLocaleString('vi-VN')}₫`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg pt-3 border-t">
                    <span className="font-bold">Tổng cộng:</span>
                    <span className="font-bold text-[rgb(var(--color-wood))] text-2xl">
                      {finalTotal.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createOrderMutation.isPending ? 'Đang xử lý...' : 'Đặt hàng'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
