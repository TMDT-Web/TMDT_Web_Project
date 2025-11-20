import * as React from "react";

type ImportRecord = {
  id: number;
  supplier: string;
  totalCost: number;
  items: number;
  date: string;
  status: "pending" | "completed" | "cancelled";
};

export default function ImportPage() {
  const [imports, setImports] = React.useState<ImportRecord[]>([
    {
      id: 1,
      supplier: "Công ty TNHH Gỗ Việt",
      totalCost: 45000000,
      items: 120,
      date: "15/11/2025",
      status: "completed",
    },
    {
      id: 2,
      supplier: "Xưởng mộc Tân Phát",
      totalCost: 32000000,
      items: 85,
      date: "18/11/2025",
      status: "pending",
    },
    {
      id: 3,
      supplier: "Công ty Nội thất Hòa Phát",
      totalCost: 68000000,
      items: 200,
      date: "19/11/2025",
      status: "completed",
    },
  ]);

  const [statusFilter, setStatusFilter] = React.useState("all");

  const filteredImports = React.useMemo(() => {
    if (statusFilter === "all") return imports;
    return imports.filter((imp) => imp.status === statusFilter);
  }, [imports, statusFilter]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Đang xử lý",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  const totalStats = React.useMemo(() => {
    return {
      totalImports: imports.length,
      totalCost: imports.reduce((sum, imp) => sum + imp.totalCost, 0),
      totalItems: imports.reduce((sum, imp) => sum + imp.items, 0),
    };
  }, [imports]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
            📥
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              Quản lý nhập hàng
            </h1>
            <p className="text-indigo-100 mt-1">
              Theo dõi phiếu nhập và quản lý kho
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl">
              📋
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
              Tổng
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {totalStats.totalImports}
          </div>
          <div className="text-sm text-slate-600 font-medium">
            Phiếu nhập hàng
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-2xl">
              💰
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">
              VNĐ
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {(totalStats.totalCost / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm text-slate-600 font-medium">Tổng chi phí</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
              📦
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">
              Items
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {totalStats.totalItems}
          </div>
          <div className="text-sm text-slate-600 font-medium">
            Sản phẩm nhập
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">
              Trạng thái:
            </span>
            {["all", "pending", "completed", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  statusFilter === status
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {status === "all" ? "Tất cả" : getStatusLabel(status)}
              </button>
            ))}
          </div>
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5">
            ➕ Tạo phiếu nhập
          </button>
        </div>
      </div>

      {/* Import Records */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Mã PN
                </th>
                <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Nhà cung cấp
                </th>
                <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Tổng chi phí
                </th>
                <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Ngày nhập
                </th>
                <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredImports.map((imp, i) => (
                <tr
                  key={imp.id}
                  className={`border-t border-slate-100 hover:bg-indigo-50/50 transition-all ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <td className="py-4 px-6">
                    <span className="font-mono font-bold text-slate-900">
                      PN-{imp.id.toString().padStart(4, "0")}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-900">
                    {imp.supplier}
                  </td>
                  <td className="py-4 px-6 font-bold text-green-600">
                    ₫{imp.totalCost.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold">
                      {imp.items} items
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{imp.date}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusBadge(imp.status)}`}
                    >
                      {getStatusLabel(imp.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition shadow-sm">
                        👁️ Xem
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition shadow-sm">
                        ✏️ Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
