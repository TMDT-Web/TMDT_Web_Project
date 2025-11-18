import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  // Ẩn carousel khi vào trang chi tiết sản phẩm
  const hideCarousel = location.pathname.startsWith("/products/");

  const slides = [
    {
      title: "Mua sắm thông minh,",
      highlight: "Bán hàng dễ dàng",
      description:
        "Kết nối người mua và người bán. Từ sản phẩm mới chính hãng đến đồ cũ chất lượng, tất cả đều có tại đây.",
      badge: "Sàn thương mại điện tử đa dạng",
      image: "app\\asset\\img\\online-shopping-ecommerce-illustration.jpg",
    },
    {
      title: "Nội thất chất lượng,",
      highlight: "Giá cả phải chăng",
      description:
        "Hàng ngàn sản phẩm nội thất đa dạng từ bàn ghế, giường tủ đến đồ trang trí, đáp ứng mọi nhu cầu của bạn.",
      badge: "Ưu đãi hấp dẫn mỗi ngày",
      image: "app\\asset\\img\\online-shopping-ecommerce-illustration.jpg",
    },
    {
      title: "Giao hàng nhanh chóng,",
      highlight: "Đổi trả dễ dàng",
      description:
        "Miễn phí vận chuyển cho đơn hàng trên 500k. Đổi trả trong vòng 7 ngày nếu sản phẩm có lỗi.",
      badge: "Cam kết chất lượng",
      image: "app\\asset\\img\\online-shopping-ecommerce-illustration.jpg",
    },
  ];

  // Auto slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-blue-600 text-xl font-bold">
              Nội Thất 24h
            </span>
          </Link>

          {/* Thanh tìm kiếm */}
          <div className="flex-1 mx-6">
            <input
              type="text"
              placeholder="Tìm kiếm nội thất, đồ trang trí..."
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Giỏ hàng + Auth */}
            <div className="flex items-center gap-4">
              <button className="relative">
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full px-1.5">
                  0
                </span>
              </button>

              {user ? (
                <>
                  {/* Hiển thị tên/email + link admin nếu có quyền */}
                  <span className="text-sm text-gray-700">
                    Hi, {user.full_name || user.email}
                  </span>

                  {hasRole("admin", "root") && (
                    <Link
                      to="/admin/dashboard"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Admin
                    </Link>
                  )}

                  <button
                    onClick={logout}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="text-sm font-medium">
                    Đăng nhập
                  </Link>
                  <Link
                    to="/auth/register"
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>

        </div>

        {/* Menu danh mục */}
        <nav className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-5 text-sm text-gray-700">
            <Link to="/">Tất cả</Link>
            <Link to="/danh-muc/ban-lam-viec">Bàn làm việc</Link>
            <Link to="/danh-muc/ghe-van-phong">Ghế văn phòng</Link>
            <Link to="/danh-muc/sofa">Sofa & Ghế thư giãn</Link>
            <Link to="/danh-muc/giuong-ngu">Giường ngủ</Link>
            <Link to="/danh-muc/tu">Tủ & Kệ</Link>
            <Link to="/danh-muc/ban-an">Bàn ăn & Ghế ăn</Link>
            <Link to="/danh-muc/den">Đèn trang trí</Link>
            <Link to="/danh-muc/phu-kien">Phụ kiện nội thất</Link>
          </div>
        </nav>
      </header>

      {/* Hero Carousel Section - Ẩn khi vào trang chi tiết sản phẩm */}
      {!hideCarousel && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-blue-50 to-white">
          <div className="relative">
            {/* Slides Container */}
            <div className="relative h-[600px]">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentSlide
                      ? "opacity-100 translate-x-0"
                      : index < currentSlide
                        ? "opacity-0 -translate-x-full"
                        : "opacity-0 translate-x-full"
                  }`}
                >
                  <div className="max-w-7xl mx-auto px-4 h-full grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                      <span className="inline-block text-blue-600 font-medium text-sm bg-white px-4 py-2 rounded-full shadow-sm">
                        {slide.badge}
                      </span>

                      <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                        {slide.title}
                        <br />
                        <span className="text-blue-600">{slide.highlight}</span>
                      </h1>

                      <p className="text-gray-600 text-lg max-w-lg">
                        {slide.description}
                      </p>

                      <div className="flex gap-4 pt-4">
                        <Link
                          to="/"
                          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                        >
                          Khám phá ngay →
                        </Link>
                      </div>
                    </div>

                    <div className="flex justify-center items-center">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="max-w-lg w-full object-contain drop-shadow-2xl"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Previous Button */}
            <button
              onClick={prevSlide}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-4 rounded-full shadow-xl transition-all z-10 hover:scale-110"
              aria-label="Previous slide"
            >
              <svg
                className="w-6 h-6 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-4 rounded-full shadow-xl transition-all z-10 hover:scale-110"
              aria-label="Next slide"
            >
              <svg
                className="w-6 h-6 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center gap-3 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 ${
                  index === currentSlide
                    ? "w-12 h-4 bg-blue-600 shadow-lg"
                    : "w-4 h-4 bg-white/70 hover:bg-white shadow-md"
                } rounded-full`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Nội dung trang */}
      <main className="flex-1">
        import { Outlet } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
    return (
        <div className="min-h-screen bg-[rgb(var(--color-bg-light))]">
            <Navbar />
            <main className="pt-20">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Nội Thất 24h - Mua sắm thông minh, bán
        hàng dễ dàng.
      </footer>
    </div>
  );
}
