/**
 * Collections Page - Bộ sưu tập
 * Minimal Scandinavian Design
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CollectionsService } from '@/client'
import type { CollectionResponse } from '@/client'
import { formatImageUrl, formatPrice } from '@/utils/format'

export default function Collections() {
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      const data = await CollectionsService.getCollectionsApiV1CollectionsGet({ skip: 0, limit: 100, isActive: true })
      setCollections(data?.collections || [])
    } catch (error) {
      console.error('Error loading collections:', error)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section-padding bg-[rgb(var(--color-bg-offwhite))]">
        <div className="container-custom text-center">
          <h1 className="heading-minimal mb-6">Bộ Sưu Tập</h1>
          <p className="text-minimal max-w-2xl mx-auto">
            Mua trọn bộ sưu tập nội thất với giá ưu đãi đặc biệt. 
            Tiết kiệm hơn khi mua combo thay vì mua lẻ từng sản phẩm!
          </p>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="section-padding">
        <div className="container-custom">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgb(var(--color-primary))] border-r-transparent"></div>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chưa có bộ sưu tập nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {collections.map((collection, index) => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-[rgb(var(--color-bg-offwhite))]">
                    {collection.banner_url ? (
                      <img
                        src={formatImageUrl(collection.banner_url)}
                        alt={collection.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgb(var(--color-wood))] to-[rgb(var(--color-moss))] text-white text-4xl font-light">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-semibold tracking-tight group-hover:text-[rgb(var(--color-primary))] transition">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">{collection.description}</p>
                    )}
                    
                    {/* Price Display */}
                    {collection.sale_price && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-lg font-bold text-[rgb(var(--color-primary))]">
                          {formatPrice(collection.sale_price)}
                        </span>
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                          COMBO
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-[rgb(var(--color-primary))] font-medium group-hover:underline">
                        Xem chi tiết & Mua ngay →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="section-padding bg-[rgb(var(--color-bg-offwhite))]">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-[rgb(var(--color-primary))]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[rgb(var(--color-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Giá Ưu Đãi Đặc Biệt</h3>
              <p className="text-gray-600 text-sm">
                Tiết kiệm 10-20% khi mua trọn bộ sưu tập thay vì mua lẻ
              </p>
            </div>
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-[rgb(var(--color-primary))]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[rgb(var(--color-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Thiết Kế Đồng Bộ</h3>
              <p className="text-gray-600 text-sm">
                Sản phẩm được tuyển chọn để phối hợp hoàn hảo với nhau
              </p>
            </div>
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-[rgb(var(--color-primary))]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[rgb(var(--color-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Một Lần Đặt Hàng</h3>
              <p className="text-gray-600 text-sm">
                Tiện lợi - tất cả sản phẩm trong một đơn hàng duy nhất
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection Banner */}
      <section className="section-padding bg-[rgb(var(--color-deep-green))] text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Bộ Sưu Tập Mùa Đông 2025
          </h2>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Tạo nên không gian ấm cúng với những món đồ nội thất tinh tế, 
            mang hơi thở Scandinavian thuần khiết
          </p>
          <Link to="/products?is_featured=true" className="btn-secondary bg-transparent border-white text-white hover:bg-white hover:text-[rgb(var(--color-deep-green))]">
            Xem Sản Phẩm Nổi Bật
          </Link>
        </div>
      </section>
    </div>
  )
}
