import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  getCurrentUser,
  getAccessToken,
  updateCurrentUser,
  clearTokens,
  isAuthenticated,
} from "../lib/auth";
import { getOrders } from "../lib/orders";

export default function Account() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error("Vui lòng đăng nhập", {
        toastId: "login-required",
      });
      // Dùng replace để THAY THẾ history thay vì thêm mới
      // Ngăn user quay lại trang account khi chưa login
      navigate("/auth/login", { replace: true });
      return;
    }

    loadAccountData();
  }, [navigate]);

  const loadAccountData = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const [userData, ordersData] = await Promise.all([
        getCurrentUser(token),
        getOrders().catch(() => []),
      ]);

      setUser(userData);
      setOrders(ordersData);
    } catch (error: any) {
      toast.error(error.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bronze mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Tài khoản của tôi
          </h1>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Đăng xuất
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-bronze/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold text-bronze">
                    {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">
                  {user?.full_name}
                </h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium ${
                    activeTab === "profile"
                      ? "bg-bronze/10 text-bronze"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium ${
                    activeTab === "orders"
                      ? "bg-bronze/10 text-bronze"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Đơn hàng của tôi
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Thông tin cá nhân
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={user?.full_name || ""}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={user?.phone_number || "Chưa cập nhật"}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày tham gia
                    </label>
                    <input
                      type="text"
                      value={
                        user?.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                              "vi-VN"
                            )
                          : ""
                      }
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Đơn hàng của tôi
                </h2>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-600 mb-4">
                      Bạn chưa có đơn hàng nào
                    </p>
                    <Link to="/products" className="btn-primary inline-block">
                      Mua sắm ngay
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <Link
                        key={order.id}
                        to={`/orders/${order.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-bronze hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Đơn hàng #{order.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString(
                                "vi-VN"
                              )}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-bronze">
                          {order.total_amount.toLocaleString("vi-VN")}₫
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
