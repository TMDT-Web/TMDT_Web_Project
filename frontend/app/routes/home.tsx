import { useState, useEffect } from "react";
import { Link } from "react-router";
import { getProducts, getCategories } from "~/lib/products";

// app/routes/home.tsx
export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // TODO: Thay thế bằng AuthContext thực tế khi có
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // State cho dữ liệu từ API
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products từ API
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
        setError(null);
      } catch (err) {
        setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage]);

  // Fetch categories từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Danh mục với hình ảnh mẫu (có thể thay thế bằng hình từ database sau)
  const furnitureCategories = [
    {
      id: 1,
      name: "Bàn làm việc",
      image:
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop",
      description: "Bàn học, bàn văn phòng",
      slug: "ban-lam-viec",
    },
    {
      id: 2,
      name: "Ghế văn phòng",
      image:
        "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop",
      description: "Ghế xoay, ghế gaming",
      slug: "ghe-van-phong",
    },
    {
      id: 3,
      name: "Sofa",
      image:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
      description: "Sofa, ghế thư giãn",
      slug: "sofa",
    },
    {
      id: 4,
      name: "Giường ngủ",
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      description: "Giường, nệm",
      slug: "giuong-ngu",
    },
    {
      id: 5,
      name: "Tủ & Kệ",
      image:
        "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=400&fit=crop",
      description: "Tủ quần áo, kệ sách",
      slug: "tu-ke",
    },
    {
      id: 6,
      name: "Bàn ăn",
      image:
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=400&fit=crop",
      description: "Bàn ăn, ghế ăn",
      slug: "ban-an",
    },
    {
      id: 7,
      name: "Đèn trang trí",
      image:
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop",
      description: "Đèn bàn, đèn trần",
      slug: "den-trang-tri",
    },
    {
      id: 8,
      name: "Phụ kiện",
      image:
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=400&fit=crop",
      description: "Tranh, gối, thảm",
      slug: "phu-kien",
    },
  ];

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll đến phần sản phẩm thay vì lên đầu trang
    const productsSection = document.getElementById("products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Hiển thị loading state
  if (loading && products.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Danh mục nội thất
            </h2>
            <p className="text-gray-600">
              Khám phá các sản phẩm nội thất chất lượng cho ngôi nhà của bạn
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {furnitureCategories.map((category) => (
              <Link
                key={category.id}
                to={`/danh-muc/${category.slug}`}
                className="group bg-white hover:bg-gray-50 rounded-xl overflow-hidden text-center transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-black hover:rounded-none"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 group-hover:text-blue-600">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="products-section" className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sản phẩm nổi bật
            </h2>
            <p className="text-gray-600">Những sản phẩm được yêu thích nhất</p>
          </div>

          {/* Hiển thị error nếu có */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <Link to={`/products/${product.id}`} className="block">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.main_image ? (
                      <img
                        src={product.main_image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-6xl mb-2">🪑</div>
                          <div className="text-sm font-medium">Nội thất</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 mb-2 hover:text-blue-600 line-clamp-2 min-h-[48px]">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-blue-600">
                      {Number(product.price).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-sm font-medium ${product.stock_quantity > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {product.stock_quantity > 0 ? "✓ Còn hàng" : "✗ Hết hàng"}
                    </span>
                    <span className="text-xs text-gray-500">
                      Còn {product.stock_quantity} sản phẩm
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm">
                      Mua ngay
                    </button>
                    <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                      🛒 Thêm vào giỏ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white"
              }`}
            >
              ← Trước
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white"
              }`}
            >
              Tiếp →
            </button>
          </div>

          {/* Nút đăng nhập để mua ngay - Chỉ hiện khi chưa đăng nhập */}
          {!isLoggedIn && (
            <div className="text-center mt-6">
              <div className="inline-block bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 shadow-md">
                <p className="text-gray-700 mb-3 text-lg font-medium">
                  🔒 Đăng nhập để mua sản phẩm
                </p>
                <Link
                  to="/login"
                  className="inline-block bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl"
                >
                  Đăng nhập ngay →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-gray-600">
              Cam kết mang đến trải nghiệm mua sắm tốt nhất
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Giao hàng nhanh</h3>
              <p className="text-gray-600 text-sm">
                Miễn phí vận chuyển cho đơn hàng trên 500k
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Chất lượng đảm bảo</h3>
              <p className="text-gray-600 text-sm">
                Sản phẩm chính hãng, kiểm định chất lượng
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">↩️</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Đổi trả dễ dàng</h3>
              <p className="text-gray-600 text-sm">
                Đổi trả trong 7 ngày nếu có lỗi
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Hỗ trợ 24/7</h3>
              <p className="text-gray-600 text-sm">
                Luôn sẵn sàng tư vấn và hỗ trợ khách hàng
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
