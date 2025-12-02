/**
 * Collection Management Page
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CollectionsService, ProductsService, UploadService } from '@/client'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/ConfirmModal'

export default function CollectionManage() {
  const toast = useToast()
  const { confirm } = useConfirm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    banner_url: '',
    is_active: true,
    sale_price: ''
  })
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: collectionsData, refetch } = useQuery({
    queryKey: ['collections'],
    queryFn: () => CollectionsService.getCollectionsApiV1CollectionsGet({})
  })

  const collections = collectionsData?.collections || []

  const { data: productsData } = useQuery({
    queryKey: ['products-for-collection'],
    queryFn: () => ProductsService.getProductsApiV1ProductsGet({ limit: 100 })
  })

  const products = productsData?.products || []

  const handleCreate = () => {
    setEditingCollection(null)
    setFormData({ name: '', slug: '', description: '', banner_url: '', is_active: true, sale_price: '' })
    setSelectedProducts([])
    setBannerFile(null)
    setBannerPreview('')
    setIsModalOpen(true)
  }

  const handleEdit = (collection: any) => {
    setEditingCollection(collection)
    setFormData({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || '',
      banner_url: collection.banner_url || '',
      is_active: collection.is_active ?? true,
      sale_price: collection.sale_price?.toString() || ''
    })
    setBannerPreview(collection.banner_url || '')
    setBannerFile(null)
    setSelectedProducts([]) // Products would need to be loaded separately
    setIsModalOpen(true)
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    })
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const toggleProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let bannerUrl = formData.banner_url

      if (bannerFile) {
        const response = await UploadService.uploadImageApiV1UploadImagePost({
          formData: { file: bannerFile },
          subfolder: 'banners'
        })
        bannerUrl = response.url
      }

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        banner_url: bannerUrl || undefined,
        is_active: formData.is_active,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : undefined
      }

      if (editingCollection) {
        await CollectionsService.updateCollectionApiV1CollectionsCollectionIdPut({
          collectionId: editingCollection.id,
          requestBody: payload as any
        })
        
        // Add/remove products if needed
        if (selectedProducts.length > 0) {
          await CollectionsService.addProductsToCollectionApiV1CollectionsCollectionIdProductsPost({
            collectionId: editingCollection.id,
            requestBody: { product_ids: selectedProducts }
          })
        }
      } else {
        const newCollection = await CollectionsService.createCollectionApiV1CollectionsPost({ requestBody: payload as any })
        
        // Add products to new collection
        if (selectedProducts.length > 0 && newCollection.id) {
          await CollectionsService.addProductsToCollectionApiV1CollectionsCollectionIdProductsPost({
            collectionId: newCollection.id,
            requestBody: { product_ids: selectedProducts }
          })
        }
      }

      refetch()
      setIsModalOpen(false)
      toast.success(editingCollection ? 'Cập nhật bộ sưu tập thành công!' : 'Thêm bộ sưu tập thành công!')
    } catch (error: any) {
      console.error('Error saving collection:', error)
      toast.error(`Lỗi: ${error.body?.detail || error.message || 'Không thể lưu bộ sưu tập'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Xóa bộ sưu tập',
      message: 'Bạn có chắc chắn muốn xóa bộ sưu tập này?',
      type: 'danger',
      confirmText: 'Xóa',
      cancelText: 'Hủy'
    })
    if (!confirmed) return

    try {
      await CollectionsService.deleteCollectionApiV1CollectionsCollectionIdDelete({ collectionId: id })
      refetch()
      toast.success('Xóa bộ sưu tập thành công!')
    } catch (error: any) {
      console.error('Error deleting collection:', error)
      toast.error(`Lỗi: ${error.body?.detail || error.message || 'Không thể xóa bộ sưu tập'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Quản lý bộ sưu tập</h2>
          <p className="text-gray-600 mt-1">Tổng {collections?.length || 0} bộ sưu tập</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Thêm bộ sưu tập
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.isArray(collections) && collections.map((collection: any) => (
          <div key={collection.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
            {collection.banner_url && (
              <img src={collection.banner_url} alt={collection.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-slate-800">{collection.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${collection.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {collection.is_active ? 'Hoạt động' : 'Tắt'}
                </span>
              </div>
              {collection.sale_price && (
                <p className="text-lg font-bold text-red-600 mb-2">
                  Giá ưu đãi: {collection.sale_price.toLocaleString('vi-VN')}₫
                </p>
              )}
              <p className="text-sm text-gray-600 mb-3">{collection.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(collection)}
                  className="flex-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(collection.id)}
                  className="flex-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-semibold">
                {editingCollection ? 'Sửa bộ sưu tập' : 'Thêm bộ sưu tập mới'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tên bộ sưu tập *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug (URL)</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mô tả</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Giá ưu đãi khi mua cả bộ (VNĐ)</label>
                <input
                  type="number"
                  placeholder="Để trống nếu không có giá ưu đãi"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Giá khuyến mãi khi khách mua cả bộ sưu tập thay vì mua từng sản phẩm</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Banner (Ảnh bìa)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {bannerPreview && (
                  <img src={bannerPreview} alt="Banner" className="mt-2 w-full h-40 object-cover rounded-lg" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Chọn sản phẩm cho bộ sưu tập</label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {Array.isArray(products) && products.map((product: any) => (
                    <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">{product.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Đã chọn {selectedProducts.length} sản phẩm</p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Bộ sưu tập hoạt động</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
