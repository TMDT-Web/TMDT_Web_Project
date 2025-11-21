import { useEffect, useState } from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

type Product = {
  id: number;
  name: string;
  price: number;
  sku?: string;
  description?: string;
  stock_quantity?: number;
  is_active?: boolean;
  main_image?: string;
  images?:
    | Array<{ id: number; file_path: string; is_primary: boolean }>
    | string[]; // Support cả 2 format
  specifications?: Record<string, any>;
  category?: { id: number; name: string };
  category_id?: number;
  created_at: string;
  updated_at?: string;
};

type Category = {
  id: number;
  name: string;
};

export default function AdminProducts() {
  const auth = useAuth();
  // Root, Manager, Admin có quyền chỉnh sửa
  const canEdit = auth.hasRole?.("root", "admin", "manager");

  const [rows, setRows] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Advanced filters
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("");
  const [skuSearch, setSkuSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Helper function để convert images từ backend format sang string array
  const getImageUrls = (product: Product): string[] => {
    if (!product.images || product.images.length === 0) return [];

    // Check if images is array of objects (backend format)
    if (
      typeof product.images[0] === "object" &&
      "file_path" in product.images[0]
    ) {
      return (
        product.images as Array<{
          id: number;
          file_path: string;
          is_primary: boolean;
        }>
      ).map((img) => img.file_path);
    }

    // Already string array (frontend format)
    return product.images as string[];
  };

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.append("q", q.trim());
      if (selectedCategory) params.append("category_id", selectedCategory);
      if (minPrice) params.append("min_price", minPrice);
      if (maxPrice) params.append("max_price", maxPrice);
      params.append("page", page.toString());
      params.append("size", pageSize.toString());

      const res = await api.get(`/products?${params.toString()}`);
      const data = (res as any).data ?? (res as any);
      let items = data?.items ?? [];
      let totalCount = data?.total ?? 0;

      // Filter by SKU (client-side) - exact or partial match
      if (skuSearch.trim()) {
        items = items.filter((item: Product) =>
          item.sku?.toLowerCase().includes(skuSearch.toLowerCase())
        );
      }

      // Filter by status (client-side)
      if (selectedStatus === "active") {
        items = items.filter((item: Product) => item.is_active);
      } else if (selectedStatus === "inactive") {
        items = items.filter((item: Product) => !item.is_active);
      }

      // Filter by stock (client-side)
      if (stockFilter === "in_stock") {
        items = items.filter((item: Product) => (item.stock_quantity || 0) > 0);
      } else if (stockFilter === "out_of_stock") {
        items = items.filter(
          (item: Product) => (item.stock_quantity || 0) === 0
        );
      } else if (stockFilter === "low_stock") {
        items = items.filter(
          (item: Product) =>
            (item.stock_quantity || 0) > 0 && (item.stock_quantity || 0) <= 10
        );
      }

      // Update total based on filtered items if client-side filtering is applied
      if (skuSearch || selectedStatus || stockFilter) {
        totalCount = items.length;
      }

      setRows(items);
      setTotal(totalCount);
    } catch (error) {
      console.error("Error loading products:", error);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get<Category[]>("/categories");
      const data = (res as any).data ?? (res as any);
      setCategories(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }

  const resetFilters = () => {
    setQ("");
    setSelectedCategory("");
    setSelectedStatus("");
    setMinPrice("");
    setMaxPrice("");
    setStockFilter("");
    setSkuSearch("");
    setPage(1);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1); // Reset to page 1 when search query changes
      } else {
        load();
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    selectedCategory,
    selectedStatus,
    minPrice,
    maxPrice,
    stockFilter,
    skuSearch,
  ]);

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!canEdit) {
      alert("❌ Bạn không có quyền xóa sản phẩm!");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await api.delete(`/products/${id}`);
      alert("✅ Đã xóa sản phẩm!");
      load();
    } catch (err: any) {
      alert(err?.message || "❌ Xóa thất bại!");
    }
  };

  const handleEdit = (product: Product) => {
    if (!canEdit) {
      alert("❌ Bạn không có quyền sửa sản phẩm!");
      return;
    }
    setEditing(product);
  };

  const handleCreate = () => {
    if (!canEdit) {
      alert("❌ Bạn không có quyền thêm sản phẩm!");
      return;
    }
    setCreating(true);
  };

  const handleSaved = () => {
    setEditing(null);
    setCreating(false);
    // Reset về trang 1 và xóa bộ lọc để thấy sản phẩm mới
    setPage(1);
    setQ("");
    // Đợi state update xong rồi mới load
    setTimeout(() => load(), 100);
  };

  const handleSearch = () => {
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

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
        {/* Search bar và nút chính */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                🔍
              </div>
              <input
                placeholder="Tìm kiếm theo tên, SKU, hoặc mô tả sản phẩm..."
                className="w-full rounded-xl border-2 border-slate-200 pl-12 pr-12 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all shadow-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                  }
                }}
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Xóa tìm kiếm"
                >
                  ❌
                </button>
              )}
              {loading && q && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 animate-spin">
                  ⏳
                </div>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
              <span>💡</span>
              <span>VD: "iPhone", "PRD-001", "điện thoại cao cấp"</span>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5 ${
              showFilters
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white border-2 border-purple-300 text-purple-600 hover:border-purple-500"
            }`}
          >
            🎯 Bộ lọc {showFilters ? "▲" : "▼"}
          </button>
          {canEdit && (
            <button
              onClick={handleCreate}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
            >
              ➕ Thêm mới
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* SKU Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  🏷️ Mã SKU
                </label>
                <input
                  type="text"
                  value={skuSearch}
                  onChange={(e) => {
                    setSkuSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="VD: PRD-001"
                  className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-white font-mono"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  📂 Danh mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-white"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  🔄 Trạng thái
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="active">✅ Hoạt động</option>
                  <option value="inactive">⏸️ Tạm dừng</option>
                </select>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  📦 Tồn kho
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => {
                    setStockFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="in_stock">✅ Còn hàng</option>
                  <option value="low_stock">⚠️ Sắp hết (≤10)</option>
                  <option value="out_of_stock">❌ Hết hàng</option>
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  💰 Giá tối thiểu
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="0 đ"
                  className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-white"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  💰 Giá tối đa
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="∞ đ"
                  className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-white"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {q && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                    🔍 "{q.length > 20 ? q.substring(0, 20) + "..." : q}"
                  </span>
                )}
                {skuSearch && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold font-mono">
                    🏷️ SKU: {skuSearch}
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    📂{" "}
                    {categories.find(
                      (c) => c.id.toString() === selectedCategory
                    )?.name || "Danh mục"}
                  </span>
                )}
                {selectedStatus && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    {selectedStatus === "active"
                      ? "✅ Hoạt động"
                      : "⏸️ Tạm dừng"}
                  </span>
                )}
                {stockFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    📦{" "}
                    {stockFilter === "in_stock"
                      ? "Còn hàng"
                      : stockFilter === "low_stock"
                        ? "Sắp hết"
                        : "Hết hàng"}
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold">
                    💰 {minPrice && `${parseInt(minPrice).toLocaleString()}đ`}
                    {minPrice && maxPrice && " - "}
                    {maxPrice && `${parseInt(maxPrice).toLocaleString()}đ`}
                  </span>
                )}
                {(q ||
                  skuSearch ||
                  selectedCategory ||
                  selectedStatus ||
                  minPrice ||
                  maxPrice ||
                  stockFilter) && (
                  <span className="text-sm font-semibold">
                    → <span className="text-purple-600">{total}</span> kết quả
                  </span>
                )}
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-lg bg-white border-2 border-red-300 text-red-600 text-sm font-bold hover:bg-red-50 hover:border-red-500 transition-all whitespace-nowrap"
              >
                🔄 Xóa bộ lọc
              </button>
            </div>
          </div>
        )}

        {/* Results count (when filters hidden) */}
        {!showFilters &&
          (q ||
            skuSearch ||
            selectedCategory ||
            selectedStatus ||
            minPrice ||
            maxPrice ||
            stockFilter) &&
          total > 0 && (
            <div className="text-sm text-slate-600 font-semibold">
              📊 Tìm thấy <span className="text-purple-600">{total}</span> sản
              phẩm
            </div>
          )}
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
                      Ảnh
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
                      Tồn kho
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-slate-700 uppercase tracking-wider">
                      Danh mục
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
                      <td className="py-4 px-6">
                        {p.main_image ? (
                          <img
                            src={p.main_image}
                            alt={p.name}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-slate-200"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900 max-w-xs">
                        <div className="line-clamp-2">{p.name}</div>
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
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            (p.stock_quantity || 0) > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.stock_quantity || 0}
                        </span>
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
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            p.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {p.is_active ? "✅ Hoạt động" : "⏸️ Tạm dừng"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => handleEdit(p)}
                                className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition shadow-sm hover:shadow-md"
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition shadow-sm hover:shadow-md"
                              >
                                🗑️ Xóa
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Chỉ xem
                            </span>
                          )}
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
                    {start + 1}-{Math.min(start + pageSize, total)}
                  </span>{" "}
                  / <span className="font-bold">{total}</span> sản phẩm
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        currentPage === 1
                          ? "opacity-40 cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-white border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-400 shadow-sm hover:shadow-md"
                      }`}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Trước
                    </button>
                    <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-md">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        currentPage === totalPages
                          ? "opacity-40 cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-white border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-400 shadow-sm hover:shadow-md"
                      }`}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <ProductModal
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Create Modal */}
      {creating && (
        <ProductModal
          categories={categories}
          onClose={() => setCreating(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// Modal Component
function ProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product?: Product;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [description, setDescription] = useState(product?.description || "");
  const [stockQuantity, setStockQuantity] = useState(
    product?.stock_quantity?.toString() || ""
  );
  const [categoryId, setCategoryId] = useState(product?.category_id || 0);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [mainImage, setMainImage] = useState(product?.main_image || "");
  const [images, setImages] = useState<string[]>(() => {
    // Convert images từ backend format sang array URLs
    if (!product?.images || product.images.length === 0) {
      return product?.main_image ? [product.main_image] : [];
    }
    // Kiểm tra nếu là array objects (ProductImageRead[])
    if (
      typeof product.images[0] === "object" &&
      "file_path" in product.images[0]
    ) {
      return product.images.map((img: any) => img.file_path);
    }
    // Nếu đã là array strings
    return product.images as string[];
  });
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [specifications, setSpecifications] = useState(
    JSON.stringify(product?.specifications || {}, null, 2)
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state khi product thay đổi (mở modal sửa sản phẩm khác)
  useEffect(() => {
    setName(product?.name || "");
    setSku(product?.sku || "");
    setPrice(product?.price?.toString() || "");
    setDescription(product?.description || "");
    setStockQuantity(product?.stock_quantity?.toString() || "");
    setCategoryId(product?.category_id || 0);
    setIsActive(product?.is_active ?? true);
    setMainImage(product?.main_image || "");

    // Convert images từ backend format
    if (!product?.images || product.images.length === 0) {
      setImages(product?.main_image ? [product.main_image] : []);
    } else if (
      typeof product.images[0] === "object" &&
      "file_path" in product.images[0]
    ) {
      // Backend trả về ProductImageRead[]
      setImages(product.images.map((img: any) => img.file_path));
    } else {
      // Đã là string[]
      setImages(product.images as string[]);
    }

    setSpecifications(JSON.stringify(product?.specifications || {}, null, 2));
    setError(null);
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file types and sizes
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        setError(
          `❌ File "${file.name}" không hợp lệ! Chỉ chấp nhận JPG, PNG, GIF, WEBP`
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`❌ File "${file.name}" quá lớn! Tối đa 5MB`);
        return;
      }
    }

    setUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];

    try {
      // Upload từng file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post("/products/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = (res as any).data ?? (res as any);
        const imageUrl = `http://localhost:8000${data.url}`;
        uploadedUrls.push(imageUrl);
      }

      // Thêm ảnh mới vào danh sách
      setImages([...images, ...uploadedUrls]);

      // Nếu chưa có main_image thì set ảnh đầu tiên làm main
      if (!mainImage && uploadedUrls.length > 0) {
        setMainImage(uploadedUrls[0]);
      }
    } catch (err: any) {
      setError(err?.message || "❌ Upload ảnh thất bại!");
    } finally {
      setUploading(false);
      // Reset input để có thể chọn lại cùng file
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    // Nếu xóa ảnh main, chọn ảnh đầu tiên làm main
    if (mainImage === images[index]) {
      setMainImage(newImages[0] || "");
    }
  };

  const handleSetMainImage = (imageUrl: string) => {
    setMainImage(imageUrl);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("❌ Tên sản phẩm không được để trống!");
      return;
    }
    if (!sku.trim()) {
      setError("❌ Mã SKU không được để trống!");
      return;
    }
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0 || !Number.isInteger(priceNum)) {
      setError("❌ Giá phải là số nguyên hợp lệ và lớn hơn 0!");
      return;
    }

    // Validate specifications JSON
    let specsObj = {};
    if (specifications.trim()) {
      try {
        specsObj = JSON.parse(specifications);
      } catch {
        setError("❌ Thông số kỹ thuật phải là JSON hợp lệ!");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        price: Number(price),
        description: description.trim() || undefined,
        stock_quantity: Number(stockQuantity) || 0,
        category_id: categoryId || undefined,
        is_active: isActive,
        main_image: mainImage.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        specifications: Object.keys(specsObj).length > 0 ? specsObj : undefined,
      };

      if (product) {
        // Update
        await api.put(`/products/${product.id}`, payload);
      } else {
        // Create
        await api.post("/products", payload);
      }

      onSaved();
    } catch (err: any) {
      setError(err?.message || "❌ Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-[800px] max-w-[95vw] bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-purple-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-500 to-pink-500 border-b border-purple-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg">
              {product ? "✏️" : "➕"}
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white">
                {product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              {product && (
                <p className="text-sm text-purple-100 mt-1">ID: {product.id}</p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all font-mono"
                placeholder="Mã SKU (bắt buộc)"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Giá (₫) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Số lượng tồn kho
              </label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Danh mục
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
              >
                <option value={0}>-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-purple-500 focus:ring-2 focus:ring-purple-400"
                />
                <span className="text-sm font-bold text-slate-700">
                  Kích hoạt sản phẩm
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
              <span className="text-lg">🖼️</span>
              <span>Ảnh sản phẩm</span>
              {images.length > 0 && (
                <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                  {images.length} ảnh
                </span>
              )}
            </label>

            {/* Gallery hiển thị tối đa 4 ảnh hoặc empty state */}
            {images.length > 0 ? (
              <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl p-4 border-2 border-purple-100">
                <div className="grid grid-cols-4 gap-4">
                  {images.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-2xl overflow-hidden border-3 border-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      <img
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/300x300?text=Error";
                        }}
                      />

                      {/* Badge ảnh chính */}
                      {mainImage === img && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                          <span className="flex items-center gap-1">
                            <span>⭐</span>
                            <span>CHÍNH</span>
                          </span>
                        </div>
                      )}

                      {/* Number badge */}
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                        {idx + 1}
                      </div>

                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2">
                          {mainImage !== img && (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(img)}
                              className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold hover:from-amber-500 hover:to-orange-600 transition-all shadow-md transform hover:scale-105"
                              title="Đặt làm ảnh chính"
                            >
                              ⭐ Đặt làm chính
                            </button>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedImageIndex(idx)}
                              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md"
                              title="Xem phóng to"
                            >
                              🔍
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold hover:from-red-600 hover:to-rose-600 transition-all shadow-md"
                              title="Xóa ảnh"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Ô thứ 4: Hiển thị ảnh hoặc số lượng còn lại */}
                  {images.length > 4 ? (
                    <button
                      type="button"
                      onClick={() => setShowGalleryModal(true)}
                      className="relative aspect-square rounded-2xl overflow-hidden border-3 border-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group"
                    >
                      <img
                        src={images[4]}
                        alt="More images"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/300x300?text=More";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-pink-600/90 to-rose-600/90 backdrop-blur-sm flex flex-col items-center justify-center group-hover:from-purple-700/95 group-hover:via-pink-700/95 group-hover:to-rose-700/95 transition-all duration-300">
                        <div className="text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">
                          +{images.length - 4}
                        </div>
                        <div className="text-sm font-bold text-white/90 bg-white/20 px-4 py-1.5 rounded-full">
                          👁️ Xem tất cả
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("image-upload-input")?.click()
                      }
                      className="aspect-square rounded-2xl border-3 border-dashed border-purple-300 hover:border-purple-500 transition-all duration-300 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white to-purple-50 hover:from-purple-50 hover:to-pink-50 text-purple-400 hover:text-purple-600 group shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-all">
                        <span className="text-2xl group-hover:scale-125 transition-transform">
                          ➕
                        </span>
                      </div>
                      <div className="text-xs font-bold">Thêm ảnh</div>
                    </button>
                  )}
                </div>

                {/* Hidden input for adding more images */}
                <input
                  id="image-upload-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  multiple
                  className="hidden"
                />
              </div>
            ) : (
              /* Empty state */
              <button
                type="button"
                onClick={() =>
                  document.getElementById("image-upload-input")?.click()
                }
                disabled={uploading}
                className="w-full border-3 border-dashed border-purple-200 rounded-2xl p-12 text-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 hover:border-purple-400 transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <span className="text-5xl">{uploading ? "⏳" : "🖼️"}</span>
                </div>
                <div className="text-slate-600 font-bold mb-2 text-lg">
                  {uploading ? "Đang tải ảnh lên..." : "Chưa có ảnh nào"}
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  {uploading
                    ? "Vui lòng đợi..."
                    : "Nhấn vào đây để chọn ảnh từ máy"}
                </div>
                <div className="inline-flex items-center gap-2 text-xs text-purple-600 bg-purple-100 px-4 py-2 rounded-full font-semibold">
                  <span>💡</span>
                  <span>
                    JPG, PNG, GIF, WEBP • Tối đa 5MB/ảnh • Chọn nhiều ảnh cùng
                    lúc
                  </span>
                </div>

                {/* Hidden input */}
                <input
                  id="image-upload-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  multiple
                  className="hidden"
                />
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all resize-none"
              rows={3}
              placeholder="Mô tả chi tiết sản phẩm..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Thông số kỹ thuật (JSON)
            </label>
            <textarea
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all resize-none font-mono text-xs"
              rows={6}
              placeholder='{"material": "Wood", "dimensions": "200x100x80 cm", "weight": "50 kg"}'
            />
            <p className="text-xs text-slate-500 mt-1">
              💡 Nhập định dạng JSON. VD:{" "}
              {`{"color": "Brown", "size": "Large"}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t-2 border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-700 hover:bg-white transition-all shadow-sm"
          >
            ✖️ Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${
              saving
                ? "opacity-60 cursor-not-allowed bg-purple-400 text-white"
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-xl"
            }`}
          >
            {saving ? "⏳ Đang lưu..." : "💾 Lưu"}
          </button>
        </div>
      </div>

      {/* Gallery Modal - Hiển thị tất cả ảnh */}
      {showGalleryModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowGalleryModal(false)}
        >
          <div
            className="w-[90vw] max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-purple-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 flex items-center justify-between border-b-4 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
                  🖼️
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">
                    Thư viện ảnh
                  </h3>
                  <p className="text-sm text-purple-100 font-medium">
                    {images.length} ảnh • Click để xem chi tiết
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-all transform hover:scale-110 hover:rotate-90 duration-300"
              >
                ✕
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-purple-50">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-2xl overflow-hidden border-3 border-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <img
                      src={img}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-transform duration-500"
                      onClick={() => setSelectedImageIndex(idx)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/300x300?text=Error";
                      }}
                    />

                    {/* Badge ảnh chính */}
                    {mainImage === img && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg z-10 animate-pulse">
                        ⭐ CHÍNH
                      </div>
                    )}

                    {/* Index badge */}
                    <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                      {idx + 1}
                    </div>

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2">
                        {mainImage !== img && (
                          <button
                            type="button"
                            onClick={() => {
                              handleSetMainImage(img);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg transform hover:scale-105"
                          >
                            ⭐ Đặt làm ảnh chính
                          </button>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedImageIndex(idx)}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
                          >
                            🔍 Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleRemoveImage(idx);
                              if (images.length === 1) {
                                setShowGalleryModal(false);
                              }
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold hover:from-red-600 hover:to-rose-600 transition-all shadow-lg"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add more button */}
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("image-upload-input")?.click();
                  }}
                  className="aspect-square rounded-2xl border-3 border-dashed border-purple-300 hover:border-purple-500 transition-all duration-300 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white to-purple-50 hover:from-purple-50 hover:to-pink-50 text-purple-400 hover:text-purple-600 group shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200 flex items-center justify-center transition-all">
                    <span className="text-3xl group-hover:scale-125 transition-transform">
                      ➕
                    </span>
                  </div>
                  <div className="text-sm font-bold">Thêm ảnh mới</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal - Xem ảnh phóng to */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-2xl backdrop-blur-sm transition-all transform hover:scale-110 hover:rotate-90 duration-300 shadow-xl z-20"
            >
              ✕
            </button>

            {/* Previous button */}
            {selectedImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(selectedImageIndex - 1);
                }}
                className="absolute left-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/40 hover:to-pink-500/40 text-white font-bold text-3xl backdrop-blur-sm transition-all transform hover:scale-110 shadow-xl"
              >
                ‹
              </button>
            )}

            {/* Next button */}
            {selectedImageIndex < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(selectedImageIndex + 1);
                }}
                className="absolute right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/40 hover:to-pink-500/40 text-white font-bold text-3xl backdrop-blur-sm transition-all transform hover:scale-110 shadow-xl"
              >
                ›
              </button>
            )}

            {/* Image */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <img
                src={images[selectedImageIndex]}
                alt={`Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/800?text=Error+Loading+Image";
                }}
              />

              {/* Image info */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-rose-600/90 text-white px-6 py-3 rounded-full backdrop-blur-md border-2 border-white/20 shadow-xl">
                <div className="flex items-center gap-4 text-sm font-bold">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">📸</span>
                    <span>
                      {selectedImageIndex + 1} / {images.length}
                    </span>
                  </span>
                  {mainImage === images[selectedImageIndex] && (
                    <span className="flex items-center gap-1 text-amber-300 bg-white/20 px-3 py-1 rounded-full">
                      <span>⭐</span>
                      <span>Ảnh chính</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="absolute top-6 left-6 flex gap-3">
                {mainImage !== images[selectedImageIndex] && (
                  <button
                    onClick={() =>
                      handleSetMainImage(images[selectedImageIndex])
                    }
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-sm font-bold transition-all shadow-xl transform hover:scale-105"
                  >
                    ⭐ Đặt làm ảnh chính
                  </button>
                )}
                <button
                  onClick={() => {
                    const newIndex = selectedImageIndex;
                    handleRemoveImage(selectedImageIndex);
                    if (images.length === 1) {
                      setSelectedImageIndex(null);
                    } else if (newIndex >= images.length - 1) {
                      setSelectedImageIndex(Math.max(0, newIndex - 1));
                    }
                  }}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm font-bold transition-all shadow-xl transform hover:scale-105"
                >
                  🗑️ Xóa ảnh này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
