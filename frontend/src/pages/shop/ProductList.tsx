/**
 * Product List Page - Using Generated OpenAPI Client with Filters
 */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductsService } from '@/client'
import type { ProductResponse, CategoryResponse } from '@/client'
import { formatImageUrl } from '@/utils/format'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  
  // Filter states
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || ''
  })
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '')
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('in_stock') === 'true')

  const categoryId = searchParams.get('category_id')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 12

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [categoryId, search, page, priceRange.min, priceRange.max, sortBy, inStockOnly])

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
      const response = await ProductsService.getProductsApiV1ProductsGet({
        skip: (page - 1) * limit,
        limit: limit,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        search: search || undefined,
      })
      
      let filteredProducts = response?.products || []
      
      // Client-side filtering for price range (auto swap if reversed)
      let minPrice = priceRange.min ? parseFloat(priceRange.min) : null
      let maxPrice = priceRange.max ? parseFloat(priceRange.max) : null
      
      // Swap if min > max
      if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
        [minPrice, maxPrice] = [maxPrice, minPrice]
      }
      
      if (minPrice !== null) {
        filteredProducts = filteredProducts.filter(p => {
          const price = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price
          return price >= minPrice
        })
      }
      if (maxPrice !== null) {
        filteredProducts = filteredProducts.filter(p => {
          const price = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price
          return price <= maxPrice
        })
      }
      
      // Filter by stock
      if (inStockOnly) {
        filteredProducts = filteredProducts.filter(p => (p.stock ?? 0) > 0)
      }
      
      // Sort products
      if (sortBy === 'price_asc') {
        filteredProducts.sort((a, b) => {
          const priceA = a.sale_price && a.sale_price < a.price ? a.sale_price : a.price
          const priceB = b.sale_price && b.sale_price < b.price ? b.sale_price : b.price
          return priceA - priceB
        })
      } else if (sortBy === 'price_desc') {
        filteredProducts.sort((a, b) => {
          const priceA = a.sale_price && a.sale_price < a.price ? a.sale_price : a.price
          const priceB = b.sale_price && b.sale_price < b.price ? b.sale_price : b.price
          return priceB - priceA
        })
      } else if (sortBy === 'name_asc') {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      }
      
      setProducts(filteredProducts)
      setTotal(filteredProducts.length)
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Failed to load products')
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSearch = () => {
    if (searchInput.trim()) {
      searchParams.set('search', searchInput.trim())
    } else {
      searchParams.delete('search')
    }
    searchParams.set('page', '1')
    setSearchParams(searchParams)
  }
  
  const handleClearFilters = () => {
    setSearchInput('')
    setPriceRange({ min: '', max: '' })
    setSortBy('')
    setInStockOnly(false)
    searchParams.delete('search')
    searchParams.delete('min_price')
    searchParams.delete('max_price')
    searchParams.delete('sort')
    searchParams.delete('in_stock')
    searchParams.set('page', '1')
    setSearchParams(searchParams)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Animation */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sản phẩm
          </h1>
          <p className="text-gray-600">Khám phá bộ sưu tập nội thất cao cấp</p>
        </div>

        {/* Premium Search Bar */}
        <div className="mb-5 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              Tìm kiếm
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg ${
                showFilters 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-900 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
              {showFilters ? 'Đóng' : 'Lọc'}
            </button>
          </div>
        </div>

        {/* Premium Filter Panel with Animation */}
        {showFilters && (
          <div className="mb-5 bg-white rounded-xl shadow-lg p-5 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Bộ lọc</h3>
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-all flex items-center gap-2 font-medium"
              >
                <X className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Khoảng giá
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Giá thấp nhất"
                    value={priceRange.min}
                    onChange={(e) => {
                      setPriceRange(prev => ({ ...prev, min: e.target.value }))
                      if (e.target.value) {
                        searchParams.set('min_price', e.target.value)
                      } else {
                        searchParams.delete('min_price')
                      }
                      setSearchParams(searchParams)
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Giá cao nhất"
                    value={priceRange.max}
                    onChange={(e) => {
                      setPriceRange(prev => ({ ...prev, max: e.target.value }))
                      if (e.target.value) {
                        searchParams.set('max_price', e.target.value)
                      } else {
                        searchParams.delete('max_price')
                      }
                      setSearchParams(searchParams)
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Sắp xếp theo
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    if (e.target.value) {
                      searchParams.set('sort', e.target.value)
                    } else {
                      searchParams.delete('sort')
                    }
                    setSearchParams(searchParams)
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all cursor-pointer text-sm"
                >
                  <option value="">Mặc định</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                  <option value="name_asc">Tên: A đến Z</option>
                </select>
              </div>

              {/* Stock Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Tình trạng hàng
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked)
                      if (e.target.checked) {
                        searchParams.set('in_stock', 'true')
                      } else {
                        searchParams.delete('in_stock')
                      }
                      setSearchParams(searchParams)
                    }}
                    className="w-4 h-4 text-yellow-400 bg-white border-gray-300 rounded focus:ring-yellow-400 cursor-pointer"
                  />
                  <span className="text-gray-700 font-medium text-sm">Chỉ hiển thị còn hàng</span>
                </label>
              </div>
            </div>
          </div>
        )}

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
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.sale_price)}
                          </span>
                          {product.sale_price && product.sale_price < product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() => {
                        searchParams.set('page', (page - 1).toString())
                        setSearchParams(searchParams)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      disabled={page === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm text-sm ${
                        page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-900 hover:bg-yellow-400 hover:shadow-md'
                      }`}
                    >
                      ← Trước
                    </button>
                    
                    {/* First page */}
                    {page > 3 && (
                      <>
                        <button
                          onClick={() => {
                            searchParams.set('page', '1')
                            setSearchParams(searchParams)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className="px-3 py-2 bg-white text-gray-900 rounded-lg hover:bg-yellow-400 transition-all font-medium shadow-sm hover:shadow-md text-sm"
                        >
                          1
                        </button>
                        <span className="text-gray-400 font-bold text-sm">...</span>
                      </>
                    )}
                    
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p >= page - 2 && p <= page + 2)
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            searchParams.set('page', p.toString())
                            setSearchParams(searchParams)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className={`px-3 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md text-sm ${
                            p === page
                              ? 'bg-yellow-400 text-gray-900 scale-105'
                              : 'bg-white text-gray-900 hover:bg-yellow-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    
                    {/* Last page */}
                    {page < totalPages - 2 && (
                      <>
                        <span className="text-gray-400 font-bold text-sm">...</span>
                        <button
                          onClick={() => {
                            searchParams.set('page', totalPages.toString())
                            setSearchParams(searchParams)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className="px-3 py-2 bg-white text-gray-900 rounded-lg hover:bg-yellow-400 transition-all font-medium shadow-sm hover:shadow-md text-sm"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => {
                        searchParams.set('page', (page + 1).toString())
                        setSearchParams(searchParams)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      disabled={page === totalPages}
                      className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm text-sm ${
                        page === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-900 hover:bg-yellow-400 hover:shadow-md'
                      }`}
                    >
                      Sau →
                    </button>
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
