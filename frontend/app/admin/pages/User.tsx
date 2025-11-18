// frontend/app/admin/pages/User.tsx
import * as React from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

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
  const isAdmin = auth.hasRole?.("admin");

  const theme = isAdmin
    ? {
        head: "bg-violet-50",
        chipActive: "bg-emerald-100 text-emerald-700",
        focus: "focus:ring-violet-300",
        btn: "bg-violet-600 hover:bg-violet-700 text-white",
        btnSubtle:
          "border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300",
        accentText: "text-violet-700",
        stickyShadow:
          "shadow-[inset_1px_0_0_0_rgba(226,232,240,1)]", // viền trái cột sticky
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
        stickyShadow:
          "shadow-[inset_1px_0_0_0_rgba(226,232,240,1)]",
        checkbox: "accent-indigo-600",
      };

  const canEdit = !!isAdmin; // chỉ admin được sửa

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rawUsers, setRawUsers] = React.useState<UserRead[]>([]);

  const [q, setQ] = React.useState("");
  const [roleFilter, setRoleFilter] =
    React.useState<"all" | "admin" | "manager" | "customer">("all");
  const [sortKey, setSortKey] =
    React.useState<"id" | "email" | "full_name" | "status">("id");
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
        const list: UserRead[] = Array.isArray(data) ? data : data?.items ?? [];
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
      <header>
        <h1 className="text-3xl font-extrabold text-white">Quản lý người dùng</h1>
        <p className="text-slate-300 text-sm mt-1">
          Tìm kiếm, lọc, sắp xếp & chỉnh sửa thông tin người dùng.
        </p>
      </header>

      <section className="bg-white rounded-xl shadow-lg border border-slate-200">
        {/* Toolbar */}
        <div className="grid gap-3 p-4 border-b md:grid-cols-3">
          <div className="md:col-span-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo ID / email / họ tên / SĐT / vai trò…"
              className={cn(
                "w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-2",
                theme.focus
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
              title="Lọc vai trò"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="customer">customer</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-2 py-2 bg-white text-slate-900"
              title="Số dòng / trang"
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}/trang
                </option>
              ))}
            </select>
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
                      "text-slate-800 uppercase text-xs tracking-wider",
                      theme.head
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
                          "py-3 px-4 text-left sticky right-0 z-20 bg-white",
                          theme.stickyShadow
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
                    return (
                      <tr
                        key={u.id}
                        className={cn(
                          "border-t hover:bg-slate-100 transition",
                          rowBg
                        )}
                      >
                        <Td className="font-semibold text-slate-900">{u.id}</Td>
                        <Td className="text-slate-900">{u.email}</Td>
                        <Td className="text-slate-900">
                          {u.full_name || "—"}
                        </Td>
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
                              "py-3 px-4 align-middle sticky right-0 z-10 bg-white",
                              theme.stickyShadow
                            )}
                          >
                            <button
                              onClick={() => setEditing(u)}
                              className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-semibold border transition",
                                theme.btnSubtle
                              )}
                              title="Sửa người dùng"
                              aria-label={`Sửa người dùng ${u.email}`}
                            >
                              Sửa
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-white rounded-b-xl">
              <div className="text-xs text-slate-600">
                Hiển thị{" "}
                <b>
                  {start + 1}-{Math.min(start + pageSize, total)}
                </b>{" "}
                / {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={cn(
                    "px-3 py-1.5 rounded-md border text-sm",
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-slate-50"
                  )}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </button>
                <span className={cn("text-sm font-medium", theme.accentText)}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  className={cn(
                    "px-3 py-1.5 rounded-md border text-sm",
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-slate-50"
                  )}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </button>
              </div>
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
        onClick ? (active ? (asc ? "Tăng dần" : "Giảm dần") : "Sắp xếp") : undefined
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
  return <td className={cn("py-3 px-4 align-middle", className)}>{children}</td>;
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
    if (!validate()) return;
    setSaving(true);
    setOkMsg(null);
    try {
      // 1) cập nhật thông tin cơ bản (có thể đổi email)
      const res = await api.put<UserRead>(`/users/${user.id}`, {
        email,
        full_name: fullName || null,
        phone_number: phone || null,
        is_active: active,
      });
      let updated = ((res as any).data ?? (res as any)) as UserRead;

      // 2) nếu có mật khẩu mới -> gọi endpoint đổi mật khẩu
      if (newPassword) {
        try {
          await api.put(`/users/${user.id}/password`, { password: newPassword });
        } catch {
          // fallback nếu API này không tồn tại: thử gửi chung
          await api.put(`/users/${user.id}`, { password: newPassword });
        }
        setOkMsg("Đã đổi mật khẩu.");
      }

      onSaved(updated);
    } catch (e: any) {
      setError(e?.message || "Lưu thất bại.");
      return;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-[760px] max-w-[95vw] bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
          <div className="text-lg font-semibold">Chỉnh sửa người dùng</div>
          <div className="text-sm text-slate-500">ID: {user.id}</div>
        </div>

        <div className="p-6 space-y-6">
          {/* Thông tin cơ bản */}
          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2",
                  theme.focus
                )}
                placeholder="user@example.com"
                inputMode="email"
                autoFocus
              />
            </Field>
            <Field label="Họ tên">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2",
                  theme.focus
                )}
                placeholder="Họ tên"
              />
            </Field>
            <Field label="Điện thoại">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2",
                  theme.focus
                )}
                placeholder="0123456789"
                inputMode="tel"
              />
            </Field>
            <div className="flex items-center gap-3">
              <input
                id="active"
                type="checkbox"
                className={cn(theme.checkbox)}
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label htmlFor="active" className="text-sm">
                Hoạt động
              </label>
            </div>
          </section>

          {/* Đổi mật khẩu (tùy chọn) */}
          <section className="space-y-3">
            <div className="text-sm font-medium">Đổi mật khẩu (tuỳ chọn)</div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Mật khẩu mới">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2",
                    theme.focus
                  )}
                  placeholder="Tối thiểu 8 ký tự"
                />
              </Field>
              <Field label="Xác nhận mật khẩu">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2",
                    theme.focus
                  )}
                  placeholder="Nhập lại mật khẩu"
                />
              </Field>
            </div>
            <div className="text-xs text-slate-500">
              * Để trống nếu bạn không muốn đổi mật khẩu.
            </div>
          </section>

          {!!error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          {!!okMsg && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
              {okMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 rounded-lg border font-medium transition bg-white",
              theme.btnSubtle
            )}
          >
            Hủy
          </button>
          <button
            onClick={save}
            disabled={saving}
            className={cn(
              "px-4 py-2 rounded-lg font-semibold transition",
              saving ? "opacity-60 cursor-not-allowed" : theme.btn
            )}
          >
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-600">{label}</label>
      {children}
    </div>
  );
}
