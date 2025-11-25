/**
 * Collections Page - Product Bundles/Combos
 * Horizontal Card Layout with Add to Cart + Buy Now buttons
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CollectionsService } from '@/client'
import type { CollectionWithProductsResponse } from '@/client'
import { formatImageUrl } from '@/utils/format'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { toast } from 'react-hot-toast'

export default function Collections() {
  const [collections, setCollections] = useState<CollectionWithProductsResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      const data = await CollectionsService.getCollectionsApiV1CollectionsGet(undefined, undefined, true)

      // Load full details for each collection to get bundle info
      const detailedCollections = await Promise.all(
        (data.collections || []).map(async (col: any) => {
          try {
            return await CollectionsService.getCollectionApiV1CollectionsCollectionIdGet(col.id)
          } catch {
            return col
          }
        })
      )

      setCollections(detailedCollections)
    } catch (error) {
      console.error('Error loading collections:', error)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  const handleBuyCombo = async (collection: CollectionWithProductsResponse) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng')
      navigate('/login')
      return
    }

    setAddingToCart(collection.id)
    try {
      // Add collection as a single cart item with bundle price
      const collectionCartItem = {
        id: collection.id,
        name: collection.name,
        slug: collection.slug || `collection-${collection.id}`,
        price: collection.sale_price || 0,
        sale_price: collection.sale_price,
        thumbnail_url: collection.banner_url,
        stock: 999, // Collections don't have direct stock
        isCollection: true,
        is_active: true,
        is_featured: false,
        views_count: 0,
        sales_count: 0,
        category_id: 0,
        discount_percent: collection.discount_percentage || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await addItem(collectionCartItem, 1)

      toast.success(`Đã thêm combo "${collection.name}" vào giỏ hàng!`, { duration: 3000 })
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error: any) {
      console.error('Error adding bundle to cart:', error)
      toast.error(error.message || 'Không thể thêm vào giỏ hàng')
    } finally {
      setAddingToCart(null)
    }
  }

  const handleBuyNow = async (collection: CollectionWithProductsResponse) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua hàng')
      navigate('/login')
      return
    }

    setAddingToCart(collection.id)
    try {
      // Add collection as a single cart item with bundle price
      const collectionCartItem = {
        id: collection.id,
        name: collection.name,
        slug: collection.slug || `collection-${collection.id}`,
        price: collection.sale_price || 0,
        sale_price: collection.sale_price,
        thumbnail_url: collection.banner_url,
        stock: 999, // Collections don't have direct stock
        isCollection: true,
        is_active: true,
        is_featured: false,
        views_count: 0,
        sales_count: 0,
        category_id: 0,
        discount_percent: collection.discount_percentage || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await addItem(collectionCartItem, 1)

      window.dispatchEvent(new Event('cartUpdated'))
      navigate('/cart')
    } catch (error: any) {
      console.error('Error adding bundle to cart:', error)
      toast.error(error.message || 'Không thể thêm vào giỏ hàng')
      setAddingToCart(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section-padding bg-[rgb(var(--color-bg-offwhite))]">
        <div className="container-custom text-center">
          <h1 className="heading-minimal mb-6">Bộ Sưu Tập Combo</h1>
          <p className="text-minimal max-w-2xl mx-auto">
            Khám phá các bộ combo nội thất được thiết kế đồng bộ,
            giá ưu đãi đặc biệt khi mua trọn bộ
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
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Chưa có bộ combo nào</p>
            </div>
          ) : (
            <div className="space-y-8">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                >
                  {/* Horizontal Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                    {/* Left: Banner Image (40%) */}
                    {collection.banner_url && (
                      <div className="lg:col-span-2 aspect-[4/3] lg:aspect-auto overflow-hidden bg-[rgb(var(--color-bg-offwhite))]">
                        <img
                          src={formatImageUrl(collection.banner_url)}
                          alt={collection.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    )}

                    {/* Right: Content (60%) */}
                    <div className="lg:col-span-3 p-6 lg:p-8 flex flex-col justify-between">
                      {/* Top Section: Info */}
                      <div className="space-y-4">
                        {/* Title & Description */}
                        <div>
                          <h3 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-2">
                            {collection.name}
                          </h3>
                          {collection.description && (
                            <p className="text-minimal text-sm lg:text-base">{collection.description}</p>
                          )}
                        </div>

                        {/* Bundle Items */}
                        {collection.items && collection.items.length > 0 && (
                          <div className="border-t border-b border-gray-200 py-4">
                            <p className="text-xs font-semibold text-gray-600 mb-3 tracking-wide">BỘ COMBO BAO GỒM:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {collection.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-[rgb(var(--color-wood))]/10 text-[rgb(var(--color-wood))] flex items-center justify-center text-xs font-medium">
                                    {item.quantity}
                                  </span>
                                  <span className="text-sm text-gray-700 font-medium">
                                    {item.product?.name || `Sản phẩm #${item.product_id}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Product Thumbnails */}
                        {collection.items && collection.items.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {collection.items.slice(0, 4).map((item, idx) => (
                              item.product?.thumbnail_url && (
                                <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                  <img
                                    src={formatImageUrl(item.product.thumbnail_url)}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bottom Section: Price & Actions */}
                      <div className="mt-6 space-y-4">
                        {/* Price Comparison */}
                        {collection.sale_price && collection.total_original_price > 0 && (
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-3">
                                <span className="text-sm text-gray-500 line-through">
                                  {collection.total_original_price.toLocaleString('vi-VN')}₫
                                </span>
                                {collection.discount_percentage > 0 && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                    -{collection.discount_percentage.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl lg:text-4xl font-bold text-[rgb(var(--color-wood))]">
                                  {collection.sale_price.toLocaleString('vi-VN')}₫
                                </span>
                              </div>
                              {collection.discount_amount > 0 && (
                                <p className="text-sm text-green-600 font-medium">
                                  💰 Tiết kiệm: {collection.discount_amount.toLocaleString('vi-VN')}₫
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleBuyCombo(collection)}
                            disabled={addingToCart === collection.id}
                            className="flex-1 btn-secondary py-3 text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingToCart === collection.id ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                                Đang thêm...
                              </span>
                            ) : (
                              '🛒 Thêm vào giỏ'
                            )}
                          </button>
                          <button
                            onClick={() => handleBuyNow(collection)}
                            disabled={addingToCart === collection.id}
                            className="flex-1 btn-primary py-3 text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ⚡ Mua ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-[rgb(var(--color-deep-green))] text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Tư Vấn Thiết Kế Miễn Phí
          </h2>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Chưa chắc chắn bộ combo nào phù hợp?
            Liên hệ với đội ngũ thiết kế của chúng tôi để được tư vấn
          </p>
          <Link to="/contact" className="btn-secondary bg-transparent border-white text-white hover:bg-white hover:text-[rgb(var(--color-deep-green))]">
            Liên Hệ Ngay
          </Link>
        </div>
      </section>
    </div>
  )
}
