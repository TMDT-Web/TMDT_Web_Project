/**
 * Stock Receipt Management Page
 * Quản lý phiếu nhập kho
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

// Status mapping
const STATUS_MAP = {
  DRAFT: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' }
}

interface StockReceiptItem {
  id?: number
  product_id: number
  product_name?: string
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string
}

interface StockReceipt {
  id: number
  receipt_code: string
  supplier_name: string
  supplier_phone?: string
  supplier_email?: string
  supplier_address?: string
  total_amount: number
  notes?: string
  status: keyof typeof STATUS_MAP
  creator_id: number
  creator_name?: string
  created_at: string
  updated_at: string
  items: StockReceiptItem[]
}

interface Product {
  id: number
  name: string
  price: number
  stock_quantity: number
}

export default function StockReceiptManage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [receipts, setReceipts] = useState<StockReceipt[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceipt | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_phone: '',
    supplier_email: '',
    supplier_address: '',
    notes: '',
    items: [] as StockReceiptItem[]
  })

  // Block staff from accessing if needed (currently staff can access)
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // Fetch receipts
  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token')
      const params = new URLSearchParams()
      if (filterStatus && filterStatus !== 'ALL') {
        params.append('status', filterStatus)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/stock-receipts?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setReceipts(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('http://localhost:8000/api/v1/products?skip=0&limit=100', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Products fetched:', data.products?.length || 0, 'items')
        setProducts(data.products || [])
      } else {
        console.error('Failed to fetch products:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  useEffect(() => {
    fetchReceipts()
    fetchProducts()
  }, [filterStatus, searchTerm])

  // Create receipt
  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('http://localhost:8000/api/v1/stock-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowCreateModal(false)
        resetForm()
        fetchReceipts()
        alert('Tạo phiếu nhập thành công!')
      } else {
        const error = await response.json()
        alert(`Lỗi: ${error.detail || 'Không thể tạo phiếu nhập'}`)
      }
    } catch (error) {
      console.error('Failed to create receipt:', error)
      alert('Lỗi kết nối server')
    }
  }

  // Confirm receipt
  const handleConfirm = async (id: number) => {
    if (!confirm('Xác nhận phiếu nhập này? Hành động không thể hoàn tác.')) return

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(
        `http://localhost:8000/api/v1/stock-receipts/${id}/confirm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        fetchReceipts()
        alert('Đã xác nhận phiếu nhập và cập nhật kho!')
      } else {
        const error = await response.json()
        alert(`Lỗi: ${error.detail}`)
      }
    } catch (error) {
      console.error('Failed to confirm receipt:', error)
    }
  }

  // Cancel receipt
  const handleCancel = async (id: number) => {
    if (!confirm('Hủy phiếu nhập này?')) return

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(
        `http://localhost:8000/api/v1/stock-receipts/${id}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        fetchReceipts()
        alert('Đã hủy phiếu nhập!')
      } else {
        const error = await response.json()
        alert(`Lỗi: ${error.detail}`)
      }
    } catch (error) {
      console.error('Failed to cancel receipt:', error)
    }
  }

  // Delete receipt
  const handleDelete = async (id: number) => {
    if (!confirm('Xóa phiếu nhập này? Chỉ có thể xóa phiếu nháp.')) return

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(
        `http://localhost:8000/api/v1/stock-receipts/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        fetchReceipts()
        alert('Đã xóa phiếu nhập!')
      } else {
        const error = await response.json()
        alert(`Lỗi: ${error.detail}`)
      }
    } catch (error) {
      console.error('Failed to delete receipt:', error)
    }
  }

  // View details
  const handleViewDetail = async (id: number) => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(
        `http://localhost:8000/api/v1/stock-receipts/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSelectedReceipt(data)
        setShowDetailModal(true)
      }
    } catch (error) {
      console.error('Failed to fetch receipt detail:', error)
    }
  }

  // Add item to form
  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { product_id: 0, quantity: 1, unit_price: 0, subtotal: 0, notes: '' }
      ]
    })
  }

  // Update item
  const updateItem = (index: number, field: keyof StockReceiptItem, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto calculate subtotal
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].subtotal = newItems[index].quantity * newItems[index].unit_price
    }

    // Auto set unit price from product price
    if (field === 'product_id') {
      const product = products.find((p) => p.id === Number(value))
      if (product) {
        newItems[index].unit_price = product.price
        newItems[index].subtotal = newItems[index].quantity * product.price
      }
    }

    setFormData({ ...formData, items: newItems })
  }

  // Remove item
  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      supplier_name: '',
      supplier_phone: '',
      supplier_email: '',
      supplier_address: '',
      notes: '',
      items: []
    })
  }

  const totalAmount = formData.items.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý phiếu nhập</h1>
        <button
          onClick={() => {
            console.log('Opening modal, products available:', products.length)
            resetForm()
            setShowCreateModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Tạo phiếu nhập
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ALL">Tất cả</option>
              <option value="DRAFT">Nháp</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Mã phiếu, nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : receipts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có phiếu nhập nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã phiếu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Người tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(receipt.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {receipt.receipt_code}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{receipt.supplier_name}</div>
                      {receipt.supplier_phone && (
                        <div className="text-sm text-gray-500">{receipt.supplier_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {receipt.total_amount.toLocaleString('vi-VN')}đ
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          STATUS_MAP[receipt.status].color
                        }`}
                      >
                        {STATUS_MAP[receipt.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(receipt.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receipt.creator_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      {receipt.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleConfirm(receipt.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Xác nhận
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(receipt.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Xóa
                            </button>
                          )}
                        </>
                      )}
                      {receipt.status === 'CONFIRMED' && user?.role === 'admin' && (
                        <button
                          onClick={() => handleCancel(receipt.id)}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Tạo phiếu nhập mới</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Supplier Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Thông tin nhà cung cấp</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên nhà cung cấp *
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier_phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.supplier_email}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier_email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_address}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier_address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Sản phẩm nhập</h3>
                  <button
                    onClick={addItem}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    + Thêm sản phẩm
                  </button>
                </div>

                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-start p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="col-span-4">
                          <label className="block text-xs text-gray-600 mb-1">
                            Sản phẩm * {products.length > 0 && `(${products.length} sản phẩm)`}
                          </label>
                          <select
                            value={item.product_id}
                            onChange={(e) =>
                              updateItem(index, 'product_id', e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            required
                          >
                            <option value="0">Chọn sản phẩm</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">
                            Số lượng *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, 'quantity', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Đơn giá</label>
                          <input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(index, 'unit_price', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">
                            Thành tiền
                          </label>
                          <input
                            type="text"
                            value={item.subtotal.toLocaleString('vi-VN')}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                            disabled
                          />
                        </div>
                        <div className="col-span-2 flex items-end">
                          <button
                            onClick={() => removeItem(index)}
                            className="w-full px-2 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                          >
                            Xóa
                          </button>
                        </div>
                        {item.notes !== undefined && (
                          <div className="col-span-12">
                            <label className="block text-xs text-gray-600 mb-1">
                              Ghi chú
                            </label>
                            <input
                              type="text"
                              value={item.notes}
                              onChange={(e) => updateItem(index, 'notes', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Ghi chú về sản phẩm..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes and Total */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú chung
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Ghi chú về phiếu nhập..."
                  />
                </div>

                <div className="flex justify-end">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Tổng tiền:</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {totalAmount.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  !formData.supplier_name || formData.items.length === 0 || totalAmount === 0
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Tạo phiếu nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Phiếu nhập {selectedReceipt.receipt_code}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Tạo ngày {new Date(selectedReceipt.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    STATUS_MAP[selectedReceipt.status].color
                  }`}
                >
                  {STATUS_MAP[selectedReceipt.status].label}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Supplier Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Nhà cung cấp</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tên:</span>{' '}
                    <span className="font-medium">{selectedReceipt.supplier_name}</span>
                  </div>
                  {selectedReceipt.supplier_phone && (
                    <div>
                      <span className="text-gray-600">SĐT:</span>{' '}
                      <span className="font-medium">{selectedReceipt.supplier_phone}</span>
                    </div>
                  )}
                  {selectedReceipt.supplier_email && (
                    <div>
                      <span className="text-gray-600">Email:</span>{' '}
                      <span className="font-medium">{selectedReceipt.supplier_email}</span>
                    </div>
                  )}
                  {selectedReceipt.supplier_address && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Địa chỉ:</span>{' '}
                      <span className="font-medium">{selectedReceipt.supplier_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Danh sách sản phẩm</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Sản phẩm</th>
                        <th className="px-4 py-2 text-right">Số lượng</th>
                        <th className="px-4 py-2 text-right">Đơn giá</th>
                        <th className="px-4 py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedReceipt.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            {item.product_name || `Product #${item.product_id}`}
                            {item.notes && (
                              <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">
                            {item.unit_price.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {item.subtotal.toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                          Tổng cộng:
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-bold">
                          {selectedReceipt.total_amount.toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedReceipt.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Ghi chú</h3>
                  <p className="text-sm text-gray-600">{selectedReceipt.notes}</p>
                </div>
              )}

              {/* Creator */}
              <div className="text-sm text-gray-500">
                Người tạo: <span className="font-medium">{selectedReceipt.creator_name}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedReceipt(null)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
