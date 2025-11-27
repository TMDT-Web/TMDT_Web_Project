/**
 * Profile Page - User account management
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { orderService } from '@/services/order.service'
import { addressService, Province, District, Ward, UserAddress, CreateAddressData } from '@/services/address.service'
import { OrderStatus, OrderPaymentStatus } from '@/types'

export default function Profile() {
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'password'>('info')

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    // Note: address is managed through separate Address API, not in UserResponse
    address: ''
  })

  // Address state
  const [userAddress, setUserAddress] = useState<UserAddress | null>(null)
  const [addressData, setAddressData] = useState({
    province_code: 0,
    province_name: '',
    district_code: 0,
    district_name: '',
    ward_code: 0,
    ward_name: '',
    street_address: '',
    address_type: 'Nhà riêng' // Default value
  })

  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setIsLoadingProvinces(true)
        const data = await addressService.getProvinces()
        setProvinces(data || [])
      } catch (error) {
        console.error('Failed to load provinces:', error)
      } finally {
        setIsLoadingProvinces(false)
      }
    }
    loadProvinces()
  }, [])

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (addressData.province_code) {
        try {
          setIsLoadingDistricts(true)
          const data = await addressService.getDistrictsByProvince(addressData.province_code)
          setDistricts(data || [])
        } catch (error) {
          console.error('Failed to load districts:', error)
        } finally {
          setIsLoadingDistricts(false)
        }
      } else {
        setDistricts([])
        setWards([])
      }
    }
    loadDistricts()
  }, [addressData.province_code])

  // Load wards when district changes
  useEffect(() => {
    const loadWards = async () => {
      if (addressData.district_code) {
        try {
          setIsLoadingWards(true)
          const data = await addressService.getWardsByDistrict(addressData.district_code)
          setWards(data || [])
        } catch (error) {
          console.error('Failed to load wards:', error)
        } finally {
          setIsLoadingWards(false)
        }
      } else {
        setWards([])
      }
    }
    loadWards()
  }, [addressData.district_code])

  // Fetch user orders - MUST be called before any conditional returns (Rules of Hooks)
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderService.getMyOrders(1, 20),
    enabled: activeTab === 'orders' && !!user // Only fetch when orders tab is active AND user is logged in
  })

  const orders = ordersData?.orders || []

  // Fetch user addresses
  const { data: addresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => addressService.getMyAddresses(),
    enabled: !!user
  })

  // Update formData when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: ''
      }))
    }
  }, [user])

  // Set default address when addresses are loaded
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0]
      setUserAddress(defaultAddr)
    }
  }, [addresses])

  // Reverse lookup address codes when userAddress and provinces are available
  useEffect(() => {
    const syncAddress = async () => {
      if (userAddress && provinces.length > 0) {
        // 1. Find Province
        const province = provinces.find(p => p.name === userAddress.city)
        if (!province) return

        // 2. Find District
        // We need to fetch districts to find the code
        const districtsList = await addressService.getDistrictsByProvince(province.code)
        const district = districtsList.find(d => d.name === userAddress.district)

        if (!district) {
          // Partial match (only province)
          setAddressData(prev => ({
            ...prev,
            province_code: province.code,
            province_name: province.name,
            street_address: userAddress.address_line,
            address_type: userAddress.name === 'Văn phòng' ? 'Văn phòng' : 'Nhà riêng'
          }))
          setDistricts(districtsList)
          return
        }

        // 3. Find Ward
        const wardsList = await addressService.getWardsByDistrict(district.code)
        const ward = wardsList.find(w => w.name === userAddress.ward)

        setAddressData({
          province_code: province.code,
          province_name: province.name,
          district_code: district.code,
          district_name: district.name,
          ward_code: ward?.code || 0,
          ward_name: ward?.name || '',
          street_address: userAddress.address_line,
          address_type: userAddress.name === 'Văn phòng' ? 'Văn phòng' : 'Nhà riêng'
        })

        // Update lists so dropdowns are populated
        setDistricts(districtsList)
        setWards(wardsList)
      }
    }

    syncAddress()
  }, [userAddress, provinces])

  // Redirect to login if not authenticated (only after loading is complete)
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login')
    }
  }, [isLoading, user, navigate])

  // Define all functions BEFORE any conditional returns to avoid React error #310
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 1. Update User Profile
      await authService.updateProfile({
        full_name: formData.full_name,
        phone: formData.phone
      })

      // 2. Update/Create Address
      // Validate address fields
      if (addressData.province_name && addressData.district_name && addressData.ward_name && addressData.street_address) {
        const addressPayload: CreateAddressData = {
          name: addressData.address_type, // Use selected type
          receiver_name: formData.full_name,
          receiver_phone: formData.phone,
          address_line: addressData.street_address,
          ward: addressData.ward_name,
          district: addressData.district_name,
          city: addressData.province_name,
          is_default: true
        }

        if (userAddress) {
          await addressService.updateAddress(userAddress.id, addressPayload)
        } else {
          await addressService.createAddress(addressPayload)
        }
      }

      // 3. Refresh data
      await queryClient.invalidateQueries({ queryKey: ['my-addresses'] })
      alert('Cập nhật thông tin thành công!')
      window.location.reload()

    } catch (error) {
      console.error('Update failed:', error)
      alert('Cập nhật thất bại. Vui lòng thử lại!')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Mật khẩu xác nhận không khớp!')
      return
    }

    try {
      await authService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password
      })
      alert('Đổi mật khẩu thành công!')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error: any) {
      console.error('Change password error:', error)
      const message = error.response?.data?.detail || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.'
      alert(message)
    }
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

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
        <div className="container-custom flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[rgb(var(--color-wood))] rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while redirecting to login
  if (!user) {
    return (
      <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
        <div className="container-custom flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-[rgb(var(--color-wood))] rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Đang chuyển hướng...</p>
          </div>
        </div>
      </div>
    )
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
                  {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="font-bold text-lg">{user.full_name || 'Người dùng'}</h3>
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Tỉnh/Thành phố</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={addressData.province_code}
                        onChange={(e) => {
                          const code = Number(e.target.value)
                          const province = provinces.find(p => p.code === code)
                          setAddressData({
                            ...addressData,
                            province_code: code,
                            province_name: province?.name || '',
                            district_code: 0,
                            district_name: '',
                            ward_code: 0,
                            ward_name: ''
                          })
                        }}
                      >
                        <option value={0}>-- Chọn Tỉnh/Thành phố --</option>
                        {provinces.map((province) => (
                          <option key={province.code} value={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Quận/Huyện</label>
                      <select
                        disabled={!addressData.province_code || isLoadingDistricts}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={addressData.district_code}
                        onChange={(e) => {
                          const code = Number(e.target.value)
                          const district = districts.find(d => d.code === code)
                          setAddressData({
                            ...addressData,
                            district_code: code,
                            district_name: district?.name || '',
                            ward_code: 0,
                            ward_name: ''
                          })
                        }}
                      >
                        <option value={0}>
                          {isLoadingDistricts ? 'Đang tải...' : '-- Chọn Quận/Huyện --'}
                        </option>
                        {districts.map((district) => (
                          <option key={district.code} value={district.code}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Phường/Xã</label>
                      <select
                        disabled={!addressData.district_code || isLoadingWards}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={addressData.ward_code}
                        onChange={(e) => {
                          const code = Number(e.target.value)
                          const ward = wards.find(w => w.code === code)
                          setAddressData({
                            ...addressData,
                            ward_code: code,
                            ward_name: ward?.name || ''
                          })
                        }}
                      >
                        <option value={0}>
                          {isLoadingWards ? 'Đang tải...' : '-- Chọn Phường/Xã --'}
                        </option>
                        {wards.map((ward) => (
                          <option key={ward.code} value={ward.code}>
                            {ward.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Số nhà, tên đường</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                        value={addressData.street_address}
                        onChange={(e) => setAddressData({ ...addressData, street_address: e.target.value })}
                        placeholder="Ví dụ: Số 123, Đường Nguyễn Văn A"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Loại địa chỉ</label>
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="address_type"
                            value="Nhà riêng"
                            checked={addressData.address_type === 'Nhà riêng'}
                            onChange={(e) => setAddressData({ ...addressData, address_type: e.target.value })}
                            className="w-4 h-4 text-[rgb(var(--color-wood))] focus:ring-[rgb(var(--color-wood))]"
                          />
                          <span className="ml-2">Nhà riêng</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="address_type"
                            value="Văn phòng"
                            checked={addressData.address_type === 'Văn phòng'}
                            onChange={(e) => setAddressData({ ...addressData, address_type: e.target.value })}
                            className="w-4 h-4 text-[rgb(var(--color-wood))] focus:ring-[rgb(var(--color-wood))]"
                          />
                          <span className="ml-2">Văn phòng</span>
                        </label>
                      </div>
                    </div>
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

                {isLoadingOrders ? (
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
    </div>
  )
}
