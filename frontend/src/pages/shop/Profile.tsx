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
import NotificationSettings from '@/components/NotificationSettings'
import type { AddressResponse } from '@/client/models/AddressResponse'
import type { OrderResponse } from '@/client/models/OrderResponse'
import type { LoyaltyInfo } from '@/client/models/LoyaltyInfo'

export default function Profile() {
  const { user, logout, updateUser, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'password' | 'loyalty' | 'notifications'>('info')

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

  // Fetch loyalty info - MUST be called before any conditional returns
  const { data: loyaltyData } = useQuery<LoyaltyInfo>({
    queryKey: ['my-loyalty'],
    queryFn: userService.getLoyaltyInfo,
    enabled: !!user && activeTab === 'loyalty'
  })

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
    onSuccess: (updatedUser: any) => {
      // Update user in context
      updateUser(updatedUser as any)
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
                
                {/* VIP Badge */}
                <div className="mt-3 flex justify-center">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    user.vip_tier === 'diamond'
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg'
                      : user.vip_tier === 'gold'
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg'
                      : user.vip_tier === 'silver'
                      ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {user.vip_tier === 'diamond' ? 'Diamond VIP' : user.vip_tier === 'gold' ? 'Gold VIP' : user.vip_tier === 'silver' ? 'Silver VIP' : 'Member'}
                  </span>
                </div>
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
                  onClick={() => setActiveTab('loyalty')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'loyalty' ? 'bg-[rgb(var(--color-wood))] text-white' : 'hover:bg-gray-100'}`}
                >
                  Chương trình Loyalty
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'notifications' ? 'bg-[rgb(var(--color-wood))] text-white' : 'hover:bg-gray-100'}`}
                >
                  Cài đặt thông báo
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
                
                {/* VIP Info Card */}
                <div className={`mb-6 p-4 rounded-lg border-2 ${
                  user.vip_tier === 'diamond'
                    ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-300'
                    : user.vip_tier === 'gold'
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
                    : user.vip_tier === 'silver'
                    ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Hạng thành viên</p>
                      <p className={`text-xl font-bold ${
                        user.vip_tier === 'diamond' ? 'text-cyan-600' :
                        user.vip_tier === 'gold' ? 'text-yellow-600' :
                        user.vip_tier === 'silver' ? 'text-gray-600' :
                        'text-gray-500'
                      }`}>
                        {user.vip_tier === 'diamond' ? 'Diamond VIP' : 
                         user.vip_tier === 'gold' ? 'Gold VIP' : 
                         user.vip_tier === 'silver' ? 'Silver VIP' : 
                         'Member'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Điểm tích lũy</p>
                      <p className="text-xl font-bold text-[rgb(var(--color-wood))]">{user.loyalty_points || 0}</p>
                    </div>
                  </div>
                </div>
                
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
                            {order.note && (
                              <p className="text-sm text-gray-600 mt-1 truncate max-w-[280px]">
                                Ghi chú: {order.note}
                              </p>
                            )}
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

            {/* Loyalty Tab */}
            {activeTab === 'loyalty' && (
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="font-bold text-2xl mb-6">Chương trình Loyalty</h2>
                
                {loyaltyData && (
                  <div className="space-y-6">
                    {/* Current Tier Card */}
                    <div className={`p-6 rounded-xl ${
                      loyaltyData.current_tier === 'diamond'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                        : loyaltyData.current_tier === 'gold'
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                        : loyaltyData.current_tier === 'silver'
                        ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                        : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm opacity-90 mb-1">Hạng hiện tại</p>
                          <h3 className="text-3xl font-bold">
                            {loyaltyData.current_tier === 'diamond' ? 'Diamond' : 
                             loyaltyData.current_tier === 'gold' ? 'Gold' : 
                             loyaltyData.current_tier === 'silver' ? 'Silver' : 
                             'Member'}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-90 mb-1">Chiết khấu</p>
                          <p className="text-3xl font-bold">{loyaltyData.tier_discount}%</p>
                        </div>
                      </div>
                      <div className="border-t border-white/20 pt-4">
                        <p className="text-sm opacity-90 mb-1">Điểm tích lũy</p>
                        <p className="text-2xl font-bold">{loyaltyData.current_points} điểm</p>
                      </div>
                    </div>

                    {/* Progress to Next Tier */}
                    {loyaltyData.next_tier && (
                      <div className="bg-gray-50 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-lg">Hạng tiếp theo</h4>
                          <span className="text-lg font-bold">
                            {loyaltyData.next_tier === 'diamond' ? 'Diamond' : 
                             loyaltyData.next_tier === 'gold' ? 'Gold' : 
                             loyaltyData.next_tier === 'silver' ? 'Silver' : 
                             loyaltyData.next_tier}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[rgb(var(--color-wood))] to-[rgb(var(--color-moss))]"
                              style={{ 
                                width: `${Math.min(100, (loyaltyData.current_points / (loyaltyData.current_points + loyaltyData.points_to_next_tier)) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Còn <span className="font-bold text-[rgb(var(--color-wood))]">{loyaltyData.points_to_next_tier} điểm</span> để lên hạng
                        </p>
                      </div>
                    )}

                    {/* Tier Benefits */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-xl p-4">
                        <h4 className="font-semibold mb-2">Cách tích điểm</h4>
                        <p className="text-sm text-gray-600">Mỗi 1 triệu VND chi tiêu = 100 điểm</p>
                      </div>
                      <div className="border border-gray-200 rounded-xl p-4">
                        <h4 className="font-semibold mb-2">Quyền lợi</h4>
                        <p className="text-sm text-gray-600">Chiết khấu {loyaltyData.tier_discount}% cho mọi đơn hàng</p>
                      </div>
                    </div>

                    {/* Tier Thresholds */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h4 className="font-semibold mb-4">Các hạng thành viên</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b">
                          <span className="font-medium">Member</span>
                          <span className="text-sm text-gray-600">0 - 999 điểm (0%)</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b">
                          <span className="font-medium">Silver</span>
                          <span className="text-sm text-gray-600">1,000 - 4,999 điểm (5%)</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b">
                          <span className="font-medium">Gold</span>
                          <span className="text-sm text-gray-600">5,000 - 9,999 điểm (10%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Diamond</span>
                          <span className="text-sm text-gray-600">10,000+ điểm (15%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loyalty Tab */}
            {activeTab === 'loyalty' && (
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="font-bold text-2xl mb-6">Chương trình Loyalty</h2>
                
                {loyaltyData && (
                  <div className="space-y-6">
                    {/* Current Tier Card */}
                    <div className={`p-6 rounded-xl border-2 ${
                      loyaltyData.current_tier === 'diamond'
                        ? 'bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-300'
                        : loyaltyData.current_tier === 'gold'
                        ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-300'
                        : loyaltyData.current_tier === 'silver'
                        ? 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-300'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Hạng hiện tại</p>
                          <p className={`text-3xl font-bold ${
                            loyaltyData.current_tier === 'diamond' ? 'text-cyan-600' :
                            loyaltyData.current_tier === 'gold' ? 'text-yellow-600' :
                            loyaltyData.current_tier === 'silver' ? 'text-gray-600' :
                            'text-gray-500'
                          }`}>
                            {loyaltyData.current_tier === 'diamond' ? 'Diamond VIP' : 
                             loyaltyData.current_tier === 'gold' ? 'Gold VIP' : 
                             loyaltyData.current_tier === 'silver' ? 'Silver VIP' : 
                             'Member'}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Ưu đãi giảm giá: <span className="font-bold text-[rgb(var(--color-wood))]">{loyaltyData.tier_discount}%</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">Điểm tích lũy</p>
                          <p className="text-4xl font-bold text-[rgb(var(--color-wood))]">{loyaltyData.current_points}</p>
                        </div>
                      </div>
                      
                      {/* Progress to next tier */}
                      {loyaltyData.next_tier && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-600">
                              Tiến trình lên hạng{' '}
                              <span className={`font-bold ${
                                loyaltyData.next_tier === 'diamond' ? 'text-cyan-600' :
                                loyaltyData.next_tier === 'gold' ? 'text-yellow-600' :
                                loyaltyData.next_tier === 'silver' ? 'text-gray-600' :
                                'text-gray-500'
                              }`}>
                                {loyaltyData.next_tier === 'diamond' ? 'Diamond' : 
                                 loyaltyData.next_tier === 'gold' ? 'Gold' : 
                                 loyaltyData.next_tier === 'silver' ? 'Silver' : 
                                 'Member'}
                              </span>
                            </p>
                            <p className="text-sm font-medium">
                              Còn <span className="text-[rgb(var(--color-wood))]">{loyaltyData.points_to_next_tier}</span> điểm
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-[rgb(var(--color-wood))] to-[rgb(var(--color-moss))] h-3 rounded-full transition-all"
                              style={{ width: `${(loyaltyData.current_points / (loyaltyData.current_points + (loyaltyData.points_to_next_tier || 0))) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tier Benefits */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="font-bold text-lg mb-4">Quyền lợi theo hạng thành viên</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="font-medium mb-2">⭐ Member (0-999 điểm)</p>
                          <p className="text-sm text-gray-600">Giảm giá: <span className="font-bold text-[rgb(var(--color-wood))]">{loyaltyData.tier_discount}%</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                          <p className="font-medium mb-2">🥈 Silver (1,000-4,999 điểm)</p>
                          <p className="text-sm text-gray-600">Giảm giá: <span className="font-bold">5%</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-yellow-300">
                          <p className="font-medium mb-2">🥇 Gold (5,000-9,999 điểm)</p>
                          <p className="text-sm text-gray-600">Giảm giá: <span className="font-bold">10%</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-cyan-300">
                          <p className="font-medium mb-2">💎 Diamond (10,000+ điểm)</p>
                          <p className="text-sm text-gray-600">Giảm giá: <span className="font-bold">15%</span></p>
                        </div>
                      </div>
                    </div>

                    {/* How to earn points */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <h3 className="font-bold text-lg mb-3">Cách tích điểm</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                          <span className="text-[rgb(var(--color-wood))] mr-2">✓</span>
                          <span>Hoàn thành đơn hàng: <span className="font-bold">100 điểm / 1 triệu VNĐ</span></span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[rgb(var(--color-wood))] mr-2">✓</span>
                          <span>Điểm được cộng tự động khi đơn hàng hoàn thành</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[rgb(var(--color-wood))] mr-2">✓</span>
                          <span>Hạng VIP tự động nâng cấp khi đạt đủ điểm</span>
                        </li>
                      </ul>
                    </div>
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

            {/* Notification Settings Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <NotificationSettings />
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
