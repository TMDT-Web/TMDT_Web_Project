/**
 * My Coupons Page - View user's coupons
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/Toast";

interface Coupon {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  status: string;
  valid_from: string;
  valid_until: string;
  description: string | null;
  used_at: string | null;
}

export default function MyCouponsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [filter, setFilter] = useState<string>("active");

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["my-coupons", filter],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        throw new Error("Not authenticated");
      }

      const params = new URLSearchParams();
      if (filter && filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/coupons/my-coupons?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
        }
        throw new Error("Failed to fetch coupons");
      }

      return response.json();
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã copy mã ${code}!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-300";
      case "used":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "expired":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Có thể dùng";
      case "used":
        return "Đã sử dụng";
      case "expired":
        return "Hết hạn";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
      <div className="container-custom max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">
          Mã khuyến mãi của tôi
        </h1>

        {/* Filter tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setFilter("all")}
            className={`pb-3 px-2 font-medium transition-colors ${
              filter === "all"
                ? "border-b-2 border-[rgb(var(--color-wood))] text-[rgb(var(--color-wood))]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`pb-3 px-2 font-medium transition-colors ${
              filter === "active"
                ? "border-b-2 border-[rgb(var(--color-wood))] text-[rgb(var(--color-wood))]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Có thể dùng
          </button>
          <button
            onClick={() => setFilter("used")}
            className={`pb-3 px-2 font-medium transition-colors ${
              filter === "used"
                ? "border-b-2 border-[rgb(var(--color-wood))] text-[rgb(var(--color-wood))]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Đã sử dụng
          </button>
          <button
            onClick={() => setFilter("expired")}
            className={`pb-3 px-2 font-medium transition-colors ${
              filter === "expired"
                ? "border-b-2 border-[rgb(var(--color-wood))] text-[rgb(var(--color-wood))]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Hết hạn
          </button>
        </div>

        {/* Coupons list */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[rgb(var(--color-wood))]"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : !coupons || coupons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600 text-lg mb-4">
              Bạn chưa có mã khuyến mãi nào
            </p>
            <p className="text-gray-500 text-sm">
              Mua hàng trên 8 triệu đồng để nhận mã giảm giá 300k!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
                  coupon.status === "active"
                    ? "border-purple-500"
                    : coupon.status === "used"
                    ? "border-gray-400"
                    : "border-red-400"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left side - Coupon code */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">🎁</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-purple-700">
                            {coupon.code}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                              coupon.status
                            )}`}
                          >
                            {getStatusText(coupon.status)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          {coupon.description || `Giảm ${coupon.discount_value.toLocaleString("vi-VN")}₫`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                      <div>
                        <span className="font-medium">Giá trị:</span>{" "}
                        <span className="text-purple-600 font-bold">
                          {coupon.discount_type === "fixed"
                            ? `${coupon.discount_value.toLocaleString("vi-VN")}₫`
                            : `${coupon.discount_value}%`}
                        </span>
                      </div>
                      {coupon.min_order_amount > 0 && (
                        <div>
                          <span className="font-medium">Đơn tối thiểu:</span>{" "}
                          {coupon.min_order_amount.toLocaleString("vi-VN")}₫
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Hạn dùng:</span>{" "}
                        {formatDate(coupon.valid_until)}
                      </div>
                    </div>

                    {coupon.used_at && (
                      <p className="text-sm text-gray-500 mt-2">
                        Đã sử dụng: {formatDate(coupon.used_at)}
                      </p>
                    )}
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className="px-4 py-2 border-2 border-[rgb(var(--color-wood))] text-[rgb(var(--color-wood))] rounded-lg hover:bg-[rgb(var(--color-wood))] hover:text-white transition-colors font-medium"
                    >
                      Copy mã
                    </button>
                    {coupon.status === "active" && (
                      <button
                        onClick={() => navigate("/cart")}
                        className="px-4 py-2 bg-[rgb(var(--color-wood))] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                      >
                        Dùng ngay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
          <h3 className="font-bold text-lg mb-2 text-purple-900">
            💡 Cách nhận mã khuyến mãi
          </h3>
          <ul className="space-y-2 text-purple-800">
            <li>
              ✅ Mua hàng trên <strong>8.000.000₫</strong> để nhận mã giảm{" "}
              <strong>300.000₫</strong>
            </li>
            <li>✅ Mã có hiệu lực <strong>30 ngày</strong> kể từ ngày nhận</li>
            <li>✅ Áp dụng cho đơn hàng tiếp theo</li>
            <li>✅ Kết hợp được với giảm giá VIP</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
