import { useEffect, useState } from "react";
import { api } from "~/lib/api";

type Product = {
  id: number;
  name: string;
  price: number;
  sku?: string;
  category?: { id: number; name: string };
  created_at: string;
};

export default function AdminProducts() {
  const [rows, setRows] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<Product[]>(
        `/products${q ? `?q=${encodeURIComponent(q)}` : ""}`
      );
      const data = (res as any).data ?? (res as any);
      setRows(Array.isArray(data) ? data : (data?.items ?? []));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
            📦
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              Quản lý sản phẩm
            </h1>
            <p className="text-purple-100 mt-1">
              Tìm kiếm, thêm, sửa và quản lý sản phẩm
            </p>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              🔍
            </div>
            <input
              placeholder="Tìm kiếm sản phẩm theo tên, SKU, danh mục..."
              className="w-full rounded-xl border-2 border-slate-200 pl-12 pr-4 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all shadow-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && load()}
            />
          </div>
          <button
            onClick={load}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
          >
            🔎 Tìm kiếm
          </button>
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5">
            ➕ Thêm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <div className="text-slate-500 font-medium">
              Đang tải dữ liệu...
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-slate-500 font-medium">
              Không tìm thấy sản phẩm nào
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Tên sản phẩm
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-t border-slate-100 hover:bg-purple-50/50 transition-all ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {p.id}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {p.sku || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-green-600">
                        ₫{p.price.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        {p.category?.name ? (
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-semibold">
                            {p.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {new Date(p.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition shadow-sm hover:shadow-md">
                            ✏️ Sửa
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition shadow-sm hover:shadow-md">
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-t-2 border-purple-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700 font-medium">
                  Hiển thị{" "}
                  <span className="font-bold text-purple-600">
                    {rows.length}
                  </span>{" "}
                  sản phẩm
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-white transition shadow-sm">
                    ← Trước
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-md">
                    1
                  </button>
                  <button className="px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-white transition shadow-sm">
                    Sau →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
