import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../lib/api";
import { getProducts } from "../lib/products";
import type { ProductListItem } from "../lib/types";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [priceRange, setPriceRange] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(true);

  const productsPerPage = 15;

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        const categoryList = Array.isArray(response.data) ? response.data : [];
        console.log("📁 Categories loaded:", categoryList);
        setCategories(categoryList);
      } catch (err) {
        console.error("❌ Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await getProducts({
          page: currentPage,
          size: productsPerPage,
          category_id: selectedCategoryId || undefined,
        });
        console.log("✅ API Response:", response);

        // Backend có thể trả về response.data hoặc response trực tiếp
        const data = (response as any).data ?? response;
        const items = data?.items ?? data ?? [];
        const total = data?.total ?? items.length ?? 0;

        console.log("📦 Products loaded:", items.length, "/ Total:", total);
        setProducts(items);
        setTotalProducts(total);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage, selectedCategoryId]);

  const mockProducts: ProductListItem[] = [
    {
      id: 1,
      name: "Nordic Oak Desk",
      price: 2490000,
      main_image: null,
      stock_quantity: 12,
      is_active: true,
    },
    {
      id: 2,
      name: "Minimalist Sofa",
      price: 7590000,
      main_image: null,
      stock_quantity: 5,
      is_active: true,
    },
    {
      id: 3,
      name: "Ergonomic Chair",
      price: 1990000,
      main_image: null,
      stock_quantity: 20,
      is_active: true,
    },
    {
      id: 4,
      name: "Wooden Dining Table",
      price: 4590000,
      main_image: null,
      stock_quantity: 3,
      is_active: true,
    },
    {
      id: 5,
      name: "Lux Pendant Light",
      price: 1290000,
      main_image: null,
      stock_quantity: 8,
      is_active: true,
    },
    {
      id: 6,
      name: "Vintage Sideboard",
      price: 8990000,
      main_image: null,
      stock_quantity: 2,
      is_active: true,
    },
    {
      id: 7,
      name: "Cozy Armchair",
      price: 3190000,
      main_image: null,
      stock_quantity: 0,
      is_active: true,
    },
    {
      id: 8,
      name: "Extendable Coffee Table",
      price: 1890000,
      main_image: null,
      stock_quantity: 6,
      is_active: true,
    },
    {
      id: 9,
      name: "Decorative Rug",
      price: 590000,
      main_image: null,
      stock_quantity: 15,
      is_active: true,
    },
    {
      id: 10,
      name: "Bookshelf Classic",
      price: 1290000,
      main_image: null,
      stock_quantity: 4,
      is_active: true,
    },
    {
      id: 11,
      name: "Bar Stool Set",
      price: 890000,
      main_image: null,
      stock_quantity: 9,
      is_active: true,
    },
    {
      id: 12,
      name: "Outdoor Bench",
      price: 1690000,
      main_image: null,
      stock_quantity: 7,
      is_active: true,
    },
    {
      id: 13,
      name: "TV Console",
      price: 2390000,
      main_image: null,
      stock_quantity: 1,
      is_active: true,
    },
    {
      id: 14,
      name: "Accent Lamp",
      price: 450000,
      main_image: null,
      stock_quantity: 14,
      is_active: true,
    },
    {
      id: 15,
      name: "Outdoor Lantern",
      price: 350000,
      main_image: null,
      stock_quantity: 11,
      is_active: true,
    },
    {
      id: 16,
      name: "Folding Desk",
      price: 990000,
      main_image: null,
      stock_quantity: 6,
      is_active: true,
    },
    {
      id: 17,
      name: "Storage Ottoman",
      price: 670000,
      main_image: null,
      stock_quantity: 0,
      is_active: true,
    },
    {
      id: 18,
      name: "Accent Mirror",
      price: 420000,
      main_image: null,
      stock_quantity: 8,
      is_active: true,
    },
    {
      id: 19,
      name: "Planter Pot Set",
      price: 220000,
      main_image: null,
      stock_quantity: 20,
      is_active: true,
    },
    {
      id: 20,
      name: "Side Table Marble",
      price: 1490000,
      main_image: null,
      stock_quantity: 5,
      is_active: true,
    },
  ];

  const displayedProducts = products.length > 0 ? products : [];

  // Nếu không có sản phẩm từ API, hiển thị thông báo thay vì mock data
  const shouldShowMockData = !loading && products.length === 0;
  let finalProducts = shouldShowMockData ? mockProducts : displayedProducts;

  // Apply client-side filters
  finalProducts = finalProducts.filter((product) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = product.name.toLowerCase().includes(query);
      if (!matchName) return false;
    }

    // Price range filter
    if (priceRange !== "all") {
      const price = Number(product.price);
      if (priceRange === "under-1m" && price >= 1000000) return false;
      if (priceRange === "1m-5m" && (price < 1000000 || price >= 5000000))
        return false;
      if (priceRange === "5m-10m" && (price < 5000000 || price >= 10000000))
        return false;
      if (priceRange === "over-10m" && price < 10000000) return false;
    }

    // Stock filter
    if (stockFilter !== "all") {
      if (stockFilter === "in-stock" && product.stock_quantity <= 0)
        return false;
      if (stockFilter === "out-of-stock" && product.stock_quantity > 0)
        return false;
      if (
        stockFilter === "low-stock" &&
        (product.stock_quantity > 5 || product.stock_quantity <= 0)
      )
        return false;
    }

    return true;
  });

  // Apply sorting
  finalProducts = [...finalProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return Number(a.price) - Number(b.price);
      case "price-desc":
        return Number(b.price) - Number(a.price);
      case "name-asc":
        return a.name.localeCompare(b.name, "vi");
      case "name-desc":
        return b.name.localeCompare(a.name, "vi");
      case "stock":
        return b.stock_quantity - a.stock_quantity;
      default:
        return 0;
    }
  });

  const priceRanges = [
    { value: "all", label: "Tất cả giá" },
    { value: "under-1m", label: "Dưới 1 triệu" },
    { value: "1m-5m", label: "1 - 5 triệu" },
    { value: "5m-10m", label: "5 - 10 triệu" },
    { value: "over-10m", label: "Trên 10 triệu" },
  ];

  const stockFilters = [
    { value: "all", label: "Tất cả" },
    { value: "in-stock", label: "Còn hàng" },
    { value: "low-stock", label: "Sắp hết (≤5)" },
    { value: "out-of-stock", label: "Hết hàng" },
  ];

  const sortOptions = [
    { value: "default", label: "Mặc định" },
    { value: "price-asc", label: "Giá: Thấp → Cao" },
    { value: "price-desc", label: "Giá: Cao → Thấp" },
    { value: "name-asc", label: "Tên: A → Z" },
    { value: "name-desc", label: "Tên: Z → A" },
    { value: "stock", label: "Tồn kho: Nhiều nhất" },
  ];

  // Count active filters
  const activeFiltersCount = [
    selectedCategoryId !== null,
    priceRange !== "all",
    stockFilter !== "all",
    searchQuery !== "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCategoryId(null);
    setPriceRange("all");
    setStockFilter("all");
    setSearchQuery("");
    setSortBy("default");
  };

  // Determine how many products we are showing (backend total when available, otherwise mock/displayed count)
  const displayedCount =
    products.length > 0 ? totalProducts : finalProducts.length;
  const totalPages = Math.ceil(displayedCount / productsPerPage);
  const showPagination = displayedCount > productsPerPage;

  // slice data for page (works for both backend-paginated items and local mock fallback)
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const pagedProducts = (finalProducts || []).slice(startIndex, endIndex);

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section
        className="relative h-[40vh] bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1600')",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-sm tracking-[0.3em] uppercase mb-4 text-[rgb(var(--color-accent))]">
              Discover Excellence
            </p>
            <h1 className="text-5xl md:text-7xl font-light">Our Products</h1>
          </div>
        </div>
      </section>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Filters Sidebar */}
          <aside
            className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <div className="sticky top-24 bg-white lg:bg-transparent p-4 lg:p-0 rounded-lg lg:rounded-none shadow-lg lg:shadow-none mb-6 lg:mb-0">
              {/* Categories */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 tracking-wider">
                  📂 DANH MỤC
                </h3>
                <div className="space-y-2">
                  {/* All Products */}
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={`block w-full text-left px-4 py-2 transition-colors rounded ${
                      !selectedCategoryId
                        ? "bg-[rgb(var(--color-primary))] text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    Tất cả sản phẩm
                  </button>

                  {/* Dynamic categories from API */}
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`block w-full text-left px-4 py-2 transition-colors rounded ${
                        selectedCategoryId === category.id
                          ? "bg-[rgb(var(--color-primary))] text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 tracking-wider">
                  💰 KHOẢNG GIÁ
                </h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setPriceRange(range.value)}
                      className={`block w-full text-left px-4 py-2 transition-colors rounded ${
                        priceRange === range.value
                          ? "bg-[rgb(var(--color-primary))] text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 tracking-wider">
                  📦 TÌNH TRẠNG
                </h3>
                <div className="space-y-2">
                  {stockFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setStockFilter(filter.value)}
                      className={`block w-full text-left px-4 py-2 transition-colors rounded ${
                        stockFilter === filter.value
                          ? "bg-[rgb(var(--color-primary))] text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divider-luxury"></div>

              {/* Filter Info */}
              <div className="text-sm text-[rgb(var(--color-text-muted))]">
                {shouldShowMockData ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                    <p className="text-yellow-800 font-semibold mb-1">
                      ⚠️ Hiển thị dữ liệu mẫu
                    </p>
                    <p className="text-xs text-yellow-700">
                      Không thể tải sản phẩm từ API. Kiểm tra backend hoặc
                      Console để biết thêm chi tiết.
                    </p>
                  </div>
                ) : (
                  <p className="mb-2">
                    Showing {products.length} of {totalProducts} products
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="flex-1 w-full md:w-auto relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="flex gap-2 w-full md:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 md:flex-none px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* Mobile filter toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden px-4 py-2 border rounded-lg hover:bg-gray-50 whitespace-nowrap"
                  >
                    🎛️ Bộ lọc{" "}
                    {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </button>
                </div>
              </div>

              {/* Active filters & results count */}
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t">
                <span className="text-sm text-gray-600">
                  Hiển thị <strong>{finalProducts.length}</strong> sản phẩm
                </span>
                {activeFiltersCount > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-[rgb(var(--color-secondary))] hover:underline font-medium"
                    >
                      ✨ Xóa tất cả bộ lọc ({activeFiltersCount})
                    </button>
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-12 h-12 border-4 border-[rgb(var(--color-secondary))] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-[rgb(var(--color-text-muted))]">
                  Loading products...
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pagedProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="group"
                    >
                      <div className="luxury-card overflow-hidden mb-4 aspect-square">
                        {product.main_image ? (
                          <img
                            src={product.main_image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                            <span className="text-6xl">🪑</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs tracking-wider text-[rgb(var(--color-text-muted))] uppercase mb-2">
                        {(product as any).category?.name || "Furniture"}
                      </p>
                      <h4 className="text-lg mb-2 group-hover:text-[rgb(var(--color-secondary))] transition-colors line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="font-medium">
                        ₫{Number(product.price).toLocaleString("vi-VN")}
                      </p>
                      <p
                        className={`text-sm mt-1 ${product.stock_quantity > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {product.stock_quantity > 0
                          ? "In Stock"
                          : "Out of Stock"}
                      </p>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {showPagination && totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className={`px-6 py-2 ${
                        currentPage === 1
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-[rgb(var(--color-primary))] hover:text-white"
                      } border transition-colors`}
                    >
                      Previous
                    </button>

                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 border transition-colors ${
                            currentPage === page
                              ? "bg-[rgb(var(--color-primary))] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`px-6 py-2 ${
                        currentPage === totalPages
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-[rgb(var(--color-primary))] hover:text-white"
                      } border transition-colors`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
