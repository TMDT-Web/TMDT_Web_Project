/**
 * Stock Receipt Management Page
 * Quản lý phiếu nhập kho
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

// Status mapping (backend returns lowercase)
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' }
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
  status: string // 'draft' | 'confirmed' | 'completed' | 'cancelled'
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
  const [isEditMode, setIsEditMode] = useState(false)
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
      const token = localStorage.getItem('token')
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
        console.log('Stock receipts fetched:', data.receipts?.length || 0, 'receipts')
        setReceipts(data.receipts || [])
      } else {
        console.error('Failed to fetch receipts:', response.status, response.statusText)
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
      const token = localStorage.getItem('token')
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
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/v1/stock-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setShowCreateModal(false)
        resetForm()
        await fetchReceipts() // Wait for refresh
        alert(`✅ Tạo phiếu nhập thành công!\n\nMã phiếu: ${data.receipt_code}\nTổng tiền: ${data.total_amount.toLocaleString('vi-VN')} VND`)
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể tạo phiếu nhập'}`)
      }
    } catch (error) {
      console.error('Failed to create receipt:', error)
      alert('❌ Lỗi kết nối server')
    }
  }

  // Confirm receipt
  const handleConfirm = async (id: number) => {
    if (!confirm('Xác nhận phiếu nhập này? Hành động không thể hoàn tác.')) return

    try {
      const token = localStorage.getItem('token')
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
        await fetchReceipts()
        alert('✅ Đã xác nhận phiếu nhập và cập nhật kho!')
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail}`)
      }
    } catch (error) {
      console.error('Failed to confirm receipt:', error)
    }
  }

  // Cancel receipt
  const handleCancelReceipt = async (id: number) => {
    if (!confirm('Hủy phiếu nhập này?')) return

    try {
      const token = localStorage.getItem('token')
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
        await fetchReceipts()
        alert('✅ Đã hủy phiếu nhập!')
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail}`)
      }
    } catch (error) {
      console.error('Failed to cancel receipt:', error)
    }
  }

  // Delete receipt
  const handleDelete = async (id: number) => {
    if (!confirm('Xóa phiếu nhập này? Chỉ có thể xóa phiếu nháp.')) return

    try {
      const token = localStorage.getItem('token')
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
      const token = localStorage.getItem('token')
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
        setIsEditMode(false)
        setShowDetailModal(true)
      }
    } catch (error) {
      console.error('Failed to fetch receipt detail:', error)
    }
  }

  const handleEditReceipt = () => {
    if (selectedReceipt) {
      setFormData({
        supplier_name: selectedReceipt.supplier_name,
        supplier_phone: selectedReceipt.supplier_phone || '',
        supplier_email: selectedReceipt.supplier_email || '',
        supplier_address: selectedReceipt.supplier_address || '',
        notes: selectedReceipt.notes || '',
        items: selectedReceipt.items.map(item => ({
          ...item,
          product_id: item.product_id
        }))
      })
      setIsEditMode(true)
    }
  }

  const handleUpdateReceipt = async () => {
    if (!selectedReceipt) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:8000/api/v1/stock-receipts/${selectedReceipt.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            supplier_name: formData.supplier_name,
            supplier_phone: formData.supplier_phone || undefined,
            supplier_email: formData.supplier_email || undefined,
            supplier_address: formData.supplier_address || undefined,
            notes: formData.notes || undefined,
            items: formData.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              notes: item.notes || undefined
            }))
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Cập nhật thành công!\nMã phiếu: ${data.receipt_code}`)
        await fetchReceipts()
        setIsEditMode(false)
        setShowDetailModal(false)
        setSelectedReceipt(null)
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể cập nhật phiếu nhập'}`)
      }
    } catch (error) {
      console.error('Failed to update receipt:', error)
      alert('❌ Lỗi khi cập nhật phiếu nhập')
    }
  }

  const handleCancelEdit = async () => {
    if (selectedReceipt) {
      await handleViewDetail(selectedReceipt.id)
    }
    setIsEditMode(false)
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
              <option value="draft">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
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
        ) : receipts.filter(receipt => {
          // Filter by status
          if (filterStatus !== 'ALL' && receipt.status !== filterStatus) return false
          // Filter by search term
          if (searchTerm && !receipt.receipt_code.toLowerCase().includes(searchTerm.toLowerCase()) && 
              !receipt.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) return false
          return true
        }).length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không tìm thấy phiếu nhập nào</div>
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
                {receipts.filter(receipt => {
                  if (filterStatus !== 'ALL' && receipt.status !== filterStatus) return false
                  if (searchTerm && !receipt.receipt_code.toLowerCase().includes(searchTerm.toLowerCase()) && 
                      !receipt.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) return false
                  return true
                }).map((receipt) => (
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
                          STATUS_MAP[receipt.status]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STATUS_MAP[receipt.status]?.label || receipt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(receipt.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receipt.creator_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetail(receipt.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Xem chi tiết"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Xem
                        </button>
                        {receipt.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleConfirm(receipt.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                              title="Xác nhận phiếu nhập"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Xác nhận
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleDelete(receipt.id)}
                                className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                title="Xóa phiếu nhập"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Xóa
                              </button>
                            )}
                          </>
                        )}
                        {receipt.status === 'confirmed' && user?.role === 'admin' && (
                          <button
                            onClick={() => handleCancelReceipt(receipt.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                            title="Hủy phiếu nhập"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Hủy
                          </button>
                        )}
                      </div>
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
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">
                            &nbsp;
                          </label>
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

      {/* Detail Modal - Enhanced UI */}
      {showDetailModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="text-white">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedReceipt.receipt_code}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 text-blue-100 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(selectedReceipt.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 text-sm font-semibold rounded-full shadow-lg ${
                    STATUS_MAP[selectedReceipt.status]?.color || 'bg-white text-gray-800'
                  }`}
                >
                  {STATUS_MAP[selectedReceipt.status]?.label || selectedReceipt.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-purple-600">Số sản phẩm</p>
                      <p className="text-2xl font-bold text-purple-900">{selectedReceipt.items.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-600">Tổng tiền</p>
                      <p className="text-xl font-bold text-green-900">{selectedReceipt.total_amount.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-3 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-orange-600">Người tạo</p>
                      <p className="text-base font-bold text-orange-900 truncate">{selectedReceipt.creator_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Info Card */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-white border-b border-gray-200 px-5 py-3">
                  <div className="flex items-center gap-2 text-gray-900 font-semibold">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Thông tin nhà cung cấp
                  </div>
                </div>
                {isEditMode ? (
                  <div className="p-5 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Tên nhà cung cấp *</label>
                      <input
                        type="text"
                        value={formData.supplier_name}
                        onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        value={formData.supplier_phone}
                        onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.supplier_email}
                        onChange={(e) => setFormData({ ...formData, supplier_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        value={formData.supplier_address}
                        onChange={(e) => setFormData({ ...formData, supplier_address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-5 grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Tên nhà cung cấp</p>
                        <p className="font-semibold text-gray-900">{selectedReceipt.supplier_name}</p>
                      </div>
                    </div>
                  {selectedReceipt.supplier_phone && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Số điện thoại</p>
                        <p className="font-semibold text-gray-900">{selectedReceipt.supplier_phone}</p>
                      </div>
                    </div>
                  )}
                    {selectedReceipt.supplier_email && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                          <p className="font-semibold text-gray-900">{selectedReceipt.supplier_email}</p>
                        </div>
                      </div>
                    )}
                    {selectedReceipt.supplier_address && (
                      <div className="flex items-start gap-3 col-span-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Địa chỉ</p>
                          <p className="font-semibold text-gray-900">{selectedReceipt.supplier_address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-white border-b border-gray-200 px-5 py-3">
                  <div className="flex items-center gap-2 text-gray-900 font-semibold">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Danh sách sản phẩm
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sản phẩm</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Số lượng</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Đơn giá</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedReceipt.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.product_name || `Product #${item.product_id}`}
                                </p>
                                {item.notes && (
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-gray-600">
                            {item.unit_price.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-gray-900">
                            {item.subtotal.toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-t-2 border-blue-300 px-5 py-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-700">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedReceipt.total_amount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {isEditMode ? (
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
                  <label className="block font-semibold text-yellow-900 mb-2">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    rows={3}
                    placeholder="Nhập ghi chú..."
                  />
                </div>
              ) : selectedReceipt.notes ? (
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-yellow-900 mb-1">Ghi chú</p>
                      <p className="text-sm text-yellow-800">{selectedReceipt.notes}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl flex justify-between gap-3">
              <div>
                {selectedReceipt.status === 'draft' && !isEditMode && (
                  <button
                    onClick={handleEditReceipt}
                    className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Chỉnh sửa
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white hover:shadow-md transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleUpdateReceipt}
                      className="inline-flex items-center px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 hover:shadow-lg transition-all"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lưu thay đổi
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedReceipt(null)
                      setIsEditMode(false)
                    }}
                    className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white hover:shadow-md transition-all"
                  >
                    Đóng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
