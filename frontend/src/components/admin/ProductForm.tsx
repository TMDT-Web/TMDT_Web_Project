/**
 * Product Form Component - Create/Edit Products
 * Complex form with image upload, category selection, and JSON specs builder
 */
import { useState, useEffect } from 'react'
import { ProductsService, UploadService } from '@/client'
import type { ProductResponse, CategoryResponse } from '@/client'

interface ProductFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingProduct?: ProductResponse | null
  categories: CategoryResponse[]
}

interface SpecPair {
  key: string
  value: string
}

export default function ProductForm({ isOpen, onClose, onSuccess, editingProduct, categories }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    sale_price: '',
    stock: '',
    category_id: '',
    is_featured: false,
    is_active: true,
    weight: ''
  })

  // Dimensions state
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
    unit: 'cm'
  })

  // Specs state (material, color, etc.)
  const [specs, setSpecs] = useState<SpecPair[]>([{ key: '', value: '' }])

  // Images state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([])

  // Image URL paste state
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState<string>('')
  const [additionalUrlsInput, setAdditionalUrlsInput] = useState<string>('')
  const [useUrlForThumbnail, setUseUrlForThumbnail] = useState(false)
  const [useUrlForAdditional, setUseUrlForAdditional] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  // Load editing product data
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        slug: editingProduct.slug,
        description: editingProduct.description || '',
        short_description: editingProduct.short_description || '',
        price: editingProduct.price.toString(),
        sale_price: editingProduct.sale_price?.toString() || '',
        stock: editingProduct.stock?.toString() || '0',
        category_id: editingProduct.category_id.toString(),
        is_featured: editingProduct.is_featured,
        is_active: editingProduct.is_active,
        weight: editingProduct.weight?.toString() || ''
      })

      // Load dimensions from JSON
      if (editingProduct.dimensions) {
        const dims = editingProduct.dimensions as any
        setDimensions({
          length: dims.length || '',
          width: dims.width || '',
          height: dims.height || '',
          unit: dims.unit || 'cm'
        })
      }

      // Load specs from JSON
      if (editingProduct.specs) {
        const specsObj = editingProduct.specs as any
        const specPairs: SpecPair[] = Object.entries(specsObj).map(([key, value]) => ({
          key,
          value: String(value)
        }))
        setSpecs(specPairs.length > 0 ? specPairs : [{ key: '', value: '' }])
      }

      // Load existing images
      if (editingProduct.thumbnail_url) {
        setThumbnailPreview(editingProduct.thumbnail_url)
      }
      if (editingProduct.images && Array.isArray(editingProduct.images)) {
        setAdditionalPreviews(editingProduct.images as string[])
      }
    } else {
      // Reset form
      resetForm()
    }
  }, [editingProduct, isOpen])

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      price: '',
      sale_price: '',
      stock: '',
      category_id: '',
      is_featured: false,
      is_active: true,
      weight: ''
    })
    setDimensions({ length: '', width: '', height: '', unit: 'cm' })
    setSpecs([{ key: '', value: '' }])
    setThumbnailFile(null)
    setThumbnailPreview('')
    setAdditionalFiles([])
    setAdditionalPreviews([])
    setThumbnailUrlInput('')
    setAdditionalUrlsInput('')
    setUseUrlForThumbnail(false)
    setUseUrlForAdditional(false)
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }))
  }

  // Handle thumbnail upload
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  // Handle additional images
  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAdditionalFiles(files)
    setAdditionalPreviews(files.map(f => URL.createObjectURL(f)))
  }

  // Download image from URL
  const downloadImageFromUrl = async (imageUrl: string, subfolder: string = 'products'): Promise<string> => {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/v1/upload/image-from-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ image_url: imageUrl, subfolder })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to download image')
    }

    const data = await response.json()
    return data.url
  }

  // Specs management
  const addSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }])
  }

  const removeSpecRow = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index))
  }

  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...specs]
    updated[index][field] = value
    setSpecs(updated)
  }

  // Upload images to server
  const uploadImages = async (): Promise<{ thumbnail: string; images: string[] }> => {
    setUploadProgress('Uploading images...')
    const uploadedImages: string[] = []

    // Upload/Download thumbnail
    let thumbnailUrl = thumbnailPreview
    if (useUrlForThumbnail && thumbnailUrlInput.trim()) {
      // Download from URL
      setUploadProgress('Downloading thumbnail from URL...')
      thumbnailUrl = await downloadImageFromUrl(thumbnailUrlInput.trim(), 'products')
    } else if (thumbnailFile) {
      // Upload file
      setUploadProgress('Uploading thumbnail...')
      const response = await UploadService.uploadImageApiV1UploadImagePost(
        { file: thumbnailFile },
        'products'
      )
      thumbnailUrl = response.url
    }

    // Upload/Download additional images
    if (useUrlForAdditional && additionalUrlsInput.trim()) {
      // Parse URLs (comma or newline separated)
      const urls = additionalUrlsInput.split(/[,\n]/).map(u => u.trim()).filter(u => u)
      setUploadProgress(`Downloading ${urls.length} images from URLs...`)
      for (const url of urls) {
        const downloaded = await downloadImageFromUrl(url, 'products')
        uploadedImages.push(downloaded)
      }
    } else if (additionalFiles.length > 0) {
      // Upload files
      setUploadProgress(`Uploading ${additionalFiles.length} images...`)
      for (const file of additionalFiles) {
        const response = await UploadService.uploadImageApiV1UploadImagePost(
          { file },
          'products'
        )
        uploadedImages.push(response.url)
      }
    } else {
      // Keep existing images if editing
      uploadedImages.push(...additionalPreviews)
    }

    return { thumbnail: thumbnailUrl, images: uploadedImages }
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setUploadProgress('')

    try {
      // Upload images first
      const { thumbnail, images } = await uploadImages()

      // Build dimensions JSON
      const dimensionsJson = dimensions.length && dimensions.width && dimensions.height
        ? {
          length: parseFloat(dimensions.length),
          width: parseFloat(dimensions.width),
          height: parseFloat(dimensions.height),
          unit: dimensions.unit
        }
        : null

      // Build specs JSON (filter out empty entries)
      const specsJson: Record<string, any> = {}
      specs.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          specsJson[spec.key.trim()] = spec.value.trim()
        }
      })

      // Prepare final payload
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : undefined,
        stock: parseInt(formData.stock) || 0,
        category_id: parseInt(formData.category_id),
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        thumbnail_url: thumbnail,
        images,
        dimensions: dimensionsJson,
        specs: Object.keys(specsJson).length > 0 ? specsJson : null
      }

      setUploadProgress('Saving product...')

      // Create or Update
      if (editingProduct) {
        await ProductsService.updateProductApiV1ProductsProductIdPut(
          editingProduct.id,
          payload as any
        )
      } else {
        await ProductsService.createProductApiV1ProductsPost(payload as any)
      }

      setUploadProgress('Success!')
      setTimeout(() => {
        onSuccess()
        onClose()
        resetForm()
      }, 500)
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert(`Lỗi: ${error.body?.detail || error.message || 'Không thể lưu sản phẩm'}`)
    } finally {
      setIsSubmitting(false)
      setUploadProgress('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-slate-800">
              {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VNĐ) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giá khuyến mãi (VNĐ)</label>
              <input
                type="number"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tồn kho *</label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Chọn danh mục --</option>
                {Array.isArray(categories) && categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trọng lượng (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả ngắn</label>
            <textarea
              rows={2}
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Dimensions */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Kích thước</h3>
            <div className="grid grid-cols-4 gap-3">
              <input
                type="number"
                step="0.1"
                placeholder="Dài"
                value={dimensions.length}
                onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Rộng"
                value={dimensions.width}
                onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Cao"
                value={dimensions.height}
                onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={dimensions.unit}
                onChange={(e) => setDimensions({ ...dimensions, unit: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cm">cm</option>
                <option value="m">m</option>
                <option value="inch">inch</option>
              </select>
            </div>
          </div>

          {/* Specs (Key-Value Pairs) */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">Thông số kỹ thuật</h3>
              <button
                type="button"
                onClick={addSpecRow}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Thêm thông số
              </button>
            </div>
            <div className="space-y-2">
              {Array.isArray(specs) && specs.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tên (vd: Chất liệu)"
                    value={spec.key}
                    onChange={(e) => updateSpec(index, 'key', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Giá trị (vd: Gỗ sồi tự nhiên)"
                    value={spec.value}
                    onChange={(e) => updateSpec(index, 'value', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {specs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecRow(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Image Uploads */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Hình ảnh</h3>

            {/* Thumbnail */}
            <div className="mb-4 p-4 border border-gray-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">Ảnh đại diện *</label>

              {/* Toggle between file upload and URL */}
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useUrlForThumbnail}
                    onChange={() => setUseUrlForThumbnail(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Upload file</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useUrlForThumbnail}
                    onChange={() => setUseUrlForThumbnail(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Paste URL</span>
                </label>
              </div>

              {!useUrlForThumbnail ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              ) : (
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={thumbnailUrlInput}
                  onChange={(e) => setThumbnailUrlInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              {thumbnailPreview && (
                <img src={thumbnailPreview} alt="Thumbnail" className="mt-2 w-32 h-32 object-cover rounded-lg border" />
              )}
            </div>

            {/* Additional Images */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">Ảnh bổ sung</label>

              {/* Toggle between file upload and URL */}
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useUrlForAdditional}
                    onChange={() => setUseUrlForAdditional(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Upload files</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useUrlForAdditional}
                    onChange={() => setUseUrlForAdditional(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Paste URLs</span>
                </label>
              </div>

              {!useUrlForAdditional ? (
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImagesChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              ) : (
                <textarea
                  rows={3}
                  placeholder="Paste URLs (one per line or comma-separated)&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  value={additionalUrlsInput}
                  onChange={(e) => setAdditionalUrlsInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              {additionalPreviews.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {Array.isArray(additionalPreviews) && additionalPreviews.map((url, idx) => (
                    <img key={idx} src={url} alt={`Additional ${idx}`} className="w-24 h-24 object-cover rounded-lg border" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Sản phẩm nổi bật</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Đang bán</span>
            </label>
          </div>

          {/* Progress */}
          {uploadProgress && (
            <div className="text-center text-blue-600 font-medium">
              {uploadProgress}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
