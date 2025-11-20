import * as React from "react";
import { api } from "~/lib/api";

type Category = {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  created_at: string;
};

export default function CategoryPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get<Category[]>("/categories");
      const data = (res as any).data ?? (res as any);
      setCategories(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
            📁
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              Quản lý danh mục
            </h1>
            <p className="text-amber-100 mt-1">
              Phân loại và tổ chức sản phẩm theo danh mục
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
              placeholder="Tìm kiếm danh mục..."
              className="w-full rounded-xl border-2 border-slate-200 pl-12 pr-4 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5">
            ➕ Thêm danh mục
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <div className="text-slate-500 font-medium">
              Đang tải danh mục...
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-slate-500 font-medium">
              Không tìm thấy danh mục nào
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="group p-6 rounded-2xl border-2 border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all bg-gradient-to-br from-white to-slate-50 hover:from-amber-50 hover:to-orange-50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                    📂
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
                    ID: {cat.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {cat.name}
                </h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 h-10">
                  {cat.description || "Không có mô tả"}
                </p>
                <div className="flex gap-2">
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
