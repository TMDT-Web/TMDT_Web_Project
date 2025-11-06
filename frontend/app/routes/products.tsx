import { Link } from "react-router";
import { useState, useEffect } from "react";
import { getProducts } from "../lib/products";
import type { ProductListItem } from "../lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string>('all');
  
  const productsPerPage = 12;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await getProducts({
          page: currentPage,
          size: productsPerPage,
        });
        setProducts(response.items);
        setTotalProducts(response.total);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage]);

  const categories = [
    "All Products",
    "Living Room",
    "Bedroom",
    "Dining",
    "Office",
    "Lighting",
    "Accessories"
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: 'under-1m', label: 'Under ₫1,000,000' },
    { value: '1m-5m', label: '₫1,000,000 - ₫5,000,000' },
    { value: '5m-10m', label: '₫5,000,000 - ₫10,000,000' },
    { value: 'over-10m', label: 'Over ₫10,000,000' }
  ];

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="relative h-[40vh] bg-cover bg-center" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1600')"
      }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-sm tracking-[0.3em] uppercase mb-4 text-[rgb(var(--color-accent))]">
              Discover Excellence
            </p>
            <h1 className="text-5xl md:text-7xl font-light">Our Collection</h1>
          </div>
        </div>
      </section>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Categories */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 tracking-wider">CATEGORIES</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category === 'All Products' ? null : category)}
                      className={`block w-full text-left px-4 py-2 transition-colors ${
                        (category === 'All Products' && !selectedCategory) || selectedCategory === category
                          ? 'bg-[rgb(var(--color-primary))] text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 tracking-wider">PRICE RANGE</h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setPriceRange(range.value)}
                      className={`block w-full text-left px-4 py-2 transition-colors ${
                        priceRange === range.value
                          ? 'bg-[rgb(var(--color-primary))] text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divider-luxury"></div>

              {/* Filter Info */}
              <div className="text-sm text-[rgb(var(--color-text-muted))]">
                <p className="mb-2">Showing {products.length} of {totalProducts} products</p>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-12 h-12 border-4 border-[rgb(var(--color-secondary))] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-[rgb(var(--color-text-muted))]">Loading products...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product) => (
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
                        {product.category?.name || 'Furniture'}
                      </p>
                      <h4 className="text-lg mb-2 group-hover:text-[rgb(var(--color-secondary))] transition-colors line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="font-medium">₫{Number(product.price).toLocaleString('vi-VN')}</p>
                      <p className={`text-sm mt-1 ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </p>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-6 py-2 ${
                        currentPage === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-[rgb(var(--color-primary))] hover:text-white'
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
                              ? 'bg-[rgb(var(--color-primary))] text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-6 py-2 ${
                        currentPage === totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-[rgb(var(--color-primary))] hover:text-white'
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
