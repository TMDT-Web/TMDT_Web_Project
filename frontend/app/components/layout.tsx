import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";

export default function Layout() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const location = useLocation();

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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header
        className="shadow-lg border-b border-white/20"
        style={{ backgroundColor: "rgb(20, 10, 5)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4">
          <Link to="/" className="flex items-center gap-3 group">
            {/* Logo Icon */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <svg
                  className="w-7 h-7 text-gray-800"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3L2 9v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9l-10-6zm6 16H6v-8h12v8zm-10-2h8v-4H8v4z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
            {/* Logo Text */}
            <div className="flex flex-col">
              <span
                className="text-2xl font-bold text-white tracking-tight leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                FurniHub
              </span>
              <span className="text-[10px] text-white font-medium tracking-widest uppercase">
                Nội Thất Đẳng Cấp
              </span>
            </div>
          </Link>

          {/* Thanh tìm kiếm */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full border-2 border-white/30 bg-white text-black placeholder-gray-500 rounded-lg pl-4 pr-12 py-1.5 text-sm focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-80 transition-opacity"
                onClick={() => {
                  // TODO: Xử lý tìm kiếm
                  console.log("Tìm kiếm");
                }}
              >
                <svg
                  className="h-5 w-5 text-gray-600 hover:text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Giỏ hàng + nút */}
          <div className="flex items-center gap-4">
            <button className="relative text-2xl border-2 border-white rounded-lg px-2 py-1 hover:bg-white/10 transition-colors">
              🛒
              <span className="absolute -top-2 -right-2 bg-white text-black text-xs rounded-full px-1.5 font-semibold">
                0
              </span>
            </button>
            <Link
              to="/auth/login"
              className="text-sm font-medium text-white hover:text-gray-200 border-2 border-white px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              to="/auth/register"
              className="bg-white text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-200 border-2 border-white transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Carousel Section - Ẩn khi vào trang chi tiết sản phẩm */}
      {!hideCarousel && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-gray-50 to-white">
          <div className="relative">
            {/* Slides Container */}
            <div className="relative h-screen">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    index === currentSlide
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center px-4">
                    <div className="max-w-7xl w-full grid md:grid-cols-2 gap-8 items-center">
                      {/* Left half - clickable to go previous */}
                      <div
                        className="space-y-6 z-10 cursor-pointer"
                        onClick={prevSlide}
                      >
                        <span className="inline-block text-black font-medium text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                          {slide.badge}
                        </span>

                        <h1 className="text-5xl md:text-6xl font-bold leading-tight text-black">
                          {slide.title}
                          <br />
                          <span className="text-black">{slide.highlight}</span>
                        </h1>

                        <p className="text-black text-lg max-w-lg">
                          {slide.description}
                        </p>

                        <div className="flex gap-4 pt-4">
                          <Link
                            to="/"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg hover:shadow-xl"
                          >
                            Khám phá ngay →
                          </Link>
                        </div>
                      </div>

                      {/* Right half - clickable to go next */}
                      <div
                        className="flex justify-center items-center cursor-pointer"
                        onClick={nextSlide}
                      >
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="max-w-2xl w-full object-contain drop-shadow-2xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots Navigation */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center gap-3 z-10">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 ${
                    index === currentSlide
                      ? "w-12 h-4 bg-white shadow-lg"
                      : "w-4 h-4 bg-gray-300 hover:bg-gray-400 shadow-md"
                  } rounded-full`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nội dung trang */}
      <main className="flex-1 bg-white">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        className="text-white border-t border-white/20"
        style={{ backgroundColor: "rgb(20, 10, 5)" }}
      >
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-200 rounded-lg flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-gray-800"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold font-serif">FurniHub</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Cung cấp nội thất chất lượng cao với thiết kế hiện đại, phù hợp
                mọi không gian sống và làm việc của bạn.
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  aria-label="TikTok"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Liên kết nhanh</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Trang chủ</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Sản phẩm</span>
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Về chúng tôi</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Tin tức</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Liên hệ</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Customer Support */}
            <div>
              <h3 className="text-lg font-bold mb-4">Hỗ trợ khách hàng</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Hướng dẫn mua hàng</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Chính sách đổi trả</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Chính sách bảo hành</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Câu hỏi thường gặp</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span>→</span>
                    <span>Điều khoản sử dụng</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-bold mb-4">Thông tin liên hệ</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm">
                  <svg
                    className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="text-gray-300">
                    <p className="font-semibold text-white mb-1">Địa chỉ:</p>
                    <p>123 Đường Nguyễn Văn Linh, Quận 7, TP. HCM</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <svg
                    className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div className="text-gray-300">
                    <p className="font-semibold text-white mb-1">Hotline:</p>
                    <p>1900 1234 (8:00 - 22:00)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <svg
                    className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="text-gray-300">
                    <p className="font-semibold text-white mb-1">Email:</p>
                    <p>support@furnihub.com</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} FurniHub - Mua sắm thông minh, bán
                hàng dễ dàng.
              </p>
              <div className="flex gap-6 text-sm">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Chính sách bảo mật
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Điều khoản dịch vụ
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Sitemap
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
