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
    if (confirm(`Xác nhận cập nhật trạng thái đơn hàng #${orderId}?`)) {
      updateStatusMutation.mutate({ id: orderId, status: newStatus, notes })
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
                          onClick={() => alert(`Chi tiết đơn ${order.id}\n\nĐịa chỉ: ${order.shipping_address}\nGhi chú: ${order.note || 'Không có'}`)}
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
    </div>
  )
}
