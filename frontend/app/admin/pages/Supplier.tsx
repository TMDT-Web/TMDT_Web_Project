import * as React from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

type Supplier = {
  id: number;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at: string;
};

export default function SupplierPage() {
  const auth = useAuth();
  const canEdit = auth.hasRole?.("root", "admin", "manager");

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get<Supplier[]>("/suppliers");
      const data = (res as any).data ?? (res as any);
      setSuppliers(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = React.useMemo(() => {
    if (!searchQuery) return suppliers;
    const query = searchQuery.toLowerCase();
    return suppliers.filter(
      (sup) =>
        sup.name.toLowerCase().includes(query) ||
        sup.email?.toLowerCase().includes(query) ||
        sup.phone?.includes(query)
    );
  }, [suppliers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
            🏭
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              Quản lý nhà cung cấp
            </h1>
            <p className="text-cyan-100 mt-1">
              Thông tin đối tác và nhà cung cấp
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
              placeholder="Tìm kiếm nhà cung cấp theo tên, email, SĐT..."
              className="w-full rounded-xl border-2 border-slate-200 pl-12 pr-4 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {canEdit && (
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5">
              ➕ Thêm NCC
            </button>
          )}
          {!canEdit && (
            <div
              className="px-6 py-3 rounded-xl bg-slate-300 text-slate-600 font-bold cursor-not-allowed"
              title="Chỉ root/admin/manager mới có quyền thêm"
            >
              🔒 Chỉ xem
            </div>
          )}
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <div className="text-slate-500 font-medium">
              Đang tải nhà cung cấp...
            </div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-slate-500 font-medium">
              Không tìm thấy nhà cung cấp nào
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
            {filteredSuppliers.map((sup) => (
              <div
                key={sup.id}
                className="group p-6 rounded-2xl border-2 border-slate-200 hover:border-cyan-300 hover:shadow-xl transition-all bg-gradient-to-br from-white to-slate-50 hover:from-cyan-50 hover:to-blue-50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                      🏢
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {sup.name}
                      </h3>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        ID: {sup.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {sup.contact_person && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">👤 Người liên hệ:</span>
                      <span className="font-semibold text-slate-900">
                        {sup.contact_person}
                      </span>
                    </div>
                  )}
                  {sup.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">📧 Email:</span>
                      <span className="font-medium text-blue-600">
                        {sup.email}
                      </span>
                    </div>
                  )}
                  {sup.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">📱 SĐT:</span>
                      <span className="font-medium text-slate-900">
                        {sup.phone}
                      </span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-slate-500">📍 Địa chỉ:</span>
                      <span className="text-slate-700 line-clamp-2">
                        {sup.address}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button className="flex-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition shadow-sm">
                    ✏️ Sửa
                  </button>
                  <button className="flex-1 px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition shadow-sm">
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
