// frontend/app/pages/Role.tsx
import * as React from "react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

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
  const isAdmin = auth.hasRole?.("admin"); // chỉ admin được phân quyền động

  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [loadingRoles, setLoadingRoles] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [users, setUsers] = React.useState<UserRead[]>([]);
  const [roles, setRoles] = React.useState<RoleRead[]>([]);

  const [qUser, setQUser] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);
  const selectedUser = React.useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  // Tập role_id đang được gán cho user đang chọn
  const [assigned, setAssigned] = React.useState<Set<number>>(new Set<number>());

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
        const list: UserRead[] = Array.isArray(data) ? data : data?.items ?? [];
        if (cancelled) return;
        setUsers(list);
        // auto select user đầu tiên nếu chưa chọn
        if (!selectedUserId && list.length > 0) {
          setSelectedUserId(list[0].id);
          const s = new Set<number>((list[0].roles ?? []).map((r) => Number(r.id)));
          setAssigned(s);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Không tải được danh sách người dùng.");
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
        const res = await api.get<RoleRead[] | { items: RoleRead[] }>("/users/roles");
        const data = (res as any).data ?? (res as any);
        const list: RoleRead[] = Array.isArray(data) ? data : data?.items ?? [];
        if (cancelled) return;
        setRoles(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Không tải được danh sách vai trò.");
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
    const s = new Set<number>((selectedUser.roles ?? []).map((r) => Number(r.id)));
    setAssigned(s);
    setOkMsg(null);
    setError(null);
  }, [selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = React.useMemo(() => {
    const key = qUser.trim().toLowerCase();
    let arr = users;
    if (key) {
      arr = arr.filter((u) => {
        const roleNames = (u.roles ?? []).map((r) => r.name || "").join(" ").toLowerCase();
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

  /** role hệ thống: admin / manager / customer → chỉ được chọn đúng 1 */
  const isSystemRoleId = React.useCallback(
    (id: number) => {
      const r = roles.find((x) => x.id === id);
      if (!r) return false;
      const k = (r.name || "").toLowerCase();
      return r.is_system || k === "admin" || k === "manager" || k === "customer";
    },
    [roles]
  );

  const toggleRole = (roleId: number) => {
    if (!isAdmin) return;

    setAssigned((prev) => {
      const target = roles.find((r) => r.id === roleId);
      if (!target) return new Set<number>(prev);

      const next = new Set<number>(prev);

      // nếu là role hệ thống: bật thì tắt hết 2 role hệ thống còn lại
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
    setSaving(true);
    setOkMsg(null);
    setError(null);
    try {
      // Gọi BE cập nhật role_ids cho user
      await api.put(`/users/${selectedUser.id}`, {
        role_ids: Array.from(assigned),
      });

      // cập nhật lại user trong danh sách
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, roles: roles.filter((r) => assigned.has(r.id)) }
            : u
        )
      );
      setOkMsg("Đã lưu phân quyền vai trò cho người dùng.");
    } catch (e: any) {
      setError(e?.message || "Lưu phân quyền thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // Header gradient gọn gàng
  const banner =
    "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white rounded-2xl p-6 shadow-lg";

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className={banner}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Phân quyền người dùng</h1>
            <p className="text-white/90 mt-1">
              Bước 1: gán <b>vai trò</b> (admin/manager/customer chỉ chọn 1). Bước 2: gán{" "}
              <b>permissions</b> chi tiết cho người dùng bên dưới.
            </p>
          </div>
          <div className="text-xs md:text-sm bg-white/10 rounded-lg px-3 py-1.5">
            {isAdmin ? "Bạn đang đăng nhập quyền Admin" : "Chỉ Admin mới được phân quyền động"}
          </div>
        </div>
      </header>

      {/* --- PHẦN 1: User ↔ Roles --- */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b flex flex-col md:flex-row md:items-center gap-3">
          <div className="md:w-80">
            <label className="block text-sm text-slate-600 mb-1">Tìm người dùng</label>
            <input
              value={qUser}
              onChange={(e) => setQUser(e.target.value)}
              placeholder="Tìm theo ID / email / họ tên / SĐT / role…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-900 placeholder-slate-400 caret-slate-900"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm text-slate-600 mb-1">Chọn người dùng</label>
            <div className="relative">
              <select
                value={selectedUserId ?? ""}
                onChange={(e) =>
                  setSelectedUserId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-900"
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

          <div className="md:w-56">
            <label className="block text-sm text-slate-600 mb-1">Vai trò hiện tại</label>
            <div className="min-h-[40px] flex items-center gap-1 flex-wrap">
              {selectedUser?.roles && selectedUser.roles.length > 0 ? (
                selectedUser.roles.map((r) => (
                  <span
                    key={r.id}
                    className={cn(
                      "text-xs font-semibold ring-1 px-2 py-1 rounded-full",
                      roleChip(r.name)
                    )}
                  >
                    {r.name}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-sm">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Lưới role – admin/manager/customer chỉ 1 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-slate-600">
              {loadingRoles ? "Đang tải vai trò…" : `Tổng vai trò: ${roles.length}`}
            </div>
            <div className="text-sm text-slate-600">
              Đang chọn: <b>{assigned.size}</b>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => {
              const checked = assigned.has(r.id);
              const isSystem = isSystemRoleId(r.id);
              return (
                <label
                  key={r.id}
                  className={cn(
                    "group cursor-pointer rounded-xl border p-4 transition shadow-sm hover:shadow-md",
                    checked ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white"
                  )}
                  title={r.description || r.name}
                >
                  <div className="flex items-start gap-3">
                    {/* checkbox cho tất cả; nếu là role hệ thống thì logic đảm bảo chỉ 1 */}
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      disabled={!isAdmin}
                      onChange={() => toggleRole(r.id)}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{r.name}</span>
                        {isSystem && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            system
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">
                        {r.description || "—"}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Alert */}
          {error && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {okMsg && (
            <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {okMsg}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t bg-slate-50 flex items-center justify-end gap-2 rounded-b-xl">
          <button
            className={cn(
              "px-4 py-2 rounded-lg border text-sm font-medium",
              "border-slate-300 text-slate-700 hover:bg-white"
            )}
            onClick={() => {
              if (!selectedUser) return;
              const s = new Set<number>((selectedUser.roles ?? []).map((r) => Number(r.id)));
              setAssigned(s);
              setOkMsg(null);
              setError(null);
            }}
          >
            Hoàn tác
          </button>
          <button
            disabled={!isAdmin || saving || !selectedUser}
            onClick={save}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold",
              !isAdmin || !selectedUser
                ? "opacity-60 cursor-not-allowed bg-indigo-400 text-white"
                : saving
                ? "opacity-60 cursor-not-allowed bg-indigo-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            )}
            title={!isAdmin ? "Chỉ admin mới được lưu phân quyền" : undefined}
          >
            {saving ? "Đang lưu…" : "Lưu vai trò"}
          </button>
        </div>
      </section>

      {/* --- PHẦN 2: User ↔ Permissions (phân quyền theo người dùng) --- */}
      <UserPermissionsSection selectedUserId={selectedUserId} />
    </div>
  );
}

/* ==================== COMPONENT: UserPermissionsSection ==================== */
function UserPermissionsSection({ selectedUserId }: { selectedUserId: number | null }) {
  const [perms, setPerms] = React.useState<PermissionRead[]>([]);
  const [assigned, setAssigned] = React.useState<Set<number>>(new Set<number>());
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
        if (!cancelled) setError(e?.message || "Không tải được danh sách quyền.");
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
        setOk(null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Không tải được quyền của người dùng.");
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
    setSaving(true);
    setOk(null);
    setError(null);
    try {
      await api.put(`/users/${selectedUserId}/permissions`, {
        permission_ids: Array.from(assigned),
      });
      setOk("Đã lưu quyền cho người dùng.");
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
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-slate-800">Quyền chi tiết theo người dùng</h2>
        <p className="text-sm text-slate-500">
          Chọn người dùng ở trên, sau đó tick/untick các quyền từ bảng <code>permissions</code>.
        </p>
      </div>

      {!selectedUserId ? (
        <div className="p-4 text-slate-500 text-sm">Hãy chọn một người dùng ở phần trên.</div>
      ) : (
        <div className="p-4">
          {loading ? (
            <div className="text-slate-500 text-sm">Đang tải danh sách quyền…</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(grouped).map(([module, list]) => (
                <div key={module} className="border rounded-md bg-white">
                  <div className="px-3 py-2 border-b bg-slate-50 font-semibold text-sm uppercase tracking-wide">
                    {module}
                  </div>
                  <ul className="max-h-[320px] overflow-auto divide-y">
                    {list.map((p) => {
                      const checked = assigned.has(p.id);
                      return (
                        <li key={p.id} className="flex items-start gap-2 px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(p.id)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 break-all">{p.code}</div>
                            <div className="text-slate-600">{p.name || "—"}</div>
                            {p.description && (
                              <div className="text-slate-500 text-xs mt-0.5">{p.description}</div>
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
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          {ok && (
            <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
              {ok}
            </div>
          )}

          <div className="pt-3 flex justify-end">
            <button
              disabled={saving}
              onClick={save}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold",
                saving
                  ? "opacity-60 cursor-not-allowed bg-indigo-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
            >
              {saving ? "Đang lưu…" : "Lưu quyền"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
