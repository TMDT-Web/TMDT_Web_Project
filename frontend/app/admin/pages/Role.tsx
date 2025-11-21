// frontend/app/pages/Role.tsx
import * as React from "react";
import { useAuth } from "~/context/AuthContext";
import { api } from "~/lib/api";

/** ===== Kiểu dữ liệu khớp backend tối thiểu ===== */
type RoleRead = {
  id: number;
  name: string;
  description?: string | null;
  is_system?: boolean;
};

type UserRead = {
  id: number;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  is_active?: boolean;
  roles?: RoleRead[];
};

type PermissionRead = {
  id: number;
  code: string;
  name?: string | null;
  description?: string | null;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function roleChip(name?: string) {
  const k = (name || "").toLowerCase();
  if (k === "admin") return "bg-violet-100 text-violet-700 ring-violet-200";
  if (k === "manager") return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-indigo-100 text-indigo-700 ring-indigo-200";
}

export default function RolePage() {
  const auth = useAuth();
  const isAdmin = auth.hasRole?.("admin", "root"); // root + admin được phân quyền động
  const isRootUser = auth.isRoot; // kiểm tra user GỐC có phải root không

  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [loadingRoles, setLoadingRoles] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [users, setUsers] = React.useState<UserRead[]>([]);
  const [roles, setRoles] = React.useState<RoleRead[]>([]);

  const [qUser, setQUser] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(
    null
  );
  const selectedUser = React.useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  // Tập role_id đang được gán cho user đang chọn
  const [assigned, setAssigned] = React.useState<Set<number>>(
    new Set<number>()
  );

  const [error, setError] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  // Load users
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingUsers(true);
        setError(null);
        const res = await api.get<UserRead[] | { items: UserRead[] }>("/users");
        const data = (res as any).data ?? (res as any);
        const list: UserRead[] = Array.isArray(data)
          ? data
          : (data?.items ?? []);
        if (cancelled) return;
        setUsers(list);
        // auto select user đầu tiên nếu chưa chọn
        if (!selectedUserId && list.length > 0) {
          setSelectedUserId(list[0].id);
          const s = new Set<number>(
            (list[0].roles ?? []).map((r) => Number(r.id))
          );
          setAssigned(s);
        }
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "Không tải được danh sách người dùng.");
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load roles
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingRoles(true);
        setError(null);
        const res = await api.get<RoleRead[] | { items: RoleRead[] }>(
          "/users/roles"
        );
        const data = (res as any).data ?? (res as any);
        const list: RoleRead[] = Array.isArray(data)
          ? data
          : (data?.items ?? []);
        if (cancelled) return;
        setRoles(list);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "Không tải được danh sách vai trò.");
      } finally {
        if (!cancelled) setLoadingRoles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Khi đổi user, sync assigned theo roles của user đó
  React.useEffect(() => {
    if (!selectedUser) return;
    const s = new Set<number>(
      (selectedUser.roles ?? []).map((r) => Number(r.id))
    );
    setAssigned(s);
    setOkMsg(null);
    setError(null);
  }, [selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = React.useMemo(() => {
    const key = qUser.trim().toLowerCase();
    let arr = users;
    if (key) {
      arr = arr.filter((u) => {
        const roleNames = (u.roles ?? [])
          .map((r) => r.name || "")
          .join(" ")
          .toLowerCase();
        return (
          String(u.id).includes(key) ||
          (u.email || "").toLowerCase().includes(key) ||
          (u.full_name || "").toLowerCase().includes(key) ||
          (u.phone_number || "").toLowerCase().includes(key) ||
          roleNames.includes(key)
        );
      });
    }
    return arr;
  }, [users, qUser]);

  /** role hệ thống: admin / manager / customer / staff → chỉ được chọn đúng 1 */
  const isSystemRoleId = React.useCallback(
    (id: number) => {
      const r = roles.find((x) => x.id === id);
      if (!r) return false;
      const k = (r.name || "").toLowerCase();
      return (
        r.is_system ||
        k === "admin" ||
        k === "manager" ||
        k === "customer" ||
        k === "staff"
      );
    },
    [roles]
  );

  /** Kiểm tra xem role có phải ROOT không */
  const isRootRole = React.useCallback(
    (id: number) => {
      const r = roles.find((x) => x.id === id);
      return r && (r.name || "").toLowerCase() === "root";
    },
    [roles]
  );

  const toggleRole = (roleId: number) => {
    if (!isAdmin) return;

    // BẢO VỆ ROOT: Chỉ root user mới có thể toggle role root
    if (isRootRole(roleId) && !isRootUser) {
      setError("❌ Chỉ Root mới có thể gán/bỏ role Root cho người khác!");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setAssigned((prev) => {
      const target = roles.find((r) => r.id === roleId);
      if (!target) return new Set<number>(prev);

      const next = new Set<number>(prev);

      // nếu là role hệ thống: bật thì tắt hết các role hệ thống khác
      if (isSystemRoleId(roleId)) {
        if (next.has(roleId)) {
          // tắt chính nó
          next.delete(roleId);
        } else {
          // bật nó → tắt các role hệ thống khác
          const sysIds = roles
            .filter((r) => isSystemRoleId(r.id))
            .map((r) => r.id);
          sysIds.forEach((id) => next.delete(id));
          next.add(roleId);
        }
        return next;
      }

      // còn lại: toggle bình thường
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const save = async () => {
    if (!isAdmin) return;
    if (!selectedUser) {
      setError("Chưa chọn người dùng.");
      return;
    }

    // Kiểm tra xem roles có thay đổi không
    const currentRoleIds = new Set(
      (selectedUser.roles ?? []).map((r) => Number(r.id))
    );
    const hasChanges =
      assigned.size !== currentRoleIds.size ||
      Array.from(assigned).some((id) => !currentRoleIds.has(id));

    if (!hasChanges) {
      const currentRoleNames = (selectedUser.roles ?? [])
        .map((r) => r.name)
        .join(", ");
      setError(
        `Vai trò hiện tại đã là ${currentRoleNames || "không có vai trò"} rồi.`
      );
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);
    setOkMsg(null);
    setError(null);
    try {
      // Gọi BE cập nhật role_ids cho user
      const res = await api.put(`/users/${selectedUser.id}`, {
        role_ids: Array.from(assigned),
      });

      // Lấy user đã cập nhật từ response (có roles đầy đủ từ backend)
      const updatedUser = ((res as any).data ?? (res as any)) as UserRead;

      // cập nhật lại user trong danh sách với dữ liệu từ backend
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? updatedUser : u))
      );

      // Sync lại assigned từ updatedUser để UI hiển thị đúng
      const newAssigned = new Set<number>(
        (updatedUser.roles ?? []).map((r) => Number(r.id))
      );
      setAssigned(newAssigned);

      setOkMsg("Đã lưu phân quyền vai trò cho người dùng.");

      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => setOkMsg(null), 3000);
    } catch (e: any) {
      setError(e?.message || "Lưu phân quyền thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // Modern gradient banner
  const banner =
    "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl p-8 shadow-xl border-2 border-purple-300/30";

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <header className={banner}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
              🔐
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">
                Phân quyền người dùng
              </h1>
              <p className="text-purple-100 mt-2 text-sm md:text-base">
                <b>Bước 1:</b> Gán vai trò (admin/manager/customer - chỉ chọn 1)
                •<b> Bước 2:</b> Gán quyền chi tiết từ bảng permissions
              </p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30 shadow-md">
            <div className="text-xs text-purple-200 uppercase tracking-wide">
              Quyền hiện tại
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {isRootUser
                ? "🔱 Root (Full Access)"
                : isAdmin
                  ? "👑 Admin (Full Access)"
                  : "👤 Chỉ xem"}
            </div>
          </div>
        </div>
      </header>

      {/* --- PHẦN 1: User ↔ Roles --- */}
      <section className="bg-white rounded-2xl border-2 border-indigo-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 p-6 border-b-2 border-indigo-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
              1
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Gán vai trò cho người dùng
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                🔍 Tìm người dùng
              </label>
              <div className="relative">
                <input
                  value={qUser}
                  onChange={(e) => setQUser(e.target.value)}
                  placeholder="Tìm theo ID / email / họ tên / SĐT / role…"
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-slate-900 placeholder-slate-400 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                👤 Chọn người dùng
              </label>
              <div className="relative">
                <select
                  value={selectedUserId ?? ""}
                  onChange={(e) =>
                    setSelectedUserId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-slate-900 transition-all shadow-sm"
                >
                  {loadingUsers ? (
                    <option>Đang tải…</option>
                  ) : filteredUsers.length === 0 ? (
                    <option value="">Không tìm thấy người dùng</option>
                  ) : (
                    filteredUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        #{u.id} • {u.email}
                        {u.full_name ? ` • ${u.full_name}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                🏷️ Vai trò hiện tại
              </label>
              <div className="min-h-[48px] flex items-center gap-2 flex-wrap bg-slate-50 rounded-xl border-2 border-slate-200 px-4 py-2">
                {selectedUser?.roles && selectedUser.roles.length > 0 ? (
                  selectedUser.roles.map((r) => (
                    <span
                      key={r.id}
                      className={cn(
                        "text-xs font-bold ring-2 px-3 py-1.5 rounded-lg shadow-sm",
                        roleChip(r.name)
                      )}
                    >
                      {r.name}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-sm">
                    Chưa có vai trò
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Role cards with modern design */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm font-semibold text-slate-700">
              {loadingRoles ? (
                <span className="animate-pulse">⏳ Đang tải vai trò…</span>
              ) : (
                <span>
                  📋 Tổng vai trò:{" "}
                  <span className="text-indigo-600 font-bold">
                    {roles.length}
                  </span>
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-slate-700">
              ✅ Đang chọn:{" "}
              <span className="text-indigo-600 font-bold">{assigned.size}</span>{" "}
              vai trò
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => {
              const checked = assigned.has(r.id);
              const isSystem = isSystemRoleId(r.id);
              const isRoot = isRootRole(r.id);
              const cannotToggle = isRoot && !isRootUser; // không phải root user thì không toggle được role root

              return (
                <label
                  key={r.id}
                  className={cn(
                    "group rounded-2xl border-2 p-5 transition-all shadow-md",
                    cannotToggle
                      ? "cursor-not-allowed opacity-60 border-slate-300 bg-slate-100"
                      : "cursor-pointer hover:shadow-xl transform hover:-translate-y-1",
                    checked && !cannotToggle
                      ? "border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 ring-2 ring-indigo-300"
                      : !cannotToggle &&
                          "border-slate-200 bg-white hover:border-indigo-200",
                    isRoot &&
                      "border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50"
                  )}
                  title={
                    cannotToggle
                      ? "🔒 Chỉ Root mới có thể gán role Root"
                      : r.description || r.name
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-2 border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer disabled:cursor-not-allowed"
                        checked={checked}
                        disabled={!isAdmin || cannotToggle}
                        onChange={() => toggleRole(r.id)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-bold text-slate-900 text-base">
                          {r.name}
                        </span>
                        {isRoot && (
                          <span className="text-[10px] uppercase px-2 py-1 rounded-md bg-purple-100 text-purple-700 border border-purple-200 font-bold tracking-wide">
                            🔱 ROOT
                          </span>
                        )}
                        {isSystem && !isRoot && (
                          <span className="text-[10px] uppercase px-2 py-1 rounded-md bg-amber-100 text-amber-700 border border-amber-200 font-bold tracking-wide">
                            System
                          </span>
                        )}
                        {checked && <span className="text-lg">✅</span>}
                        {cannotToggle && <span className="text-lg">🔒</span>}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {cannotToggle
                          ? "Chỉ Root mới có quyền gán role này"
                          : r.description || "Không có mô tả"}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Alert messages with modern styling */}
          {error && (
            <div className="mt-5 text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {okMsg && (
            <div className="mt-5 text-sm text-emerald-700 bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <span className="text-xl">✅</span>
              <span>{okMsg}</span>
            </div>
          )}
        </div>

        {/* Modern Footer actions */}
        <div className="p-6 border-t-2 border-indigo-100 bg-gradient-to-r from-slate-50 to-indigo-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            disabled={!isAdmin || saving || !selectedUser}
            onClick={save}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md",
              !isAdmin || !selectedUser
                ? "opacity-50 cursor-not-allowed bg-slate-300 text-slate-500"
                : saving
                  ? "opacity-70 cursor-wait bg-indigo-400 text-white"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 hover:shadow-xl transform hover:-translate-y-0.5"
            )}
            title={!isAdmin ? "Chỉ admin mới được lưu phân quyền" : undefined}
          >
            {saving ? "⏳ Đang lưu…" : "💾 Lưu vai trò"}
          </button>
        </div>
      </section>

      {/* --- PHẦN 2: User ↔ Permissions (phân quyền theo người dùng) --- */}
      <UserPermissionsSection selectedUserId={selectedUserId} />
    </div>
  );
}

/* ==================== COMPONENT: UserPermissionsSection ==================== */
function UserPermissionsSection({
  selectedUserId,
}: {
  selectedUserId: number | null;
}) {
  const [perms, setPerms] = React.useState<PermissionRead[]>([]);
  const [assigned, setAssigned] = React.useState<Set<number>>(
    new Set<number>()
  );
  const [originalAssigned, setOriginalAssigned] = React.useState<Set<number>>(
    new Set<number>()
  );
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  // Tải toàn bộ permissions
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<PermissionRead[]>("/permissions");
        if (!cancelled) setPerms((res as any).data ?? (res as any) ?? []);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "Không tải được danh sách quyền.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Tải permission_ids theo user
  React.useEffect(() => {
    if (!selectedUserId) {
      setAssigned(new Set<number>());
      setOriginalAssigned(new Set<number>());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const res = await api.get<{ permission_ids: number[] }>(
          `/users/${selectedUserId}/permissions`
        );
        if (cancelled) return;
        const raw = ((res as any).data ?? (res as any))?.permission_ids;
        const idsArr: number[] = Array.isArray(raw)
          ? (raw as Array<number | string>).map((x) => Number(x))
          : [];
        const ids = new Set<number>(idsArr);
        setAssigned(ids);
        setOriginalAssigned(new Set(ids)); // Lưu snapshot để so sánh
        setOk(null);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "Không tải được quyền của người dùng.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  const toggle = (id: number) => {
    setAssigned((prev) => {
      const next = new Set<number>(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!selectedUserId) return;

    // Kiểm tra xem permissions có thay đổi không
    const hasChanges =
      assigned.size !== originalAssigned.size ||
      Array.from(assigned).some((id) => !originalAssigned.has(id));

    if (!hasChanges) {
      setError("Quyền không có thay đổi.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);
    setOk(null);
    setError(null);
    try {
      await api.put(`/users/${selectedUserId}/permissions`, {
        permission_ids: Array.from(assigned),
      });

      // Cập nhật originalAssigned sau khi lưu thành công
      setOriginalAssigned(new Set(assigned));

      setOk("Đã lưu quyền cho người dùng.");

      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => setOk(null), 3000);
    } catch (e: any) {
      setError(e?.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const grouped = React.useMemo(() => {
    const groups: Record<string, PermissionRead[]> = {};
    for (const p of perms) {
      const key = (p.code?.split(".")[0] || "other").toLowerCase();
      (groups[key] ||= []).push(p);
    }
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [perms]);

  return (
    <section className="bg-white rounded-2xl border-2 border-purple-200 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-6 border-b-2 border-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
            2
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Quyền chi tiết theo người dùng
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Chọn người dùng ở trên, sau đó tick/untick các quyền từ bảng{" "}
              <code className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                permissions
              </code>
            </p>
          </div>
        </div>
      </div>

      {!selectedUserId ? (
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">👆</div>
          <div className="text-slate-500 text-lg font-medium">
            Hãy chọn một người dùng ở phần trên
          </div>
        </div>
      ) : (
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-3">⏳</div>
              <div className="text-slate-500 text-sm">
                Đang tải danh sách quyền…
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(grouped).map(([module, list]) => (
                <div
                  key={module}
                  className="border-2 border-slate-200 rounded-xl bg-white shadow-md hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="px-4 py-3 border-b-2 border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50">
                    <div className="font-bold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="text-base">📁</span>
                      {module}
                    </div>
                  </div>
                  <ul className="max-h-[320px] overflow-auto divide-y divide-slate-100">
                    {list.map((p) => {
                      const checked = assigned.has(p.id);
                      return (
                        <li
                          key={p.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3 text-sm hover:bg-purple-50 transition-colors cursor-pointer",
                            checked && "bg-purple-50/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(p.id)}
                            className="mt-1 w-4 h-4 rounded border-2 border-slate-300 text-purple-600 focus:ring-2 focus:ring-purple-400 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 break-all flex items-center gap-2">
                              {p.code}
                              {checked && <span className="text-sm">✅</span>}
                            </div>
                            <div className="text-slate-600 text-xs mt-0.5">
                              {p.name || "—"}
                            </div>
                            {p.description && (
                              <div className="text-slate-500 text-xs mt-1 italic">
                                {p.description}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-5 text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {ok && (
            <div className="mt-5 text-sm text-emerald-700 bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <span className="text-xl">✅</span>
              <span>{ok}</span>
            </div>
          )}

          <div className="pt-6 flex justify-end">
            <button
              disabled={saving}
              onClick={save}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md",
                saving
                  ? "opacity-70 cursor-wait bg-purple-400 text-white"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 hover:shadow-xl transform hover:-translate-y-0.5"
              )}
            >
              {saving ? "⏳ Đang lưu…" : "💾 Lưu quyền"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
