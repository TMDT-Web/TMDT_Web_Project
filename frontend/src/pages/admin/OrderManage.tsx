/**
 * Admin Order Management - Orders table with status update
 */
import { useState } from 'react'

export default function OrderManage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Mock data
  const orders = [
    { id: 'ORD-2024-010', customer: 'Nguyễn Văn A', products: 'Sofa Monaco 3 chỗ', total: 22500000, status: 'pending', date: '25/12/2024', phone: '0901234567' },
    { id: 'ORD-2024-009', customer: 'Trần Thị B', products: 'Bàn ăn Milan + 4 Ghế', total: 32500000, status: 'confirmed', date: '24/12/2024', phone: '0912345678' },
    { id: 'ORD-2024-008', customer: 'Lê Văn C', products: 'Giường Copenhagen King', total: 15900000, status: 'shipping', date: '23/12/2024', phone: '0923456789' },
    { id: 'ORD-2024-007', customer: 'Phạm Thị D', products: 'Kệ sách Stockholm', total: 8500000, status: 'delivered', date: '22/12/2024', phone: '0934567890' },
    { id: 'ORD-2024-006', customer: 'Hoàng Văn E', products: 'Ghế Barcelona x2', total: 12000000, status: 'cancelled', date: '21/12/2024', phone: '0945678901' }
  ]

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipping': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận'
      case 'confirmed': return 'Đã xác nhận'
      case 'shipping': return 'Đang giao'
      case 'delivered': return 'Đã giao'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Update order ${orderId} to status: ${newStatus}`)
    // TODO: API call
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý đơn hàng</h2>
        <p className="text-gray-600 mt-1">Tổng {orders.length} đơn hàng</p>
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
              Array.isArray(filteredOrders) && filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-sm font-mono text-blue-600">{order.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{order.customer}</p>
                    <p className="text-xs text-gray-500">{order.phone}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{order.products}</td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-800">
                    {formatPrice(order.total)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{order.date}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-700 px-2 py-1 text-sm font-medium"
                        onClick={() => alert(`Chi tiết đơn ${order.id}`)}
                      >
                        Xem
                      </button>
                      {order.status === 'pending' && (
                        <button
                          className="text-green-600 hover:text-green-700 px-2 py-1 text-sm font-medium"
                          onClick={() => handleStatusChange(order.id, 'confirmed')}
                        >
                          Xác nhận
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          className="text-purple-600 hover:text-purple-700 px-2 py-1 text-sm font-medium"
                          onClick={() => handleStatusChange(order.id, 'shipping')}
                        >
                          Giao hàng
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
