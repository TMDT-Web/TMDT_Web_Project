// frontend/app/admin/pages/User.tsx
import * as React from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

type RoleRead = { id: number; name: string };
type UserRead = {
  id: number;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  is_active?: boolean;
  roles?: RoleRead[];
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function roleBadgeClass(name?: string) {
  const key = (name || "").toLowerCase();
  if (key === "admin") return "bg-violet-100 text-violet-700";
  if (key === "manager") return "bg-amber-100 text-amber-700";
  return "bg-indigo-100 text-indigo-700";
}

export default function UserPage() {
  const auth = useAuth();
  const isAdmin = auth.hasRole?.("admin", "root"); // root + admin có quyền
  const isRootUser = auth.isRoot; // kiểm tra user GỐC có phải root không

  const theme = isAdmin
    ? {
        head: "bg-violet-50",
        chipActive: "bg-emerald-100 text-emerald-700",
        focus: "focus:ring-violet-300",
        btn: "bg-violet-600 hover:bg-violet-700 text-white",
        btnSubtle:
          "border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300",
        accentText: "text-violet-700",
        stickyShadow: "shadow-[inset_1px_0_0_0_rgba(226,232,240,1)]", // viền trái cột sticky
        checkbox: "accent-violet-600",
      }
    : {
        head: "bg-indigo-50",
        chipActive: "bg-emerald-100 text-emerald-700",
        focus: "focus:ring-indigo-300",
        btn: "bg-indigo-600 hover:bg-indigo-700 text-white",
        btnSubtle:
          "border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300",
        accentText: "text-indigo-700",
        stickyShadow: "shadow-[inset_1px_0_0_0_rgba(226,232,240,1)]",
        checkbox: "accent-indigo-600",
      };

  const canEdit = !!isAdmin; // root + admin được sửa

  // Helper: kiểm tra user có role root không
  const isUserRoot = React.useCallback((user: UserRead) => {
    return (user.roles ?? []).some(
      (r) => (r.name || "").toLowerCase() === "root"
    );
  }, []);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rawUsers, setRawUsers] = React.useState<UserRead[]>([]);

  const [q, setQ] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<
    "all" | "admin" | "manager" | "customer"
  >("all");
  const [sortKey, setSortKey] = React.useState<
    "id" | "email" | "full_name" | "status"
  >("id");
  const [sortAsc, setSortAsc] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [editing, setEditing] = React.useState<UserRead | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<UserRead[] | { items: UserRead[] }>("/users");
        const data = (res as any).data ?? (res as any);
        const list: UserRead[] = Array.isArray(data)
          ? data
          : (data?.items ?? []);
        if (!cancelled) setRawUsers(list);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "Không tải được danh sách người dùng.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const key = q.trim().toLowerCase();
    const passRole = (u: UserRead) => {
      if (roleFilter === "all") return true;
      const names = (u.roles ?? []).map((r) => (r.name || "").toLowerCase());
      return names.includes(roleFilter);
    };

    let arr = rawUsers.filter(passRole);
    if (key) {
      arr = arr.filter((u) => {
        const roles = (u.roles ?? [])
          .map((r) => r.name)
          .join(" ")
          .toLowerCase();
        return (
          String(u.id).includes(key) ||
          (u.email || "").toLowerCase().includes(key) ||
          (u.full_name || "").toLowerCase().includes(key) ||
          (u.phone_number || "").toLowerCase().includes(key) ||
          roles.includes(key)
        );
      });
    }

    const sorted = [...arr].sort((a, b) => {
      if (sortKey === "id") return (a.id ?? 0) - (b.id ?? 0);
      if (sortKey === "email")
        return (a.email || "").localeCompare(b.email || "");
      if (sortKey === "full_name")
        return (a.full_name || "").localeCompare(b.full_name || "");
      if (sortKey === "status") {
        const av = a.is_active ? 1 : 0;
        const bv = b.is_active ? 1 : 0;
        return av - bv;
      }
      return 0;
    });

    return sortAsc ? sorted : sorted.reverse();
  }, [rawUsers, q, roleFilter, sortKey, sortAsc]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  React.useEffect(() => setPage(1), [q, roleFilter, pageSize]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc((s) => !s);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleSaved = (u: UserRead) => {
    setRawUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      {/* Modern gradient header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
            👥
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Quản lý người dùng
          </h1>
        </div>
        <p className="text-blue-100 text-sm ml-15">
          Tìm kiếm, lọc, sắp xếp & chỉnh sửa thông tin người dùng một cách dễ
          dàng
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-blue-100">Tổng số: </span>
            <span className="font-bold text-white">
              {rawUsers.length} người dùng
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-blue-100">Đang hiển thị: </span>
            <span className="font-bold text-white">
              {filtered.length} kết quả
            </span>
          </div>
        </div>
      </header>

      <section className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Modern Toolbar with gradient accents */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-blue-100">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  🔍
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo ID / email / họ tên / SĐT / vai trò…"
                  className={cn(
                    "w-full rounded-xl border-2 border-slate-200 pl-10 pr-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-2 focus:border-blue-400 transition-all shadow-sm",
                    theme.focus
                  )}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 bg-white text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                title="Lọc vai trò"
              >
                <option value="all">📋 Tất cả vai trò</option>
                <option value="admin">👑 Admin</option>
                <option value="manager">🏢 Manager</option>
                <option value="customer">👤 Customer</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-xl border-2 border-slate-200 px-3 py-3 bg-white text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                title="Số dòng / trang"
              >
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 animate-pulse space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-10 rounded bg-slate-100 border border-slate-200"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : total === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Không có người dùng nào.
          </div>
        ) : (
          <>
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-20">
                  <tr
                    className={cn(
                      "text-slate-700 uppercase text-xs tracking-wider font-bold bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200"
                    )}
                  >
                    <Th
                      onClick={() => toggleSort("id")}
                      active={sortKey === "id"}
                      asc={sortAsc}
                    >
                      ID
                    </Th>
                    <Th
                      onClick={() => toggleSort("email")}
                      active={sortKey === "email"}
                      asc={sortAsc}
                    >
                      Email
                    </Th>
                    <Th
                      onClick={() => toggleSort("full_name")}
                      active={sortKey === "full_name"}
                      asc={sortAsc}
                    >
                      Họ tên
                    </Th>
                    <Th>Điện thoại</Th>
                    <Th
                      onClick={() => toggleSort("status")}
                      active={sortKey === "status"}
                      asc={sortAsc}
                    >
                      Trạng thái
                    </Th>
                    <Th>Vai trò</Th>
                    {canEdit && (
                      <th
                        className={cn(
                          "py-3 px-4 text-left sticky right-0 z-20 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-2 border-blue-200"
                        )}
                      >
                        Thao tác
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u, i) => {
                    const rowBg = i % 2 === 0 ? "bg-white" : "bg-slate-50";
                    const userIsRoot = isUserRoot(u);
                    const canEditThisUser =
                      canEdit && (!userIsRoot || isRootUser);

                    return (
                      <tr
                        key={u.id}
                        className={cn(
                          "border-t border-slate-100 transition-all duration-200",
                          userIsRoot
                            ? "bg-purple-50/30 hover:bg-purple-100/50"
                            : "hover:bg-blue-50/50",
                          rowBg
                        )}
                      >
                        <Td className="font-semibold text-slate-900">
                          {u.id}
                          {userIsRoot && (
                            <span
                              className="ml-2 text-purple-600"
                              title="Root User"
                            >
                              🔱
                            </span>
                          )}
                        </Td>
                        <Td className="text-slate-900">{u.email}</Td>
                        <Td className="text-slate-900">{u.full_name || "—"}</Td>
                        <Td className="text-slate-900">
                          {u.phone_number || "—"}
                        </Td>
                        <Td>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                              u.is_active
                                ? theme.chipActive
                                : "bg-slate-200 text-slate-700"
                            )}
                          >
                            {u.is_active ? "Hoạt động" : "Ngừng"}
                          </span>
                        </Td>
                        <Td>
                          {(u.roles ?? []).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {(u.roles ?? []).map((r) => (
                                <span
                                  key={r.id}
                                  className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium",
                                    roleBadgeClass(r.name)
                                  )}
                                  title={r.name}
                                >
                                  {r.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </Td>

                        {canEdit && (
                          <td
                            className={cn(
                              "py-3 px-4 align-middle sticky right-0 z-10 border-l border-slate-100",
                              rowBg
                            )}
                          >
                            {canEditThisUser ? (
                              <button
                                onClick={() => setEditing(u)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                title="Sửa người dùng"
                                aria-label={`Sửa người dùng ${u.email}`}
                              >
                                ✏️ Sửa
                              </button>
                            ) : (
                              <div
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-300 text-slate-600 cursor-not-allowed flex items-center gap-2"
                                title="🔒 Chỉ Root mới có thể sửa user Root khác"
                              >
                                <span>🔒</span>
                                <span>Bảo vệ</span>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modern Footer / Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-blue-100 bg-gradient-to-r from-slate-50 to-blue-50 rounded-b-2xl">
              <div className="text-sm text-slate-700 font-medium">
                Hiển thị{" "}
                <span className="text-blue-600 font-bold">
                  {start + 1}-{Math.min(start + pageSize, total)}
                </span>{" "}
                / <span className="font-bold">{total}</span> người dùng
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      currentPage === 1
                        ? "opacity-40 cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 shadow-sm hover:shadow-md"
                    )}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Trước
                  </button>
                  <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm shadow-md">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      currentPage === totalPages
                        ? "opacity-40 cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 shadow-sm hover:shadow-md"
                    )}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {editing && (
        <EditUserModal
          user={editing}
          isAdmin={isAdmin}
          theme={theme}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  asc,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  asc?: boolean;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "py-3 px-4 text-left sticky top-0 select-none",
        onClick && "cursor-pointer"
      )}
      title={
        onClick
          ? active
            ? asc
              ? "Tăng dần"
              : "Giảm dần"
            : "Sắp xếp"
          : undefined
      }
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? <span>{asc ? "↑" : "↓"}</span> : null}
      </span>
    </th>
  );
}
function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("py-3 px-4 align-middle", className)}>{children}</td>
  );
}

/* --------------------------- Edit Modal (no role editing) --------------------------- */

function EditUserModal({
  user,
  isAdmin,
  theme,
  onClose,
  onSaved,
}: {
  user: UserRead;
  isAdmin: boolean;
  theme: {
    btn: string;
    focus: string;
    btnSubtle: string;
    checkbox?: string;
  };
  onClose: () => void;
  onSaved: (u: UserRead) => void;
}) {
  const auth = useAuth();
  const isRootUser = auth.isRoot;

  // Kiểm tra user đang edit có role root không
  const userIsRoot = React.useMemo(
    () =>
      (user.roles ?? []).some((r) => (r.name || "").toLowerCase() === "root"),
    [user.roles]
  );

  const [email, setEmail] = React.useState(user.email);
  const [fullName, setFullName] = React.useState(user.full_name ?? "");
  const [phone, setPhone] = React.useState(user.phone_number ?? "");
  const [active, setActive] = React.useState(!!user.is_active);

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  const validate = () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Email không hợp lệ.");
      return false;
    }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 8) {
        setError("Mật khẩu phải từ 8 ký tự.");
        return false;
      }
      if (newPassword !== confirmPassword) {
        setError("Xác nhận mật khẩu không khớp.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const save = async () => {
    // BẢO VỆ ROOT: Chỉ root user mới có thể sửa user root
    if (userIsRoot && !isRootUser) {
      setError("❌ Chỉ Root mới có thể sửa thông tin user Root khác!");
      return;
    }

    if (!validate()) return;
    setSaving(true);
    setOkMsg(null);
    try {
      // 1) cập nhật thông tin cơ bản (có thể đổi email)
      await api.put(`/users/${user.id}`, {
        email,
        full_name: fullName || null,
        phone_number: phone || null,
        is_active: active,
      });

      // 2) nếu có mật khẩu mới -> gọi endpoint đổi mật khẩu
      if (newPassword) {
        try {
          await api.put(`/users/${user.id}/password`, {
            password: newPassword,
          });
        } catch {
          // fallback nếu API này không tồn tại: thử gửi chung
          await api.put(`/users/${user.id}`, { password: newPassword });
        }
        setOkMsg("Đã đổi mật khẩu.");
      }

      // 3) Refetch user để đảm bảo có roles đầy đủ
      const refetchRes = await api.get<UserRead>(`/users/${user.id}`);
      const updated = ((refetchRes as any).data ??
        (refetchRes as any)) as UserRead;

      onSaved(updated);
    } catch (e: any) {
      setError(e?.message || "Lưu thất bại.");
      return;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-[760px] max-w-[95vw] bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-200 animate-[fadeIn_0.2s_ease-out]">
        {/* Modern Header with gradient */}
        <div className="px-6 py-5 border-b border-blue-100 bg-gradient-to-r from-blue-500 to-indigo-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg">
              {userIsRoot ? "🔱" : "✏️"}
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Chỉnh sửa người dùng</span>
                {userIsRoot && (
                  <span className="text-sm px-3 py-1 bg-purple-500/40 rounded-lg border border-purple-300">
                    ROOT USER
                  </span>
                )}
              </div>
              <div className="text-sm text-blue-100 font-medium mt-1">
                ID: <span className="font-mono">{user.id}</span> • {user.email}
              </div>
            </div>
          </div>
        </div>

        {/* Cảnh báo nếu admin cố sửa root */}
        {userIsRoot && !isRootUser && (
          <div className="mx-6 mt-6 mb-0 bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <div className="font-bold text-red-700 text-sm">
                Không thể chỉnh sửa Root User
              </div>
              <div className="text-red-600 text-xs mt-1">
                Chỉ người dùng có role Root mới có thể sửa đổi thông tin của
                Root User khác.
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Thông tin cơ bản */}
          <section className="grid gap-5 md:grid-cols-2">
            <Field label="📧 Email" required>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                placeholder="user@example.com"
                inputMode="email"
                autoFocus
              />
            </Field>
            <Field label="👤 Họ tên">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                placeholder="Nhập họ và tên đầy đủ"
              />
            </Field>
            <Field label="📱 Điện thoại">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                placeholder="0123456789"
                inputMode="tel"
              />
            </Field>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
              <input
                id="active"
                type="checkbox"
                className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-400 cursor-pointer"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label
                htmlFor="active"
                className="text-sm font-semibold text-slate-700 cursor-pointer select-none"
              >
                ✅ Tài khoản đang hoạt động
              </label>
            </div>
          </section>

          {/* Đổi mật khẩu (tùy chọn) */}
          <section className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <div className="text-base font-bold text-slate-800">
                Đổi mật khẩu
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-semibold">
                Tùy chọn
              </span>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Mật khẩu mới">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border-2 border-amber-200 px-4 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-sm"
                  placeholder="Tối thiểu 8 ký tự"
                />
              </Field>
              <Field label="Xác nhận mật khẩu">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border-2 border-amber-200 px-4 py-3 bg-white text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-sm"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </Field>
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100 px-3 py-2 rounded-lg border border-amber-200">
              <span className="text-sm mt-0.5">💡</span>
              <span className="font-medium">
                Để trống cả hai trường nếu bạn không muốn thay đổi mật khẩu hiện
                tại.
              </span>
            </div>
          </section>

          {!!error && (
            <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border-2 border-red-200 px-4 py-3 rounded-xl shadow-sm">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div className="font-semibold">{error}</div>
            </div>
          )}
          {!!okMsg && (
            <div className="flex items-start gap-3 text-sm text-emerald-700 bg-emerald-50 border-2 border-emerald-200 px-4 py-3 rounded-xl shadow-sm">
              <span className="text-xl flex-shrink-0">✅</span>
              <div className="font-semibold">{okMsg}</div>
            </div>
          )}
        </div>

        {/* Modern Footer */}
        <div className="px-6 py-5 border-t border-blue-100 bg-gradient-to-r from-slate-50 to-blue-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-700 hover:bg-white hover:border-slate-400 transition-all shadow-sm hover:shadow-md"
          >
            ✖️ Hủy
          </button>
          <button
            onClick={save}
            disabled={saving || (userIsRoot && !isRootUser)}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-xl",
              saving || (userIsRoot && !isRootUser)
                ? "opacity-60 cursor-not-allowed bg-blue-400 text-white"
                : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transform hover:-translate-y-0.5"
            )}
            title={
              userIsRoot && !isRootUser
                ? "🔒 Chỉ Root mới có thể sửa Root User"
                : ""
            }
          >
            {saving
              ? "⏳ Đang lưu…"
              : userIsRoot && !isRootUser
                ? "🔒 Bảo vệ"
                : "💾 Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 text-base">*</span>}
      </label>
      {children}
    </div>
  );
}
