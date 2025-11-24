/**
 * Admin Product Management - CRUD table with search, filter, edit modal
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductsService } from '@/client'
import ProductForm from '@/components/admin/ProductForm'
import type { ProductResponse } from '@/client'
import { formatImageUrl } from '@/utils/format'

export default function ProductManage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null)

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => ProductsService.getProductsApiV1ProductsGet(undefined, 100)
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => ProductsService.getCategoriesApiV1ProductsCategoriesGet()
  })

  const categories = categoriesData || []
  const products = productsData?.products || []

  // Filter products
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category_id === parseInt(selectedCategory)
    return matchesSearch && matchesCategory
  })

  const handleEdit = (product: ProductResponse) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return

    try {
      await ProductsService.deleteProductApiV1ProductsProductIdDelete(productId)
      refetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Không thể xóa sản phẩm')
    }
  }

  const handleFormSuccess = () => {
    refetchProducts()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Quản lý sản phẩm</h2>
          <p className="text-gray-600 mt-1">Tổng {products.length} sản phẩm</p>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          onClick={handleCreate}
        >
          + Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Tất cả danh mục</option>
          {Array.isArray(categories) && categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {productsLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ảnh</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tên sản phẩm</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Danh mục</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Giá</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tồn kho</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trạng thái</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                Array.isArray(filteredProducts) && filteredProducts.map((product: any) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                        {product.image_url ? (
                          <img src={formatImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.slug}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {categories?.find((c: any) => c.id === product.category_id)?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">
                      {formatPrice(product.price)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{product.stock || 0}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="text-blue-600 hover:text-blue-700 px-2 py-1 text-sm font-medium"
                        onClick={() => handleEdit(product)}
                      >
                        Sửa
                      </button>
                      <button
                        className="text-red-600 hover:text-red-700 px-2 py-1 text-sm font-medium ml-2"
                        onClick={() => handleDelete(product.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProduct(null)
        }}
        onSuccess={handleFormSuccess}
        editingProduct={editingProduct}
        categories={categories || []}
      />
    </div>
  )
}
