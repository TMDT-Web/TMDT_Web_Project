import * as React from "react";
import { useAuth } from "~/context/AuthContext";

export default function WarrantyPage() {
  const auth = useAuth();
  // Root, Manager, Admin, Staff đều có thể quản lý bảo hành
  const canEdit = auth.hasRole?.("root", "admin", "manager", "staff");

  const warranties = [
    {
      id: 1,
      product: "Bàn gỗ cao cấp",
      customer: "Nguyễn Văn A",
      startDate: "01/11/2025",
      endDate: "01/11/2026",
      status: "active",
    },
    {
      id: 2,
      product: "Ghế xoay văn phòng",
      customer: "Trần Thị B",
      startDate: "15/10/2025",
      endDate: "15/10/2027",
      status: "active",
    },
    {
      id: 3,
      product: "Tủ quần áo 3 cánh",
      customer: "Lê Văn C",
      startDate: "20/09/2024",
      endDate: "20/09/2025",
      status: "expired",
    },
  ];

  const [statusFilter, setStatusFilter] = React.useState("all");

  const filteredWarranties = React.useMemo(() => {
    if (statusFilter === "all") return warranties;
    return warranties.filter((w) => w.status === statusFilter);
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };

  const getStatusLabel = (status: string) => {
    return status === "active" ? "Còn hiệu lực" : "Hết hạn";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
              🛡️
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">
                Quản lý bảo hành
              </h1>
              <p className="text-teal-100 mt-1">
                Theo dõi thời hạn bảo hành sản phẩm
              </p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
            <div className="text-xs text-teal-200 uppercase tracking-wide">
              Đang bảo hành
            </div>
            <div className="text-2xl font-bold text-white">
              {warranties.filter((w) => w.status === "active").length}
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-700">
            Lọc theo trạng thái:
          </span>
          {["all", "active", "expired"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === status
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status === "all"
                ? "Tất cả"
                : status === "active"
                  ? "Còn hiệu lực"
                  : "Hết hạn"}
            </button>
          ))}
        </div>
      </div>

      {/* Warranty Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredWarranties.map((warranty) => (
          <div
            key={warranty.id}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-slate-200 hover:shadow-2xl hover:border-teal-300 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-2xl shadow-md">
                  🛡️
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {warranty.product}
                  </h3>
                  <p className="text-sm text-slate-600">ID: #{warranty.id}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusBadge(warranty.status)}`}
              >
                {getStatusLabel(warranty.status)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">👤 Khách hàng:</span>
                <span className="font-semibold text-slate-900">
                  {warranty.customer}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">📅 Ngày bắt đầu:</span>
                <span className="font-medium text-slate-900">
                  {warranty.startDate}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">⏰ Ngày hết hạn:</span>
                <span className="font-medium text-slate-900">
                  {warranty.endDate}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button className="flex-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition shadow-sm">
                👁️ Chi tiết
              </button>
              <button className="flex-1 px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition shadow-sm">
                ✏️ Gia hạn
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
