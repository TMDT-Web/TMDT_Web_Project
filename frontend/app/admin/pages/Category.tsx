import * as React from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
};

type CategoryFormData = {
  name: string;
  slug: string;
  description: string;
};

export default function CategoryPage() {
  const auth = useAuth();
  const canEdit = auth.hasRole?.("root", "admin", "manager");

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"name" | "date">("name");
  const [showModal, setShowModal] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null
  );
  const [formData, setFormData] = React.useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      console.log("Loading categories from /categories...");
      const res = await api.get("/categories");
      console.log("Full response:", res);
      console.log("Response data:", res.data);

      // Axios response structure: res.data contains the actual data
      const categoryList = Array.isArray(res.data) ? res.data : [];
      console.log("Setting categories:", categoryList);
      setCategories(categoryList);
    } catch (error: any) {
      console.error("Failed to load categories:", error);
      console.error("Error response:", error?.response);
      alert(
        `Không thể tải danh sách danh mục! ${error?.response?.data?.detail || error?.message || "Lỗi không xác định"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = React.useMemo(() => {
    let filtered = categories;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(query) ||
          cat.slug.toLowerCase().includes(query) ||
          cat.description?.toLowerCase().includes(query) ||
          cat.id.toString().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "vi");
      } else {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    });

    return sorted;
  }, [categories, searchQuery, sortBy]);

  // Debug log
  console.log("Current state:", {
    loading,
    categoriesCount: categories.length,
    filteredCount: filteredCategories.length,
    categories,
    filteredCategories,
  });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "" });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "" });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    if (!formData.slug.trim()) {
      alert("Vui lòng nhập slug!");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        // Update category
        await api.put(`/categories/${editingCategory.id}`, formData);
        alert("Cập nhật danh mục thành công!");
      } else {
        // Create category
        await api.post("/categories", formData);
        alert("Thêm danh mục thành công!");
      }
      closeModal();
      loadCategories();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      const errorMsg =
        error?.response?.data?.detail || "Không thể lưu danh mục!";
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${category.id}`);
      alert("Xóa danh mục thành công!");
      loadCategories();
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      const errorMsg =
        error?.response?.data?.detail || "Không thể xóa danh mục!";
      alert(errorMsg);
    }
  };

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
              placeholder="Tìm theo tên, slug, mô tả hoặc ID..."
              className="w-full rounded-xl border-2 border-slate-200 pl-12 pr-12 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Xóa tìm kiếm"
              >
                ❌
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "date")}
              className="px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-medium outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-sm"
            >
              <option value="name">🔤 Sắp xếp: Tên A-Z</option>
              <option value="date">📅 Sắp xếp: Mới nhất</option>
            </select>
            {canEdit && (
              <button
                onClick={openAddModal}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                ➕ Thêm danh mục
              </button>
            )}
            {!canEdit && (
              <div
                className="px-6 py-3 rounded-xl bg-slate-300 text-slate-600 font-bold cursor-not-allowed whitespace-nowrap"
                title="Chỉ root/admin/manager mới có quyền thêm"
              >
                🔒 Chỉ xem
              </div>
            )}
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <p className="text-sm font-semibold text-amber-900">
              🔎 Tìm thấy{" "}
              <span className="text-amber-600">
                {filteredCategories.length}
              </span>{" "}
              kết quả cho "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
        {(() => {
          console.log("Render check:", {
            loading,
            filteredLength: filteredCategories.length,
          });
          if (loading) {
            return (
              <div className="p-12 text-center">
                <div className="animate-spin text-5xl mb-4">⏳</div>
                <div className="text-slate-500 font-medium">
                  Đang tải danh mục...
                </div>
              </div>
            );
          }

          if (filteredCategories.length === 0) {
            return (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <div className="text-slate-500 font-medium">
                  {searchQuery
                    ? `Không tìm thấy danh mục nào khớp với "${searchQuery}"`
                    : "Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!"}
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-6 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition"
                  >
                    ✨ Xóa bộ lọc
                  </button>
                )}
              </div>
            );
          }

          console.log("Rendering categories:", filteredCategories);
          return (
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
                  <p className="text-sm text-slate-600 mb-1 font-mono bg-slate-100 px-2 py-1 rounded">
                    {cat.slug}
                  </p>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2 h-10">
                    {cat.description || "Không có mô tả"}
                  </p>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="flex-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition shadow-sm"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition shadow-sm"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">
                {editingCategory ? "✏️ Sửa danh mục" : "➕ Thêm danh mục mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  placeholder="Ví dụ: Bàn ghế, Sofa, Giường ngủ..."
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all font-mono bg-slate-50"
                  placeholder="ban-ghe"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  URL-friendly identifier (tự động tạo từ tên)
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
                  placeholder="Mô tả về danh mục này..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Đang lưu..."
                    : editingCategory
                      ? "Cập nhật"
                      : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
