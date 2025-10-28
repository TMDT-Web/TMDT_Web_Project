import { Outlet, Link } from "react-router";

export default function Layout() {
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

          {/* Giỏ hàng + nút */}
          <div className="flex items-center gap-4">
            <button className="relative">
              🛒
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full px-1.5">
                0
              </span>
            </button>
            <Link to="/auth/login" className="text-sm font-medium">
              Đăng nhập
            </Link>
            <Link
              to="/auth/register"
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold"
            >
              Đăng ký
            </Link>
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

        <section className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-blue-600 font-medium text-sm bg-blue-50 px-3 py-1 rounded-full">
                Sàn thương mại điện tử đa dạng
              </span>

              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Mua sắm thông minh,<br />
                <span className="text-blue-600">Bán hàng dễ dàng</span>
              </h1>

              <p className="mt-4 text-gray-600 max-w-lg">
                Kết nối người mua và người bán. Từ sản phẩm mới chính hãng đến đồ cũ chất lượng, tất cả đều có tại đây.
              </p>

              <div className="mt-6 flex gap-3">
                <button className="bg-blue-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700 transition">
                  Khám phá ngay →
                </button>
                <button className="border border-gray-300 px-5 py-2 rounded-md font-semibold hover:bg-gray-50 transition">
                  Đăng bán đồ cũ
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <img
                src="app\asset\img\online-shopping-ecommerce-illustration.jpg"
                alt="Online Shopping"
                className="max-w-md"
              />
            </div>
        </section>

      {/* Nội dung trang */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Nội Thất 24h - Mua sắm thông minh, bán hàng dễ dàng.
      </footer>
    </div>
  );
}
