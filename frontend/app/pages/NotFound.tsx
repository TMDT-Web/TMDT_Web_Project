import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[url('./asset/img/bg-login-register.jpg')] bg-cover bg-center">
      <div className="p-10 md:px-16 md:py-12 rounded-xl w-full md:w-1/2 lg:w-1/3 h-auto md:h-screen flex flex-col justify-center items-center text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-100 mb-4">Không tìm thấy trang</h2>
        <p className="text-gray-200 mb-6">Trang bạn đang truy cập không tồn tại hoặc đã được chuyển đi.</p>

        <div className="flex flex-col w-full max-w-xs gap-3">
          <Link to="/" className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-semibold text-center">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
