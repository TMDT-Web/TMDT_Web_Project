/**
 * Banner Management Page - Admin UI for managing homepage banners
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UploadService } from '@/client'
import { Image, Link as LinkIcon } from 'lucide-react'
import { formatImageUrl } from '@/utils/format'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/ConfirmModal'

// Note: API client will be regenerated after backend is running
// For now, we'll create placeholder types
interface Banner {
  id: number
  title: string
  subtitle?: string
  image_url: string
  link_url?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface BannerFormData {
  title: string
  subtitle: string
  image_url?: string
  link_url: string
  display_order: number
  is_active: boolean
}

export default function BannerManage() {
  const toast = useToast()
  const { confirm } = useConfirm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    link_url: '',
    display_order: 0,
    is_active: true
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // TODO: Replace with actual API call after regenerating client
  const { data: bannersData, refetch } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/v1/banners', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch banners')
      return response.json()
    }
  })

  const banners: Banner[] = bannersData?.banners || []

  const handleCreate = () => {
    setEditingBanner(null)
    setFormData({
      title: '',
      subtitle: '',
      link_url: '',
      display_order: 0,
      is_active: true
    })
    setImageFile(null)
    setImagePreview('')
    setIsModalOpen(true)
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      link_url: banner.link_url || '',
      display_order: banner.display_order,
      is_active: banner.is_active
    })
    setImagePreview(banner.image_url)
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.warning('Vui lòng chọn file ảnh (JPG, PNG, WebP)')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
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
          'banners'
        )
        imageUrl = response.url
      }

      // Validate required fields
      if (!imageUrl && !editingBanner) {
        toast.warning('Vui lòng chọn ảnh banner')
        setIsSubmitting(false)
        return
      }

      const payload = {
        ...formData,
        image_url: imageUrl
      }

      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      if (editingBanner) {
        // Update
        await fetch(`http://localhost:8000/api/v1/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        })
      } else {
        // Create
        await fetch('http://localhost:8000/api/v1/banners', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })
      }

      refetch()
      setIsModalOpen(false)
      toast.success(editingBanner ? 'Cập nhật banner thành công!' : 'Thêm banner thành công!')
    } catch (error: any) {
      console.error('Error saving banner:', error)
      toast.error(`Lỗi: ${error.message || 'Không thể lưu banner'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Xóa banner',
      message: 'Bạn có chắc chắn muốn xóa banner này?',
      type: 'danger',
      confirmText: 'Xóa',
      cancelText: 'Hủy'
    })
    if (!confirmed) return

    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:8000/api/v1/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      refetch()
      toast.success('Xóa banner thành công!')
    } catch (error: any) {
      console.error('Error deleting banner:', error)
      toast.error(`Lỗi: ${error.message || 'Không thể xóa banner'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Quản lý Banner Trang Chủ</h2>
          <p className="text-gray-600 mt-1">Tổng {banners.length} banner</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Thêm Banner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
            <div className="flex gap-4">
              {/* Banner Preview */}
              <div className="w-64 h-40 flex-shrink-0 bg-gray-100">
                <img
                  src={formatImageUrl(banner.image_url)}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Banner Info */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-sm text-gray-600 mt-1">{banner.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${banner.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {banner.is_active ? 'Đang hiển thị' : 'Đã ẩn'}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        Thứ tự: {banner.display_order}
                      </span>
                    </div>
                  </div>

                  {banner.link_url && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 mt-2">
                      <LinkIcon className="w-4 h-4" />
                      <span className="truncate">{banner.link_url}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium border border-blue-200"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="flex-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium border border-red-200"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Chưa có banner nào. Hãy tạo banner đầu tiên!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-semibold">
                {editingBanner ? 'Sửa Banner' : 'Thêm Banner Mới'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tiêu đề *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Giảm giá mùa hè 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phụ đề</label>
                <input
                  type="text"
                  maxLength={300}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Giảm đến 50% trên tất cả sản phẩm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Hình ảnh Banner *
                  <span className="text-xs text-gray-500 ml-2">(Khuyến nghị: 1920x600px, dưới 5MB)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Link đích (URL)
                  <span className="text-xs text-gray-500 ml-2">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: /products hoặc https://example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Khi người dùng click vào banner sẽ chuyển đến URL này
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Số nhỏ hơn hiển thị trước</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Trạng thái</label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="font-medium">Hiển thị banner</span>
                  </label>
                </div>
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
