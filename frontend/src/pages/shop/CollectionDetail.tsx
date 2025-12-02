/**
 * Collection Detail Page - Chi tiết bộ sưu tập
 * Hiển thị collection như một sản phẩm combo với giá ưu đãi
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CollectionsService, CartService } from '@/client'
import type { CollectionWithProductsResponse, ProductResponse } from '@/client'
import { formatImageUrl, formatPrice } from '@/utils/format'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const [collection, setCollection] = useState<CollectionWithProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    if (id) {
      loadCollection(parseInt(id))
    }
  }, [id])

  const loadCollection = async (collectionId: number) => {
    try {
      setLoading(true)
      const data = await CollectionsService.getCollectionApiV1CollectionsCollectionIdGet({ collectionId })
      setCollection(data)
    } catch (err) {
      console.error('Error loading collection:', err)
      setError('Không thể tải thông tin bộ sưu tập')
    } finally {
      setLoading(false)
    }
  }

  // Tính tổng giá gốc từ các sản phẩm
  const calculateOriginalPrice = (products: ProductResponse[]): number => {
    return products.reduce((total, product) => {
      // Sử dụng giá gốc của sản phẩm (không phải sale_price)
      return total + (product.price || 0)
    }, 0)
  }

  // Thêm tất cả sản phẩm trong collection vào giỏ hàng
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng')
      return
    }

    if (!collection?.products || collection.products.length === 0) {
      toast.warning('Bộ sưu tập không có sản phẩm')
      return
    }

    try {
      setAddingToCart(true)
      
      // Thêm từng sản phẩm vào giỏ hàng
      for (const product of collection.products) {
        await CartService.addToCartApiV1CartAddPost({
          requestBody: {
            product_id: product.id,
            quantity: 1
          }
        })
      }

      setAddedToCart(true)
      toast.success('Đã thêm tất cả sản phẩm vào giỏ hàng!')
      setTimeout(() => setAddedToCart(false), 3000)
    } catch (err) {
      console.error('Error adding to cart:', err)
      toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgb(var(--color-primary))] border-r-transparent"></div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {error || 'Không tìm thấy bộ sưu tập'}
          </h2>
          <Link to="/collections" className="text-[rgb(var(--color-primary))] hover:underline">
            ← Quay lại danh sách bộ sưu tập
          </Link>
        </div>
      </div>
    )
  }

  const products = collection.products || []
  const originalPrice = calculateOriginalPrice(products)
  const salePrice = collection.sale_price || originalPrice
  const discount = originalPrice > 0 ? Math.round((1 - salePrice / originalPrice) * 100) : 0

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        {collection.banner_url ? (
          <img
            src={formatImageUrl(collection.banner_url)}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--color-wood))] to-[rgb(var(--color-moss))]" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{collection.name}</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
              {collection.description}
            </p>
          </div>
        </div>
      </section>

      {/* Price & Action Section */}
      <section className="sticky top-0 z-40 bg-white shadow-md">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-500">Giá bộ sưu tập:</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-3xl font-bold text-[rgb(var(--color-primary))]">
                    {formatPrice(salePrice)}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                      <span className="bg-red-500 text-white text-sm px-2 py-1 rounded">
                        -{discount}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {products.length} sản phẩm trong bộ sưu tập
              </span>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || products.length === 0}
                className={`px-8 py-3 rounded-lg font-semibold transition ${
                  addedToCart
                    ? 'bg-green-500 text-white'
                    : 'bg-[rgb(var(--color-primary))] text-white hover:bg-[rgb(var(--color-primary-dark))]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {addingToCart ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang thêm...
                  </span>
                ) : addedToCart ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Đã thêm vào giỏ
                  </span>
                ) : (
                  'Mua Cả Bộ Sưu Tập'
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products in Collection */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="text-2xl font-semibold mb-8">Sản phẩm trong bộ sưu tập</h2>
          
          {products.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              Chưa có sản phẩm nào trong bộ sưu tập này.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug || product.id}`}
                  className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    {product.thumbnail_url ? (
                      <img
                        src={formatImageUrl(product.thumbnail_url)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 group-hover:text-[rgb(var(--color-primary))] transition line-clamp-2">
                      {product.name}
                    </h3>
                    {product.short_description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {product.short_description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      {product.sale_price && product.sale_price < product.price ? (
                        <>
                          <span className="font-semibold text-[rgb(var(--color-primary))]">
                            {formatPrice(product.sale_price)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-[rgb(var(--color-bg-offwhite))]">
        <div className="container-custom">
          <h2 className="text-2xl font-semibold text-center mb-8">Lợi ích khi mua bộ sưu tập</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[rgb(var(--color-primary))]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[rgb(var(--color-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Tiết kiệm đến {discount}%</h3>
              <p className="text-gray-600 text-sm">
                Mua trọn bộ sưu tập với giá ưu đãi hơn so với mua lẻ từng sản phẩm
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[rgb(var(--color-primary))]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[rgb(var(--color-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Phong cách đồng bộ</h3>
              <p className="text-gray-600 text-sm">
                Các sản phẩm được thiết kế để phối hợp hoàn hảo với nhau
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[rgb(var(--color-primary))]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[rgb(var(--color-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Giao hàng một lần</h3>
              <p className="text-gray-600 text-sm">
                Tiện lợi với việc nhận tất cả sản phẩm trong cùng một đơn hàng
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-[rgb(var(--color-deep-green))] text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Sẵn sàng sở hữu {collection.name}?
          </h2>
          <p className="text-lg text-gray-300 mb-6">
            Tiết kiệm {formatPrice(originalPrice - salePrice)} khi mua cả bộ sưu tập ngay hôm nay!
          </p>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || products.length === 0}
            className="px-8 py-4 bg-white text-[rgb(var(--color-deep-green))] rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
          >
            {addingToCart ? 'Đang thêm...' : 'Thêm Vào Giỏ Hàng'}
          </button>
        </div>
      </section>
    </div>
  )
}
