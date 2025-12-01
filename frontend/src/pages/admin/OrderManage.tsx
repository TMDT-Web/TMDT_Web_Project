/**
 * Admin Order Management - Orders table with status update
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '@/services/order.service'

export default function OrderManage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [editedOrder, setEditedOrder] = useState<any>({
    full_name: '',
    phone_number: '',
    shipping_address: '',
    note: '',
    subtotal: 0,
    shipping_fee: 0,
    discount_amount: 0,
    payment_method: 'cod',
    is_paid: false
  })
  const [cancelReason, setCancelReason] = useState('')
  const size = 20
  const queryClient = useQueryClient()

  // Fetch orders from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminOrders', page, size],
    queryFn: () => orderService.getAllOrders(page, size),
  })

  // Mutation for updating order status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      orderService.updateOrderStatus(id, status, notes),
    onSuccess: () => {
      alert('Cập nhật trạng thái đơn hàng thành công!')
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] })
    },
    onError: (error: any) => {
      console.error('Update error:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Có lỗi xảy ra'
      alert(`Lỗi: ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`)
    }
  })

  const filteredOrders = data?.orders?.filter(order => {
    const matchesSearch = order.id.toString().includes(searchTerm) ||
                         order.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.phone_number.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

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

  const handleStatusChange = (orderId: number, newStatus: string, notes?: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus, notes })
  }

  const handleOpenOrderDetail = (order: any) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setEditedOrder({
      full_name: order.full_name,
      phone_number: order.phone_number,
      shipping_address: order.shipping_address,
      note: order.note || '',
      subtotal: order.subtotal,
      shipping_fee: order.shipping_fee || 0,
      discount_amount: order.discount_amount || 0,
      payment_method: order.payment_method,
      is_paid: order.is_paid
    })
    setEditMode(false)
    setCancelReason('')
  }

  const handleSaveChanges = async () => {
    try {
      // Check if status changed to cancelled and validate cancel reason
      if (newStatus === 'cancelled' && newStatus !== selectedOrder.status) {
        if (!cancelReason.trim()) {
          alert('Vui lòng nhập lý do hủy đơn hàng')
          return
        }
      }
      
      // Prepare update data
      const updateData: any = {
        full_name: editedOrder.full_name,
        phone_number: editedOrder.phone_number,
        shipping_address: editedOrder.shipping_address,
        note: editedOrder.note,
        subtotal: editedOrder.subtotal,
        shipping_fee: editedOrder.shipping_fee,
        discount_amount: editedOrder.discount_amount,
        payment_method: editedOrder.payment_method,
        is_paid: editedOrder.is_paid
      }
      
      // Add status if changed
      if (newStatus !== selectedOrder.status) {
        updateData.status = newStatus
        if (newStatus === 'cancelled') {
          updateData.cancellation_reason = cancelReason
        }
      }
      
      // Call update API
      await orderService.updateOrder(selectedOrder.id, updateData)
      
      alert('Cập nhật thông tin thành công!')
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] })
      setSelectedOrder(null)
      setEditMode(false)
      setCancelReason('')
    } catch (error) {
      alert('Lỗi khi cập nhật thông tin')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-white rounded-lg p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý đơn hàng</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Không thể tải danh sách đơn hàng</p>
          <p className="text-red-600 text-sm">{error instanceof Error ? error.message : 'Vui lòng thử lại sau'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý đơn hàng</h2>
        <p className="text-gray-600 mt-1">Tổng {data?.total || 0} đơn hàng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn hoặc khách hàng..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipping">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Mã đơn</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Khách hàng</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sản phẩm</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tổng tiền</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trạng thái</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ngày đặt</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Không tìm thấy đơn hàng nào
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const productSummary = order.items && order.items.length > 0
                  ? order.items.length === 1
                    ? order.items[0].product?.name || 'Sản phẩm'
                    : `${order.items[0].product?.name || 'Sản phẩm'} (+${order.items.length - 1} sản phẩm)`
                  : 'Không có sản phẩm'

                return (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono text-blue-600">#{order.id.toString().padStart(6, '0')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{order.full_name}</p>
                      <p className="text-xs text-gray-500">{order.phone_number}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{productSummary}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-700 px-2 py-1 text-sm font-medium"
                          onClick={() => handleOpenOrderDetail(order)}
                        >
                          Xem
                        </button>
                        {order.status === 'pending' && (
                          <button
                            className="text-green-600 hover:text-green-700 px-2 py-1 text-sm font-medium disabled:opacity-50"
                            onClick={() => handleStatusChange(order.id, 'confirmed')}
                            disabled={updateStatusMutation.isPending}
                          >
                            Xác nhận
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            className="text-indigo-600 hover:text-indigo-700 px-2 py-1 text-sm font-medium disabled:opacity-50"
                            onClick={() => handleStatusChange(order.id, 'processing')}
                            disabled={updateStatusMutation.isPending}
                          >
                            Xử lý
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            className="text-purple-600 hover:text-purple-700 px-2 py-1 text-sm font-medium disabled:opacity-50"
                            onClick={() => handleStatusChange(order.id, 'shipping')}
                            disabled={updateStatusMutation.isPending}
                          >
                            Giao hàng
                          </button>
                        )}
                        {order.status === 'shipping' && (
                          <>
                            <button
                              className="text-green-600 hover:text-green-700 px-2 py-1 text-sm font-medium disabled:opacity-50"
                              onClick={() => handleStatusChange(order.id, 'completed')}
                              disabled={updateStatusMutation.isPending}
                            >
                              Hoàn thành
                            </button>
                            <button
                              className="text-red-600 hover:text-red-700 px-2 py-1 text-sm font-medium disabled:opacity-50"
                              onClick={() => {
                                const reason = prompt('Lý do giao hàng thất bại:');
                                if (reason) handleStatusChange(order.id, 'cancelled', reason);
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              Thất bại
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > size && (
        <div className="mt-4 flex justify-center gap-2 bg-white rounded-lg shadow-sm p-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-gray-700 text-sm">
            Trang {page} / {Math.ceil(data.total / size)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(data.total / size)}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
          >
            Sau
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Chi tiết đơn hàng #{selectedOrder.id.toString().padStart(6, '0')}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Trạng thái đơn hàng</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Hiện tại:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    {/* Update status dropdown - only show valid next statuses */}
                    {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cập nhật trạng thái:</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                        >
                          <option value={selectedOrder.status}>{getStatusText(selectedOrder.status)}</option>
                          
                          {/* Pending can go to: confirmed, cancelled */}
                          {selectedOrder.status === 'pending' && (
                            <>
                              <option value="confirmed">Xác nhận đơn hàng</option>
                              <option value="cancelled">Hủy đơn hàng</option>
                            </>
                          )}
                          
                          {/* Awaiting payment can go to: confirmed, cancelled */}
                          {selectedOrder.status === 'awaiting_payment' && (
                            <>
                              <option value="confirmed">Xác nhận đơn hàng</option>
                              <option value="cancelled">Hủy đơn hàng</option>
                            </>
                          )}
                          
                          {/* Confirmed can go to: processing, shipping, cancelled */}
                          {selectedOrder.status === 'confirmed' && (
                            <>
                              <option value="processing">Đang xử lý</option>
                              <option value="shipping">Bắt đầu giao hàng</option>
                              <option value="cancelled">Hủy đơn hàng</option>
                            </>
                          )}
                          
                          {/* Processing can go to: shipping, cancelled */}
                          {selectedOrder.status === 'processing' && (
                            <>
                              <option value="shipping">Bắt đầu giao hàng</option>
                              <option value="cancelled">Hủy đơn hàng</option>
                            </>
                          )}
                          
                          {/* Shipping can go to: completed, cancelled */}
                          {selectedOrder.status === 'shipping' && (
                            <>
                              <option value="completed">Giao hàng thành công</option>
                              <option value="cancelled">Giao hàng thất bại</option>
                            </>
                          )}
                        </select>
                        
                        {/* Cancel reason input - show when cancelled is selected */}
                        {newStatus === 'cancelled' && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lý do hủy:</label>
                            <textarea
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Nhập lý do hủy đơn hàng..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {(selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="bg-gray-100 rounded-lg p-3 text-center text-gray-600 text-sm">
                          {selectedOrder.status === 'completed' ? 'Đơn hàng đã hoàn thành' : 'Đơn hàng đã hủy'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Thanh toán</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phương thức:</span>
                      <select
                        value={editedOrder.payment_method}
                        onChange={(e) => setEditedOrder({...editedOrder, payment_method: e.target.value})}
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="cod">COD</option>
                        <option value="bank_transfer">Chuyển khoản</option>
                        <option value="momo">MoMo</option>
                        <option value="vnpay">VNPay</option>
                      </select>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <select
                        value={editedOrder.is_paid.toString()}
                        onChange={(e) => setEditedOrder({...editedOrder, is_paid: e.target.value === 'true'})}
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="true">Đã thanh toán</option>
                        <option value="false">Chưa thanh toán</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Thông tin khách hàng</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Họ tên:</p>
                    <input
                      type="text"
                      value={editedOrder.full_name}
                      onChange={(e) => setEditedOrder({...editedOrder, full_name: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Số điện thoại:</p>
                    <input
                      type="text"
                      value={editedOrder.phone_number}
                      onChange={(e) => setEditedOrder({...editedOrder, phone_number: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600 mb-1">Địa chỉ giao hàng:</p>
                    <textarea
                      value={editedOrder.shipping_address}
                      onChange={(e) => setEditedOrder({...editedOrder, shipping_address: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Sản phẩm đặt hàng</h3>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, idx: number) => {
                      const productName = item.product_name || item.product?.name || 'Sản phẩm'
                      const price = item.price_at_purchase || item.price || 0
                      const subtotal = price * item.quantity
                      
                      return (
                        <div key={idx} className="flex gap-4 bg-white rounded-lg p-4 border border-gray-200">
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
                            <p className="font-semibold text-slate-800">{formatPrice(subtotal)}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-4">Không có sản phẩm</p>
                  )}
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Ghi chú đơn hàng</h3>
                <textarea
                  value={editedOrder.note}
                  onChange={(e) => setEditedOrder({...editedOrder, note: e.target.value})}
                  placeholder="Nhập ghi chú cho đơn hàng..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-2">Ghi chú này sẽ được lưu cùng đơn hàng và có thể xem lại sau.</p>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Tổng kết đơn hàng</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <input
                      type="number"
                      value={editedOrder.subtotal}
                      onChange={(e) => setEditedOrder({...editedOrder, subtotal: parseFloat(e.target.value) || 0})}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <input
                      type="number"
                      value={editedOrder.shipping_fee}
                      onChange={(e) => setEditedOrder({...editedOrder, shipping_fee: parseFloat(e.target.value) || 0})}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giảm giá:</span>
                    <input
                      type="number"
                      value={editedOrder.discount_amount}
                      onChange={(e) => setEditedOrder({...editedOrder, discount_amount: parseFloat(e.target.value) || 0})}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                    <span className="text-gray-700">Tổng cộng:</span>
                    <span className="text-blue-600">
                      {formatPrice(editedOrder.subtotal + editedOrder.shipping_fee - editedOrder.discount_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedOrder(null)
                    setEditMode(false)
                    setCancelReason('')
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={updateStatusMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateStatusMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
