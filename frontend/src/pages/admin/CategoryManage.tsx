/**
 * Category Management Page
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductsService, UploadService } from '@/client'

interface CategoryFormData {
  name: string
  slug: string
  description: string
  image_url?: string
}

export default function CategoryManage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: categoriesData, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () => ProductsService.getCategoriesApiV1ProductsCategoriesGet()
  })

  const categories = categoriesData || []

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({ name: '', slug: '', description: '' })
    setImageFile(null)
    setImagePreview('')
    setIsModalOpen(true)
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    })
    setImagePreview(category.image_url || '')
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let imageUrl = imagePreview

      // Upload image if changed
      if (imageFile) {
        const response = await UploadService.uploadImageApiV1UploadImagePost(
          { file: imageFile },
          'categories'
        )
        imageUrl = response.url
      }

      const payload = {
        ...formData,
        image_url: imageUrl || undefined
      }

      if (editingCategory) {
        await ProductsService.updateCategoryApiV1ProductsCategoriesCategoryIdPut(
          editingCategory.id,
          payload as any
        )
      } else {
        await ProductsService.createCategoryApiV1ProductsCategoriesPost(payload as any)
      }

      refetch()
      setIsModalOpen(false)
    } catch (error: any) {
      console.error('Error saving category:', error)
      alert(`Lỗi: ${error.body?.detail || error.message || 'Không thể lưu danh mục'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      return
    }

    try {
      await ProductsService.deleteCategoryApiV1ProductsCategoriesCategoryIdDelete(id)
      refetch()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      alert(`Lỗi: ${error.body?.detail || error.message || 'Không thể xóa danh mục'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Quản lý danh mục</h2>
          <p className="text-gray-600 mt-1">Tổng {categories?.length || 0} danh mục</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Thêm danh mục
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(categories) && categories.map((category: any) => (
          <div key={category.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
            {category.image_url && (
              <img src={category.image_url} alt={category.name} className="w-full h-32 object-cover rounded-md mb-3" />
            )}
            <h3 className="font-semibold text-lg text-slate-800">{category.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{category.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="flex-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="flex-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tên danh mục *</label>
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
                <label className="block text-sm font-medium mb-2">Hình ảnh</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
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
