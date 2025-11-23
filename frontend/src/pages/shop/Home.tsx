/**
 * Home Page - Using Generated OpenAPI Client
 */
import { useEffect, useState } from 'react'
import { ProductsService } from '@/client'
import type { ProductResponse } from '@/client'
import { Link } from 'react-router-dom'
import BannerSlider from '@/components/BannerSlider'

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductResponse[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load featured products and categories in parallel
      const [productsResponse, categoriesResponse] = await Promise.all([
        ProductsService.getProductsApiV1ProductsGet(0, 100),
        ProductsService.getCategoriesApiV1ProductsCategoriesGet()
      ])

      const allProducts = productsResponse?.products || []
      setFeaturedProducts(allProducts.filter((p: ProductResponse) => p.is_featured))
      setCategories(categoriesResponse || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
      setFeaturedProducts([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Dynamic Banner Slider */}
      <BannerSlider />

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sản phẩm nổi bật</h2>
            <p className="text-gray-600">Được khách hàng yêu thích nhất</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadData}
                className="text-gray-900 underline hover:text-gray-700"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(featuredProducts) && featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {product.name}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                      </span>
                      {product.sale_price && product.sale_price < product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.sale_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-block border-2 border-gray-900 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-900 hover:text-white transition"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section - Only show if categories exist */}
      {categories.length > 0 && (
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Danh mục sản phẩm</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-gray-900 hover:shadow-lg transition"
                >
                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-16 h-16 mb-3 object-cover rounded-full"
                    />
                  )}
                  <p className="font-semibold text-gray-900 text-center">{category.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
