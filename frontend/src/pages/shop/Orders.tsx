/**
 * User Orders Page - View order history
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { orderService } from '@/services/order.service'
import { Link } from 'react-router-dom'
import type { Order } from '@/types/models'

export default function Orders() {
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const size = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['myOrders', page, size],
    queryFn: () => orderService.getMyOrders(page, size),
  })

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'awaiting_payment': return 'bg-orange-100 text-orange-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-indigo-100 text-indigo-800'
      case 'shipping': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận'
      case 'awaiting_payment': return 'Chờ thanh toán'
      case 'confirmed': return 'Đã xác nhận'
      case 'processing': return 'Đang xử lý'
      case 'shipping': return 'Đang giao'
      case 'completed': return 'Hoàn thành'
      case 'cancelled': return 'Đã hủy'
      case 'refunded': return 'Đã hoàn tiền'
      default: return status
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cod': return 'Thanh toán khi nhận hàng'
      case 'bank_transfer': return 'Chuyển khoản ngân hàng'
      case 'momo': return 'Ví MoMo'
      case 'vnpay': return 'VNPay'
      default: return method
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium mb-2">Không thể tải danh sách đơn hàng</p>
            <p className="text-red-600 text-sm">{error instanceof Error ? error.message : 'Vui lòng thử lại sau'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Đơn hàng của tôi</h1>
          <p className="text-gray-600 mt-2">
            {data?.total || 0} đơn hàng
          </p>
        </div>

        {/* Orders List */}
        {!data?.orders || data.orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-gray-500 mb-6">Bạn chưa đặt hàng lần nào</p>
            <Link
              to="/products"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mã đơn hàng</p>
                      <p className="font-mono font-medium text-blue-600">
                        #{order.id.toString().padStart(6, '0')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ngày đặt</p>
                      <p className="text-sm text-gray-700">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  {order.items && order.items.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {order.items.map((item, idx) => {
                        // Get item details - support both old and new format
                        const productName = item.product_name || item.product?.name || 'Sản phẩm'
                        const price = item.price_at_purchase || item.price || 0
                        const subtotal = price * item.quantity
                        
                        return (
                        <div key={idx} className="flex gap-4">
                          {item.product?.image_url && (
                            <img
                              src={item.product.image_url}
                              alt={productName}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{productName}</p>
                            {item.variant && (
                              <p className="text-sm text-gray-500">Phân loại: {item.variant}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                              {formatPrice(price)} x {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-slate-800">{formatPrice(subtotal)}</p>
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-4">Không có sản phẩm</p>
                  )}

                  {/* Order Summary */}
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="text-gray-800">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí vận chuyển:</span>
                      <span className="text-gray-800">{formatPrice(order.shipping_fee)}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giảm giá:</span>
                        <span className="text-green-600">-{formatPrice(order.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                      <span className="text-gray-700">Tổng cộng:</span>
                      <span className="text-blue-600">{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>

                  {/* Payment & Shipping Info */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Phương thức thanh toán</p>
                      <p className="text-gray-800 font-medium">{getPaymentMethodText(order.payment_method)}</p>
                      {order.is_paid ? (
                        <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          Chưa thanh toán
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Địa chỉ giao hàng</p>
                      <p className="text-gray-800">{order.shipping_address}</p>
                      <p className="text-gray-600">{order.phone_number}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-3">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => {
                          if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
                            orderService.cancelOrder(order.id)
                              .then(() => window.location.reload())
                              .catch(err => alert('Không thể hủy đơn hàng: ' + err.message))
                          }
                        }}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        Hủy đơn
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  Chi tiết đơn hàng #{selectedOrder.id.toString().padStart(6, '0')}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Date */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Trạng thái</p>
                    <span className={`inline-block mt-1 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusClass(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Ngày đặt hàng</p>
                    <p className="mt-1 text-gray-800 font-medium">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Sản phẩm</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => {
                      const productName = item.product_name || item.product?.name || 'Sản phẩm'
                      const price = item.price_at_purchase || item.price || 0
                      const subtotal = price * item.quantity
                      
                      return (
                      <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                        {item.product?.image_url && (
                          <img
                            src={item.product.image_url}
                            alt={productName}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{productName}</p>
                          {item.variant && (
                            <p className="text-sm text-gray-500 mt-1">Phân loại: {item.variant}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-gray-600">
                              {formatPrice(price)} x {item.quantity}
                            </p>
                            <p className="font-medium text-slate-800">{formatPrice(subtotal)}</p>
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Thông tin khách hàng</h3>
                    <p className="text-gray-700">{selectedOrder.full_name}</p>
                    <p className="text-gray-600 text-sm mt-1">{selectedOrder.phone_number}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Địa chỉ giao hàng</h3>
                    <p className="text-gray-700 text-sm">{selectedOrder.shipping_address}</p>
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Thanh toán</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phương thức:</span>
                      <span className="text-gray-800">{getPaymentMethodText(selectedOrder.payment_method)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Trạng thái:</span>
                      {selectedOrder.is_paid ? (
                        <span className="text-green-600 font-medium">Đã thanh toán</span>
                      ) : (
                        <span className="text-orange-600 font-medium">Chưa thanh toán</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Tổng thanh toán</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="text-gray-800">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí vận chuyển:</span>
                      <span className="text-gray-800">{formatPrice(selectedOrder.shipping_fee)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giảm giá:</span>
                        <span className="text-green-600">-{formatPrice(selectedOrder.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                      <span className="text-gray-700">Tổng cộng:</span>
                      <span className="text-blue-600">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                {selectedOrder.note && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Ghi chú</h3>
                    <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3">{selectedOrder.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > size && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Trước
            </button>
            <span className="px-4 py-2 text-gray-700">
              Trang {page} / {Math.ceil(data.total / size)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(data.total / size)}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
