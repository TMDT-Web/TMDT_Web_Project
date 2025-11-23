/**
 * Profile Page - User account management
 */
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { orderService } from '@/services/order.service'
import { OrderStatus, OrderPaymentStatus } from '@/types'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'password'>('info')

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    // Note: address is managed through separate Address API, not in UserResponse
    address: ''
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  if (!user) {
    navigate('/login')
    return null
  }

  // Fetch user orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderService.getMyOrders(1, 20),
    enabled: activeTab === 'orders'
  })

  const orders = ordersData?.items || []

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: API call
    alert('Cập nhật thông tin thành công!')
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Mật khẩu xác nhận không khớp!')
      return
    }
    // TODO: API call
    alert('Đổi mật khẩu thành công!')
    setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800'
      case OrderStatus.SHIPPING: return 'bg-blue-100 text-blue-800'
      case OrderStatus.PROCESSING: return 'bg-yellow-100 text-yellow-800'
      case OrderStatus.PENDING: return 'bg-gray-100 text-gray-800'
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Chờ xác nhận'
      case OrderStatus.CONFIRMED: return 'Đã xác nhận'
      case OrderStatus.PROCESSING: return 'Đang xử lý'
      case OrderStatus.SHIPPING: return 'Đang giao'
      case OrderStatus.DELIVERED: return 'Đã giao'
      case OrderStatus.CANCELLED: return 'Đã hủy'
      case OrderStatus.REFUNDED: return 'Đã hoàn tiền'
      default: return status
    }
  }

  const getPaymentStatusText = (status: OrderPaymentStatus) => {
    switch (status) {
      case OrderPaymentStatus.UNPAID: return 'Chưa thanh toán'
      case OrderPaymentStatus.PAID: return 'Đã thanh toán'
      case OrderPaymentStatus.REFUNDED: return 'Đã hoàn tiền'
      default: return status
    }
  }

  return (
    <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
      <div className="container-custom">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Tài khoản của tôi</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-center mb-6 pb-6 border-b">
                <div className="w-20 h-20 bg-[rgb(var(--color-moss))] rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-lg">{user.full_name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'info' ? 'bg-[rgb(var(--color-wood))] text-white' : 'hover:bg-gray-100'}`}
                >
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'orders' ? 'bg-[rgb(var(--color-wood))] text-white' : 'hover:bg-gray-100'}`}
                >
                  Đơn hàng của tôi
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'password' ? 'bg-[rgb(var(--color-wood))] text-white' : 'hover:bg-gray-100'}`}
                >
                  Đổi mật khẩu
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition"
                >
                  Đăng xuất
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Personal Info Tab */}
            {activeTab === 'info' && (
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="font-bold text-2xl mb-6">Thông tin cá nhân</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Họ và tên</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      value={user.email}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Địa chỉ</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="btn-primary">
                    Cập nhật thông tin
                  </button>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="font-bold text-2xl mb-6">Đơn hàng của tôi</h2>
                
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[rgb(var(--color-wood))] rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào</p>
                    <button onClick={() => navigate('/products')} className="btn-primary">
                      Mua sắm ngay
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(orders) && orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:border-[rgb(var(--color-wood))] transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-bold text-lg">{order.order_number}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {getPaymentStatusText(order.payment_status)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-600 text-sm">{order.items.length} sản phẩm</p>
                            <p className="font-bold text-[rgb(var(--color-wood))] text-xl">
                              {order.total_amount.toLocaleString('vi-VN')}₫
                            </p>
                          </div>
                          <button className="btn-secondary">
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="font-bold text-2xl mb-6">Đổi mật khẩu</h2>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-2">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="btn-primary">
                    Đổi mật khẩu
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
