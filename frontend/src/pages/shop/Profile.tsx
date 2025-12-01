/**
 * Profile Page - User account management with address management
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { orderService } from '@/services/order.service'
import { OrderStatus, OrderPaymentStatus } from '@/types'
import addressData from '@/utils/vietnam-address.json'
import { AddressesService } from '@/client/services/AddressesService'
import type { AddressCreate } from '@/client/models/AddressCreate'
import type { AddressUpdate } from '@/client/models/AddressUpdate'
import type { AddressResponse } from '@/client/models/AddressResponse'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'orders' | 'password'>('info')

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: ''
  })

  // Address management state
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const [addressForm, setAddressForm] = useState({
    receiver_name: '',
    receiver_phone: '',
    city_code: '',
    city_name: '',
    district_code: '',
    district_name: '',
    ward_code: '',
    ward_name: '',
    street: '',
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

  // Load addresses
  useEffect(() => {
    loadAddressesFromDB()
  }, [])

  const loadAddressesFromDB = async () => {
    try {
      const res = await AddressesService.getMyAddressesApiV1AddressesGet()
      setAddresses(res)
    } catch (err) {
      console.error('Load addresses error', err)
    }
  }

  const cities = addressData
  const districts = addressForm.city_code ? cities.find(c => c.code === addressForm.city_code)?.districts || [] : []
  const wards = addressForm.district_code ? districts.find(d => d.code === addressForm.district_code)?.wards || [] : []

  // Fetch user orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderService.getMyOrders(1, 20),
    enabled: activeTab === 'orders'
  })

  const orders = ordersData?.orders || []

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

  // Address management functions
  const openAddNewAddress = () => {
    setAddressForm({
      receiver_name: formData.full_name,
      receiver_phone: formData.phone,
      city_code: '',
      city_name: '',
      district_code: '',
      district_name: '',
      ward_code: '',
      ward_name: '',
      street: '',
    })
    setEditingAddressId(null)
    setIsAddingAddress(true)
  }

  const openEditAddress = (addr: AddressResponse) => {
    const city = cities.find(c => c.name === addr.city)
    const district = city?.districts.find(d => d.name === addr.district)
    const ward = district?.wards.find(w => w.name === addr.ward)

    setAddressForm({
      receiver_name: addr.receiver_name,
      receiver_phone: addr.receiver_phone,
      city_code: city?.code || '',
      city_name: addr.city,
      district_code: district?.code || '',
      district_name: addr.district,
      ward_code: ward?.code || '',
      ward_name: addr.ward,
      street: addr.address_line,
    })
    setEditingAddressId(addr.id)
    setIsAddingAddress(true)
  }

  const cancelAddressForm = () => {
    setIsAddingAddress(false)
    setEditingAddressId(null)
    setAddressForm({
      receiver_name: '',
      receiver_phone: '',
      city_code: '',
      city_name: '',
      district_code: '',
      district_name: '',
      ward_code: '',
      ward_name: '',
      street: '',
    })
  }

  const saveAddress = async () => {
    if (!addressForm.street || !addressForm.city_code || !addressForm.district_code || !addressForm.ward_code) {
      alert('Vui lòng nhập đầy đủ địa chỉ!')
      return
    }

    try {
      if (editingAddressId) {
        // UPDATE existing address
        const payload: AddressUpdate = {
          receiver_name: addressForm.receiver_name,
          receiver_phone: addressForm.receiver_phone,
          address_line: addressForm.street,
          city: addressForm.city_name,
          district: addressForm.district_name,
          ward: addressForm.ward_name,
          postal_code: '',
          notes: '',
          is_default: false,
        }
        await AddressesService.updateAddressApiV1AddressesAddressIdPut(editingAddressId, payload)
        alert('Đã cập nhật địa chỉ!')
      } else {
        // CREATE new address
        const payload: AddressCreate = {
          name: 'Địa chỉ chính',
          receiver_name: addressForm.receiver_name,
          receiver_phone: addressForm.receiver_phone,
          address_line: addressForm.street,
          city: addressForm.city_name,
          district: addressForm.district_name,
          ward: addressForm.ward_name,
          postal_code: '',
          notes: '',
          is_default: false,
        }
        await AddressesService.createAddressApiV1AddressesPost(payload)
        alert('Đã tạo địa chỉ mới!')
      }
      cancelAddressForm()
      loadAddressesFromDB()
    } catch (err) {
      console.error(err)
      alert('Lỗi khi lưu địa chỉ!')
    }
  }

  const deleteAddress = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa địa chỉ này?')) return
    try {
      await AddressesService.deleteAddressApiV1AddressesAddressIdDelete(id)
      alert('Đã xóa địa chỉ!')
      loadAddressesFromDB()
    } catch (err) {
      console.error(err)
      alert('Lỗi khi xóa địa chỉ!')
    }
  }

  const setDefaultAddress = async (id: number) => {
    try {
      const addr = addresses.find(a => a.id === id)
      if (!addr) return
      const payload: AddressUpdate = {
        ...addr,
        is_default: true,
      }
      await AddressesService.updateAddressApiV1AddressesAddressIdPut(id, payload)
      loadAddressesFromDB()
    } catch (err) {
      console.error(err)
      alert('Lỗi khi cập nhật địa chỉ mặc định!')
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
                    {user.vip_tier === 'diamond' ? '💎 Diamond VIP' : user.vip_tier === 'gold' ? '🥇 Gold VIP' : user.vip_tier === 'silver' ? '🥈 Silver VIP' : '⭐ Member'}
                  </span>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTab === 'info'
                      ? 'bg-[rgb(var(--color-wood))] text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Thông tin cá nhân
                </button>

                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTab === 'addresses'
                      ? 'bg-[rgb(var(--color-wood))] text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Địa chỉ của tôi
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTab === 'orders'
                      ? 'bg-[rgb(var(--color-wood))] text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Đơn hàng của tôi
                </button>

                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTab === 'password'
                      ? 'bg-[rgb(var(--color-wood))] text-white'
                      : 'hover:bg-gray-100'
                  }`}
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
                        {user.vip_tier === 'diamond' ? '💎 Diamond VIP' : 
                         user.vip_tier === 'gold' ? '🥇 Gold VIP' : 
                         user.vip_tier === 'silver' ? '🥈 Silver VIP' : 
                         '⭐ Member'}
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

                  <button type="submit" className="btn-primary">
                    Cập nhật thông tin
                  </button>
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-2xl">Địa chỉ của tôi</h2>
                  <button
                    onClick={openAddNewAddress}
                    disabled={isAddingAddress}
                    className="px-4 py-2 bg-[rgb(var(--color-wood))] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                  >
                    + Thêm địa chỉ
                  </button>
                </div>

                {/* ADD/EDIT ADDRESS FORM */}
                {isAddingAddress && (
                  <div className="border-2 border-[rgb(var(--color-moss))] bg-green-50 rounded-lg p-6 mb-6 space-y-4">
                    <h3 className="font-semibold text-lg">{editingAddressId ? 'Cập nhật' : 'Thêm'} địa chỉ</h3>

                    <div>
                      <label className="block text-sm font-medium mb-2">Tên người nhận</label>
                      <input
                        type="text"
                        className="w-full border px-4 py-3 rounded-lg"
                        placeholder="Nhập tên người nhận"
                        value={addressForm.receiver_name}
                        onChange={(e) => setAddressForm({ ...addressForm, receiver_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                      <input
                        type="text"
                        className="w-full border px-4 py-3 rounded-lg"
                        placeholder="Nhập số điện thoại"
                        value={addressForm.receiver_phone}
                        onChange={(e) => setAddressForm({ ...addressForm, receiver_phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Tỉnh / Thành phố</label>
                      <select
                        className="w-full border px-4 py-3 rounded-lg"
                        value={addressForm.city_code}
                        onChange={(e) => {
                          const city = cities.find(c => c.code === e.target.value)
                          setAddressForm({
                            ...addressForm,
                            city_code: e.target.value,
                            city_name: city?.name || '',
                            district_code: '',
                            district_name: '',
                            ward_code: '',
                            ward_name: '',
                          })
                        }}
                      >
                        <option value="">-- Chọn tỉnh/thành phố --</option>
                        {cities.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Quận / Huyện</label>
                      <select
                        className="w-full border px-4 py-3 rounded-lg"
                        value={addressForm.district_code}
                        disabled={!addressForm.city_code}
                        onChange={(e) => {
                          const city = cities.find(c => c.code === addressForm.city_code)
                          const district = city?.districts.find(d => d.code === e.target.value)
                          setAddressForm({
                            ...addressForm,
                            district_code: e.target.value,
                            district_name: district?.name || '',
                            ward_code: '',
                            ward_name: '',
                          })
                        }}
                      >
                        <option value="">-- Chọn quận/huyện --</option>
                        {districts.map(d => (
                          <option key={d.code} value={d.code}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phường / Xã</label>
                      <select
                        className="w-full border px-4 py-3 rounded-lg"
                        value={addressForm.ward_code}
                        disabled={!addressForm.district_code}
                        onChange={(e) => {
                          const city = cities.find(c => c.code === addressForm.city_code)
                          const district = city?.districts.find(d => d.code === addressForm.district_code)
                          const ward = district?.wards.find(w => w.code === e.target.value)
                          setAddressForm({
                            ...addressForm,
                            ward_code: e.target.value,
                            ward_name: ward?.name || '',
                          })
                        }}
                      >
                        <option value="">-- Chọn phường/xã --</option>
                        {wards.map(w => (
                          <option key={w.code} value={w.code}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Số nhà & Tên đường</label>
                      <input
                        type="text"
                        className="w-full border px-4 py-3 rounded-lg"
                        placeholder="Nhập số nhà và tên đường"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        onClick={cancelAddressForm}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={saveAddress}
                        className="px-4 py-2 bg-[rgb(var(--color-moss))] text-white rounded-lg hover:opacity-90 transition"
                      >
                        {editingAddressId ? 'Cập nhật' : 'Thêm'} địa chỉ
                      </button>
                    </div>
                  </div>
                )}

                {/* ADDRESSES LIST */}
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map(addr => (
                      <div
                        key={addr.id}
                        className={`border-2 rounded-lg p-4 transition ${
                          addr.is_default
                            ? 'border-[rgb(var(--color-wood))] bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{addr.receiver_name}</p>
                              <span className="text-sm text-gray-500">• {addr.receiver_phone}</span>
                            </div>
                            <p className="text-sm text-gray-700">{addr.address_line}</p>
                            <p className="text-sm text-gray-600">{addr.ward}, {addr.district}, {addr.city}</p>
                          </div>
                          {addr.is_default && (
                            <span className="px-3 py-1 bg-[rgb(var(--color-wood))] text-white text-xs font-medium rounded">
                              Mặc định
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 pt-3 border-t">
                          {!addr.is_default && (
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              className="px-3 py-1 text-xs border border-[rgb(var(--color-wood))] text-[rgb(var(--color-wood))] rounded hover:bg-amber-50 transition"
                            >
                              Đặt làm mặc định
                            </button>
                          )}
                          <button
                            onClick={() => openEditAddress(addr)}
                            className="px-3 py-1 text-xs border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => deleteAddress(addr.id)}
                            className="px-3 py-1 text-xs border border-red-500 text-red-600 rounded hover:bg-red-50 transition"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8 italic">Chưa có địa chỉ nào. Hãy thêm địa chỉ đầu tiên!</p>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h2 className="font-bold text-2xl mb-6">Đơn hàng của tôi</h2>
                
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Đang tải...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(orders) && orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold">Đơn hàng #{order.id}</p>
                            <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <span className={`px-3 py-1 rounded text-sm font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipping' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {getStatusText(order.status as OrderStatus)}
                          </span>
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
