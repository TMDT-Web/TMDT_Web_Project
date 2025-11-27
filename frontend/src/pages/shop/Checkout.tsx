/**
 * Checkout Page - Order checkout with shipping info
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { orderService } from '@/services/order.service'
import { PaymentGateway } from '@/types'
import { formatImageUrl } from '@/utils/format'
import { addressService, Province, District, Ward } from '@/services/address.service'
import { useQuery } from '@tanstack/react-query'

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    shipping_contact_name: user?.full_name || '',
    shipping_contact_phone: user?.phone || '',
    province_code: 0,
    province_name: '',
    district_code: 0,
    district_name: '',
    ward_code: 0,
    ward_name: '',
    street_address: '',
    address_type: 'Nhà riêng',
    notes: '',
    payment_gateway: 'cod' as PaymentGateway,
    use_reward_points: false
  })

  // State for managing address data
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load all provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setIsLoadingProvinces(true)
        setLoadError(null)
        const data = await addressService.getProvinces()
        if (!data || data.length === 0) {
          throw new Error('Không có dữ liệu tỉnh/thành phố')
        }
        setProvinces(data)
      } catch (error) {
        console.error('Failed to load provinces:', error)
        setLoadError('Không thể tải danh sách tỉnh/thành phố. Vui lòng kiểm tra kết nối internet và tải lại trang.')
      } finally {
        setIsLoadingProvinces(false)
      }
    }
    loadProvinces()
  }, [])

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (formData.province_code) {
        try {
          setIsLoadingDistricts(true)
          const data = await addressService.getDistrictsByProvince(formData.province_code)
          setDistricts(data)
        } catch (error) {
          console.error('Failed to load districts:', error)
        } finally {
          setIsLoadingDistricts(false)
        }
      } else {
        setDistricts([])
      }
    }
    // Only load if districts are empty or don't match province (optimization)
    // But for simplicity, just load. The check is handled by the dependency.
    loadDistricts()
  }, [formData.province_code])

  // Load wards when district changes
  useEffect(() => {
    const loadWards = async () => {
      if (formData.district_code) {
        try {
          setIsLoadingWards(true)
          const data = await addressService.getWardsByDistrict(formData.district_code)
          setWards(data)
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
  }, [formData.district_code])

  // Fetch user addresses for pre-filling
  const { data: addresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => addressService.getMyAddresses(),
    enabled: !!user
  })

  // Pre-fill form with default address
  useEffect(() => {
    const syncAddress = async () => {
      // Only run if we have addresses, provinces, and the form is not yet filled (or we want to force fill default)
      // Checking province_code === 0 ensures we don't overwrite user's manual changes if they navigate away and back? 
      // Actually, navigation unmounts component, so state is lost anyway.
      if (addresses && addresses.length > 0 && provinces.length > 0 && formData.province_code === 0) {
        const defaultAddr = addresses.find(a => a.is_default) || addresses[0]

        // Find Province
        const province = provinces.find(p => p.name === defaultAddr.city)
        if (!province) return

        // Load Districts
        const districtsList = await addressService.getDistrictsByProvince(province.code)
        const district = districtsList.find(d => d.name === defaultAddr.district)

        if (!district) {
          setFormData(prev => ({
            ...prev,
            shipping_contact_name: defaultAddr.receiver_name || user?.full_name || '',
            shipping_contact_phone: defaultAddr.receiver_phone || user?.phone || '',
            street_address: defaultAddr.address_line,
            address_type: defaultAddr.name === 'Văn phòng' ? 'Văn phòng' : 'Nhà riêng',
            province_code: province.code,
            province_name: province.name
          }))
          setDistricts(districtsList)
          return
        }

        // Load Wards
        const wardsList = await addressService.getWardsByDistrict(district.code)
        const ward = wardsList.find(w => w.name === defaultAddr.ward)

        setFormData(prev => ({
          ...prev,
          shipping_contact_name: defaultAddr.receiver_name || user?.full_name || '',
          shipping_contact_phone: defaultAddr.receiver_phone || user?.phone || '',
          street_address: defaultAddr.address_line,
          address_type: defaultAddr.name === 'Văn phòng' ? 'Văn phòng' : 'Nhà riêng',
          province_code: province.code,
          province_name: province.name,
          district_code: district.code,
          district_name: district.name,
          ward_code: ward?.code || 0,
          ward_name: ward?.name || ''
        }))

        setDistricts(districtsList)
        setWards(wardsList)
      }
    }
    syncAddress()
  }, [addresses, provinces, user, formData.province_code])

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

    // Validate address fields
    if (!formData.province_code || !formData.province_name) {
      alert('Vui lòng chọn Tỉnh/Thành phố!')
      return
    }
    if (!formData.district_code || !formData.district_name) {
      alert('Vui lòng chọn Quận/Huyện!')
      return
    }
    if (!formData.ward_code || !formData.ward_name) {
      alert('Vui lòng chọn Phường/Xã!')
      return
    }
    if (!formData.street_address || !formData.street_address.trim()) {
      alert('Vui lòng nhập Số nhà, tên đường!')
      return
    }

    // Combine address fields into a single string
    const fullAddress = [
      `(${formData.address_type}) ${formData.street_address.trim()}`,
      formData.ward_name,
      formData.district_name,
      formData.province_name
    ].filter(Boolean).join(', ')

    // Map form data and cart items to backend API structure
    const orderPayload: any = {
      full_name: formData.shipping_contact_name,
      phone_number: formData.shipping_contact_phone,
      shipping_address: fullAddress,
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
    console.log('Full address:', fullAddress) // Debug log

    createOrderMutation.mutate(orderPayload)
  }

  return (
    <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
      <div className="container-custom">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Thanh toán</h1>

        {/* Error Message */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-red-800 font-medium">{loadError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Tải lại trang
                </button>
              </div>
            </div>
          </div>
        )}

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
                    <label className="block text-sm font-medium mb-2">Tỉnh/Thành phố *</label>
                    <select
                      required
                      disabled={isLoadingProvinces}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={formData.province_code}
                      onChange={(e) => {
                        const code = Number(e.target.value)
                        const province = provinces.find(p => p.code === code)
                        setFormData({
                          ...formData,
                          province_code: code,
                          province_name: province?.name || '',
                          district_code: 0,
                          district_name: '',
                          ward_code: 0,
                          ward_name: ''
                        })
                      }}
                    >
                      <option value={0}>
                        {isLoadingProvinces ? 'Đang tải...' : '-- Chọn Tỉnh/Thành phố --'}
                      </option>
                      {provinces.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Quận/Huyện *</label>
                    <select
                      required
                      disabled={!formData.province_code || isLoadingDistricts}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={formData.district_code}
                      onChange={(e) => {
                        const code = Number(e.target.value)
                        const district = districts.find(d => d.code === code)
                        setFormData({
                          ...formData,
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
                    <label className="block text-sm font-medium mb-2">Phường/Xã *</label>
                    <select
                      required
                      disabled={!formData.district_code || isLoadingWards}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={formData.ward_code}
                      onChange={(e) => {
                        const code = Number(e.target.value)
                        const ward = wards.find(w => w.code === code)
                        setFormData({
                          ...formData,
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
                    <label className="block text-sm font-medium mb-2">Số nhà, tên đường *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Số 123, Đường Nguyễn Văn A"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                      value={formData.street_address}
                      onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
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
                          checked={formData.address_type === 'Nhà riêng'}
                          onChange={(e) => setFormData({ ...formData, address_type: e.target.value })}
                          className="w-4 h-4 text-[rgb(var(--color-wood))] focus:ring-[rgb(var(--color-wood))]"
                        />
                        <span className="ml-2">Nhà riêng</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="address_type"
                          value="Văn phòng"
                          checked={formData.address_type === 'Văn phòng'}
                          onChange={(e) => setFormData({ ...formData, address_type: e.target.value })}
                          className="w-4 h-4 text-[rgb(var(--color-wood))] focus:ring-[rgb(var(--color-wood))]"
                        />
                        <span className="ml-2">Văn phòng</span>
                      </label>
                    </div>
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
