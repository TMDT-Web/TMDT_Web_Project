/**
 * Product Detail Page - Scandinavian Minimal Design
 * Using Generated OpenAPI Client
 */
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ProductsService } from '@/client'
import type { ProductResponse } from '@/client'
import { useCart } from '@/context/CartContext'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  
  const [product, setProduct] = useState<ProductResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (slug) {
      loadProduct()
    }
  }, [slug])

  const loadProduct = async () => {
    if (!slug) return
    
    try {
      setLoading(true)
      setError(null)
      // Use generated client - type-safe API call
      const data = await ProductsService.getProductBySlugApiV1ProductsSlugSlugGet(slug)
      setProduct(data)
    } catch (err) {
      console.error('Error loading product:', err)
      setError('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="section-padding">
        <div className="container-custom flex justify-center items-center min-h-[400px]">
          <div className="animate-spin w-12 h-12 border-4 border-[rgb(var(--color-wood))] border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="section-padding">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-semibold mb-4">
            {error || 'Sản phẩm không tồn tại'}
          </h2>
          {error && (
            <button 
              onClick={loadProduct}
              className="mb-4 text-blue-600 underline hover:text-blue-800"
            >
              Thử lại
            </button>
          )}
          <Link to="/products" className="btn-primary inline-block">Quay lại shop</Link>
        </div>
      </div>
    )
  }

  // Use images array from generated client (already URLs, not nested objects)
  const images = product.images && product.images.length > 0 
    ? product.images
    : ['https://via.placeholder.com/800x800?text=' + encodeURIComponent(product.name)]

  const handleQuantityChange = (value: number) => {
    const stock = product?.stock ?? 0
    setQuantity(Math.max(1, Math.min(value, stock)))
  }

  const handleAddToCart = () => {
    if (!product) return
    addItem(product, quantity)
    alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`)
  }

  const handleBuyNow = () => {
    if (!product) return
    addItem(product, quantity)
    navigate('/cart')
  }

  const discount = product.sale_price 
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0

  return (
    <div className="bg-[rgb(var(--color-bg-light))] min-h-screen">
      <div className="container-custom py-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-[rgb(var(--color-wood))]">Trang chủ</Link>
          <span>›</span>
          <Link to="/products" className="hover:text-[rgb(var(--color-wood))]">Sản phẩm</Link>
          <span>›</span>
          <span className="text-[rgb(var(--color-primary))]">{product.name}</span>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setIsFullscreen(false)}>
          <button className="absolute top-6 right-6 text-white text-4xl hover:text-gray-300">×</button>
          <img src={images[selectedImage]} alt={product.name} className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="container-custom pb-20">
        <div className="grid lg:grid-cols-2 gap-12 bg-white rounded-2xl p-8 md:p-12 shadow-sm">
          <div>
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 cursor-zoom-in relative group" onClick={() => setIsFullscreen(true)}>
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              {discount > 0 && <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">-{discount}%</div>}
              <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">🔍 Click để phóng to</div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-[rgb(var(--color-primary))] scale-105' : 'border-gray-200'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
            <div className="bg-[rgb(var(--color-bg-light))] rounded-xl p-6 mb-6">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-4xl font-bold text-[rgb(var(--color-wood))]">{product.price.toLocaleString('vi-VN')}₫</span>
                {product.sale_price && product.sale_price < product.price && <span className="text-xl text-gray-400 line-through">{product.sale_price.toLocaleString('vi-VN')}₫</span>}
              </div>
              {discount > 0 && <span className="text-red-600 font-medium">Tiết kiệm {(product.price - (product.sale_price || 0)).toLocaleString('vi-VN')}₫</span>}
            </div>

            <div className="mb-6">
              {(product.stock ?? 0) > 0 ? (
                <div className="flex items-center gap-2 text-green-600 font-medium"><span className="text-xl">✓</span><span>Còn hàng ({product.stock} sản phẩm)</span></div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 font-medium"><span className="text-xl">✕</span><span>Tạm hết hàng</span></div>
              )}
            </div>

            <div className="mb-6">
              <label className="block font-medium mb-3">Số lượng:</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button onClick={() => handleQuantityChange(quantity - 1)} className="px-4 py-2 hover:bg-gray-100 font-bold text-xl" disabled={quantity <= 1}>−</button>
                  <input type="number" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)} className="w-16 text-center font-medium focus:outline-none" />
                  <button onClick={() => handleQuantityChange(quantity + 1)} className="px-4 py-2 hover:bg-gray-100 font-bold text-xl" disabled={quantity >= (product.stock ?? 0)}>+</button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button onClick={handleAddToCart} disabled={(product.stock ?? 0) === 0} className="btn-secondary flex-1">🛒 Thêm vào giỏ</button>
              <button onClick={handleBuyNow} disabled={(product.stock ?? 0) === 0} className="btn-primary flex-1">Mua ngay</button>
            </div>

            {(product.dimensions || product.specs) && (
              <div className="border-t pt-6 space-y-3">
                <h3 className="font-bold text-lg mb-4">Thông tin sản phẩm:</h3>
                {product.dimensions && typeof product.dimensions === 'object' && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Kích thước:</span>
                    <span className="font-medium">{JSON.stringify(product.dimensions)}</span>
                  </div>
                )}
                {product.specs && typeof product.specs === 'object' && Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
                {product.weight && <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Trọng lượng:</span><span className="font-medium">{product.weight}kg</span></div>}
              </div>
            )}
          </div>
        </div>

        {product.description && (
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mt-8">
            <h2 className="text-2xl font-bold mb-6">Mô tả sản phẩm</h2>
            <div className="prose max-w-none text-gray-700 leading-relaxed">{product.description}</div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          {[{icon:'🚚',title:'Giao hàng miễn phí',desc:'Đơn hàng trên 500k'},{icon:'✅',title:'Chính hãng 100%',desc:'Cam kết hàng chính hãng'},{icon:'↩️',title:'Đổi trả 7 ngày',desc:'Miễn phí đổi trả'},{icon:'🛡️',title:'Bảo hành',desc:'Hỗ trợ tận tâm'}].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
