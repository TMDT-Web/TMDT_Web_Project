/**
 * Product List Page - Using Generated OpenAPI Client
 */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductsService } from '@/client'
import type { ProductResponse, CategoryResponse } from '@/client'
import { formatImageUrl } from '@/utils/format'

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const categoryId = searchParams.get('category_id')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 12

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [categoryId, search, page])

  const loadCategories = async () => {
    try {
      // Use generated client for categories
      const data = await ProductsService.getCategoriesApiV1ProductsCategoriesGet()
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
      setCategories([])
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use generated client - type-safe API call
      const response = await ProductsService.getProductsApiV1ProductsGet(
        (page - 1) * limit,                           // skip
        limit,                                         // limit
        categoryId ? parseInt(categoryId) : undefined, // categoryId
        undefined,                                     // collectionId
        search || undefined,                           // search
        undefined,                                     // isFeatured
        undefined,                                     // minPrice
        undefined                                      // maxPrice
      )
      setProducts(response?.products || [])
      setTotal(response?.total || 0)
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Failed to load products')
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sản phẩm</h1>
          <p className="text-gray-600">Khám phá bộ sưu tập nội thất cao cấp</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Danh mục</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => {
                      searchParams.delete('category_id')
                      setSearchParams(searchParams)
                    }}
                    className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                      !categoryId ? 'bg-gray-900 text-white hover:bg-gray-800' : 'text-gray-700'
                    }`}
                  >
                    Tất cả
                  </button>
                </li>
                {Array.isArray(categories) && categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        searchParams.set('category_id', cat.id.toString())
                        searchParams.set('page', '1')
                        setSearchParams(searchParams)
                      }}
                      className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                        categoryId === cat.id.toString() ? 'bg-gray-900 text-white hover:bg-gray-800' : 'text-gray-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Info */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Hiển thị {products.length} / {total} sản phẩm
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={loadProducts}
                  className="text-gray-900 underline hover:text-gray-700"
                >
                  Thử lại
                </button>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(products) && products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.slug}`}
                      className="group bg-white rounded-lg shadow-sm hover:shadow-xl transition-all"
                    >
                      <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                        {product.thumbnail_url ? (
                          <img
                            src={formatImageUrl(product.thumbnail_url)}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {product.name}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {page > 1 && (
                      <button
                        onClick={() => {
                          searchParams.set('page', (page - 1).toString())
                          setSearchParams(searchParams)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        Trước
                      </button>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          searchParams.set('page', p.toString())
                          setSearchParams(searchParams)
                        }}
                        className={`px-4 py-2 rounded ${
                          p === page
                            ? 'bg-gray-900 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    {page < totalPages && (
                      <button
                        onClick={() => {
                          searchParams.set('page', (page + 1).toString())
                          setSearchParams(searchParams)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        Sau
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600">Không tìm thấy sản phẩm nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
