import * as React from "react";
import { api } from "~/lib/api";

type Order = {
  id: number;
  order_number: string;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: string;
};

export default function OrderPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");

  React.useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get<Order[]>("/orders");
      const data = (res as any).data ?? (res as any);
      setOrders(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = React.useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      processing: "bg-blue-100 text-blue-700",
      shipping: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý",
      shipping: "Đang giao",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
              🛒
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">
                Quản lý đơn hàng
              </h1>
              <p className="text-emerald-100 mt-1">
                Theo dõi và xử lý đơn hàng
              </p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
            <div className="text-xs text-emerald-200 uppercase tracking-wide">
              Tổng đơn
            </div>
            <div className="text-2xl font-bold text-white">{orders.length}</div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-700">
            Lọc theo trạng thái:
          </span>
          {[
            "all",
            "pending",
            "processing",
            "shipping",
            "completed",
            "cancelled",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === status
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status === "all" ? "Tất cả" : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <div className="text-slate-500 font-medium">
              Đang tải đơn hàng...
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-slate-500 font-medium">
              Không có đơn hàng nào
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Mã ĐH
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Ngày đặt
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, i) => (
                    <tr
                      key={order.id}
                      className={`border-t border-slate-100 hover:bg-emerald-50/50 transition-all ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-slate-900">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-900">
                        User #{order.user_id}
                      </td>
                      <td className="py-4 px-6 font-bold text-green-600">
                        ₫{order.total_amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusBadge(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {new Date(order.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-4 px-6">
                        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold hover:from-blue-600 hover:to-indigo-600 transition shadow-sm">
                          👁️ Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-emerald-50 px-6 py-4 border-t-2 border-emerald-100">
              <div className="text-sm text-slate-700 font-medium">
                Hiển thị{" "}
                <span className="font-bold text-emerald-600">
                  {filteredOrders.length}
                </span>{" "}
                đơn hàng
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
