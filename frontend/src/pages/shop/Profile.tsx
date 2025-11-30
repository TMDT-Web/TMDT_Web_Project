/**
 * Profile Page - User account management
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '@/services/order.service'
import { userService } from '@/services/user.service'
import { OrderStatus, OrderPaymentStatus } from '@/types'
import AddressSelector from '@/components/AddressSelector'
import OrderDetailsModal from '@/components/OrderDetailsModal'
import type { AddressResponse } from '@/client/models/AddressResponse'
import type { OrderResponse } from '@/client/models/OrderResponse'

export default function Profile() {
  const { user, logout, updateUser, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'password'>('info')

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: {
      city: '',
      district: '',
      ward: '',
      address_line: ''
    }
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [defaultAddress, setDefaultAddress] = useState<AddressResponse | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch user addresses - MUST be called before any conditional returns
  const { data: addresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: userService.getAddresses,
    enabled: !!user && activeTab === 'info'
  })

  // Fetch user orders - MUST be called before any conditional returns
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderService.getMyOrders(1, 20),
    enabled: !!user && activeTab === 'orders'
  })

  const orders = ordersData?.orders || []

  // Update profile mutation - MUST be called before any conditional returns
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // Update user profile (name, phone)
      const userUpdate = {
        full_name: formData.full_name,
        phone: formData.phone
      }
      const updatedUser = await userService.updateProfile(userUpdate)

      // Update or create address
      const addressData = {
        name: 'Địa chỉ mặc định',
        receiver_name: formData.full_name,
        receiver_phone: formData.phone,
        city: formData.address.city,
        district: formData.address.district,
        ward: formData.address.ward || null,
        address_line: formData.address.address_line,
        is_default: true
      }

      if (defaultAddress) {
        // Update existing address
        await userService.updateAddress(defaultAddress.id, addressData)
      } else {
        // Create new address
        await userService.createAddress(addressData)
      }

      return updatedUser
    },
    onSuccess: (updatedUser) => {
      // Update user in context
      updateUser(updatedUser)
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] })
      alert('Cập nhật thông tin thành công!')
    },
    onError: (error: any) => {
      console.error('Profile update error:', error)
      alert('Cập nhật thông tin thất bại. Vui lòng thử lại!')
    }
  })

  // Change password mutation - MUST be called before any conditional returns
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string, new_password: string }) => {
      return await userService.changePassword(data)
    },
    onSuccess: () => {
      alert('Đổi mật khẩu thành công!')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: (error: any) => {
      console.error('Change password error:', error)
      alert(error.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại!')
    }
  })

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone: user.phone || ''
      }))
    }
  }, [user])

  // Load default address into form when addresses are fetched
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find(addr => addr.is_default) || addresses[0]
      setDefaultAddress(defaultAddr)
      setFormData(prev => ({
        ...prev,
        address: {
          city: defaultAddr.city,
          district: defaultAddr.district,
          ward: defaultAddr.ward || '',
          address_line: defaultAddr.address_line
        }
      }))
    }
  }, [addresses])

  // NOW we can do conditional returns - ALL HOOKS MUST BE ABOVE THIS LINE

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[rgb(var(--color-wood))] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate address fields
    if (!formData.address.city || !formData.address.district || !formData.address.address_line) {
      alert('Vui lòng điền đầy đủ thông tin địa chỉ!')
      return
    }

    updateProfileMutation.mutate()
  }


  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password confirmation
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Mật khẩu xác nhận không khớp!')
      return
    }

    // Validate password length
    if (passwordData.new_password.length < 8) {
      alert('Mật khẩu mới phải có ít nhất 8 ký tự!')
      return
    }

    // Call API
    changePasswordMutation.mutate({
      current_password: passwordData.current_password,
      new_password: passwordData.new_password
    })
  }

  const handleViewOrderDetails = (order: OrderResponse) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
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
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <AddressSelector
                      value={formData.address}
                      onChange={(address) => setFormData({ ...formData, address })}
                      required={false}
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
                    <a href="/products" className="btn-primary inline-block">
                      Mua sắm ngay
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(orders) && orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:border-[rgb(var(--color-wood))] transition">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-bold text-lg">#{order.id.toString().padStart(6, '0')}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {order.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : order.status === 'shipping' ? 'bg-purple-100 text-purple-800' : order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-600 text-sm">{order.items.length} sản phẩm</p>
                            <p className="font-bold text-[rgb(var(--color-wood))] text-xl">
                              {order.total_amount.toLocaleString('vi-VN')}₫
                            </p>
                          </div>
                          <button
                            onClick={() => handleViewOrderDetails(order as unknown as OrderResponse)}
                            className="btn-secondary"
                          >
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
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
