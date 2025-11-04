import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nội Thất 24h - Trang chủ" },
    { name: "description", content: "Mua sắm nội thất chất lượng, giá tốt" },
  ];
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // TODO: Thay thế bằng AuthContext thực tế khi có
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const furnitureCategories = [
    {
      id: 1,
      name: "Bàn làm việc",
      icon: "🖥️",
      description: "Bàn học, bàn văn phòng",
      slug: "ban-lam-viec",
    },
    {
      id: 2,
      name: "Ghế văn phòng",
      icon: "🪑",
      description: "Ghế xoay, ghế gaming",
      slug: "ghe-van-phong",
    },
    {
      id: 3,
      name: "Sofa",
      icon: "🛋️",
      description: "Sofa, ghế thư giãn",
      slug: "sofa",
    },
    {
      id: 4,
      name: "Giường ngủ",
      icon: "🛏️",
      description: "Giường, nệm",
      slug: "giuong-ngu",
    },
    {
      id: 5,
      name: "Tủ & Kệ",
      icon: "🗄️",
      description: "Tủ quần áo, kệ sách",
      slug: "tu-ke",
    },
    {
      id: 6,
      name: "Bàn ăn",
      icon: "🍽️",
      description: "Bàn ăn, ghế ăn",
      slug: "ban-an",
    },
    {
      id: 7,
      name: "Đèn trang trí",
      icon: "💡",
      description: "Đèn bàn, đèn trần",
      slug: "den-trang-tri",
    },
    {
      id: 8,
      name: "Phụ kiện",
      icon: "🎨",
      description: "Tranh, gối, thảm",
      slug: "phu-kien",
    },
  ];

  const products = [
    {
      id: 1,
      name: "Bàn làm việc gỗ sồi hiện đại",
      price: 2500000,
      image: null,
      stock: 15,
    },
    {
      id: 2,
      name: "Ghế văn phòng ergonomic cao cấp",
      price: 3200000,
      image: null,
      stock: 8,
    },
    {
      id: 3,
      name: "Sofa góc L chữ U phong cách Bắc Âu",
      price: 15000000,
      image: null,
      stock: 5,
    },
    {
      id: 4,
      name: "Giường ngủ gỗ tự nhiên 1m8",
      price: 8500000,
      image: null,
      stock: 10,
    },
    {
      id: 5,
      name: "Tủ quần áo 4 cánh hiện đại",
      price: 6200000,
      image: null,
      stock: 7,
    },
    {
      id: 6,
      name: "Bàn ăn tròn 6 ghế sang trọng",
      price: 9800000,
      image: null,
      stock: 4,
    },
    {
      id: 7,
      name: "Đèn chùm pha lê cao cấp",
      price: 4500000,
      image: null,
      stock: 12,
    },
    {
      id: 8,
      name: "Thảm trải sàn phong cách Scandinavian",
      price: 1200000,
      image: null,
      stock: 20,
    },
    {
      id: 9,
      name: "Kệ sách gỗ công nghiệp 5 tầng",
      price: 1800000,
      image: null,
      stock: 18,
    },
    {
      id: 10,
      name: "Ghế ăn bọc nệm cao cấp",
      price: 850000,
      image: null,
      stock: 25,
    },
    {
      id: 11,
      name: "Tủ giày 3 tầng đa năng",
      price: 1500000,
      image: null,
      stock: 14,
    },
    {
      id: 12,
      name: "Bàn trang điểm có gương LED",
      price: 3500000,
      image: null,
      stock: 6,
    },
    {
      id: 13,
      name: "Ghế sofa đơn thư giãn",
      price: 5200000,
      image: null,
      stock: 9,
    },
    {
      id: 14,
      name: "Tủ đầu giường hiện đại",
      price: 950000,
      image: null,
      stock: 22,
    },
    {
      id: 15,
      name: "Đèn bàn học chống cận",
      price: 450000,
      image: null,
      stock: 30,
    },
    {
      id: 16,
      name: "Bàn cafe mini 2 ghế",
      price: 2200000,
      image: null,
      stock: 11,
    },
  ];

  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = products.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
                className="group bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg border border-gray-100 hover:border-blue-200"
              >
                <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 group-hover:text-blue-600">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sản phẩm nổi bật
            </h2>
            <p className="text-gray-600">Những sản phẩm được yêu thích nhất</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <Link to={`/products/${product.id}`} className="block">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-6xl mb-2">🪑</div>
                        <div className="text-sm font-medium">Nội thất</div>
                      </div>
                    </div>
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
                      {product.price.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Còn hàng
                    </span>
                    <span className="text-xs text-gray-500">
                      Còn {product.stock} sản phẩm
                    </span>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    🛒 Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - Chỉ hiển thị khi đã đăng nhập */}
          {isLoggedIn ? (
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
          ) : (
            <div className="text-center mt-10">
              <div className="inline-block">
                <p className="text-gray-600 mb-4 text-lg">
                  🔒 Đăng nhập để xem thêm sản phẩm
                </p>
                <Link
                  to="/login"
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
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
