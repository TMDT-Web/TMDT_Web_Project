// frontend/app/context/AuthContext.tsx
import * as React from "react";
import { api } from "~/lib/api";
import { lsGet, lsRemove, lsSet } from "~/lib/safeLocalStorage";

// ===== Types phản ánh tối thiểu từ backend =====
type RoleRead = { id: number; name: string };
type UserRead = {
  id: number;
  email: string;
  full_name?: string | null;
  roles?: RoleRead[];
  is_active?: boolean;
};

type AuthState = {
  user: UserRead | null;
  roles: string[]; // lowercase
  isAuthenticated: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  // Impersonation: root có thể mạo danh role khác
  impersonatedRole?: string | null; // role đang mạo danh
  originalRoles?: string[]; // lưu roles gốc khi impersonate
};

type LoginInput = { email: string; password: string };

type AuthContextType = {
  // state tổng hợp
  state: AuthState;

  // back-compat access nhanh
  user: UserRead | null;

  /**
   * Trả về tên vai trò hiển thị (ví dụ: "admin", "manager", ...)
   * Ưu tiên danh sách truyền vào; nếu không có, lấy từ user hiện tại.
   */
  displayRole: (roles?: Array<string | { name?: string }>) => string;

  /**
   * Chuỗi vai trò gộp sẵn — dành cho code cũ đã render trực tiếp chuỗi
   * (VD: `{auth.displayRoleText}`); nên ưu tiên dùng displayRole() thay vì field này.
   */
  displayRoleText: string;

  // API
  login: ((email: string, password: string) => Promise<void>) &
    ((input: LoginInput) => Promise<void>);
  logout: () => void;

  // guards
  hasRole: (...roles: string[]) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;

  // Impersonation (chỉ root)
  isRoot: boolean; // true nếu user gốc có role root
  isImpersonating: boolean; // true nếu đang mạo danh
  impersonateRole: (role: string) => void; // bắt đầu mạo danh
  stopImpersonation: () => void; // dừng mạo danh
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const LS = {
  access: "fs_access_token",
  refresh: "fs_refresh_token",
};

// Tự set Authorization header trên axios instance của bạn
function setAuthHeader(token?: string | null) {
  const anyApi = api as any;
  if (!anyApi?.defaults) return;
  if (token) {
    anyApi.defaults.headers = anyApi.defaults.headers ?? {};
    anyApi.defaults.headers.common = anyApi.defaults.headers.common ?? {};
    anyApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else if (anyApi?.defaults?.headers?.common?.Authorization) {
    delete anyApi.defaults.headers.common["Authorization"];
  }
}

function normalizeRoles(u?: UserRead | null) {
  return (u?.roles ?? []).map((r) => String(r.name || "").toLowerCase());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(() => {
    const accessToken = lsGet(LS.access);
    const refreshToken = lsGet(LS.refresh);
    const impersonatedRole = lsGet("impersonated_role");
    const originalRoles = lsGet("original_roles");
    return {
      user: null,
      roles: [],
      isAuthenticated: Boolean(accessToken),
      accessToken,
      refreshToken,
      impersonatedRole: impersonatedRole || null,
      originalRoles: originalRoles ? JSON.parse(originalRoles) : undefined,
    };
  });

  // đồng bộ header
  React.useEffect(() => {
    setAuthHeader(state.accessToken || null);
  }, [state.accessToken]);

  // bootstrap user từ token (nếu có)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!state.accessToken) return;
      try {
        const res = await api.get<UserRead>("/users/me");
        // axios mặc định nằm trong res.data, nhưng nếu api wrapper đã unwrap thì fallback
        const me = (res as any).data ?? (res as any);
        if (cancelled) return;
        setState((s) => ({
          ...s,
          user: me,
          roles: normalizeRoles(me),
          isAuthenticated: true,
        }));
      } catch {
        // token hỏng -> xoá session
        lsRemove(LS.access);
        lsRemove(LS.refresh);
        setAuthHeader(null);
        setState({
          user: null,
          roles: [],
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // run once

  // login: nhận (email, password) hoặc ({email, password})
  const login: AuthContextType["login"] = React.useCallback(
    async (a: string | LoginInput, b?: string) => {
      const payload: LoginInput =
        typeof a === "string" ? { email: a, password: String(b ?? "") } : a;

      const res = await api.post<{
        user: UserRead;
        access_token: string;
        refresh_token: string;
        token_type: "bearer";
      }>("/auth/login", payload);

      const data = (res as any).data ?? (res as any);
      const { user, access_token, refresh_token } = data;

      lsSet(LS.access, access_token);
      lsSet(LS.refresh, refresh_token);
      setAuthHeader(access_token);

      setState({
        user,
        roles: normalizeRoles(user),
        isAuthenticated: true,
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    },
    []
  );

  const logout = React.useCallback(() => {
    lsRemove(LS.access);
    lsRemove(LS.refresh);
    lsRemove("impersonated_role");
    lsRemove("original_roles");
    setAuthHeader(null);
    setState({
      user: null,
      roles: [],
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      impersonatedRole: null,
      originalRoles: undefined,
    });
  }, []);

  // Kiểm tra xem user GỐC có role root không
  const isRoot = React.useMemo(() => {
    const original = state.originalRoles || state.roles;
    return original.includes("root");
  }, [state.originalRoles, state.roles]);

  // Kiểm tra xem đang mạo danh không
  const isImpersonating = Boolean(state.impersonatedRole);

  const hasRole = React.useCallback(
    (...roles: string[]) => {
      if (!state.isAuthenticated) return false;
      if (!roles || roles.length === 0) return true;
      const need = roles.map((r) => String(r || "").toLowerCase());

      // Nếu đang impersonate, dùng role mạo danh
      if (state.impersonatedRole) {
        return need.includes(state.impersonatedRole.toLowerCase());
      }

      return state.roles.some((r) => need.includes(r));
    },
    [state.isAuthenticated, state.roles, state.impersonatedRole]
  );

  // Hàm hiển thị tên vai trò (ưu tiên danh sách truyền vào)
  const displayRole = React.useCallback(
    (r?: Array<string | { name?: string }>): string => {
      // Nếu đang impersonate, hiển thị role mạo danh
      if (state.impersonatedRole && !r) {
        return state.impersonatedRole;
      }

      const source =
        r ??
        (state.user?.roles as Array<string | { name?: string }> | undefined) ??
        [];
      const names = source
        .map((x) => (typeof x === "string" ? x : (x?.name ?? "")))
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);

      // Ưu tiên hiển thị theo thứ tự: root > admin > manager > staff > customer
      const priority = ["root", "admin", "manager", "staff", "customer"];
      for (const role of priority) {
        if (names.includes(role)) {
          return role;
        }
      }

      // Nếu không có role nào trong priority, lấy role đầu tiên
      return names[0] || (state.roles[0] ?? "guest");
    },
    [state.user?.roles, state.roles, state.impersonatedRole]
  );

  const displayRoleText = React.useMemo(() => {
    if (state.impersonatedRole) {
      return `${state.impersonatedRole} (Mạo danh)`;
    }
    return state.roles.length ? state.roles.join(", ") : "guest";
  }, [state.roles, state.impersonatedRole]);

  // Bắt đầu mạo danh (chỉ root)
  const impersonateRole = React.useCallback(
    (role: string) => {
      const original = state.originalRoles || state.roles;
      if (!original.includes("root")) {
        console.warn("Chỉ root mới có thể mạo danh");
        return;
      }

      const roleLower = role.toLowerCase();
      lsSet("impersonated_role", roleLower);
      lsSet("original_roles", JSON.stringify(original));

      setState((s) => ({
        ...s,
        impersonatedRole: roleLower,
        originalRoles: original,
      }));
    },
    [state.roles, state.originalRoles]
  );

  // Dừng mạo danh
  const stopImpersonation = React.useCallback(() => {
    lsRemove("impersonated_role");
    lsRemove("original_roles");

    setState((s) => ({
      ...s,
      impersonatedRole: null,
      originalRoles: undefined,
    }));
  }, []);

  const ctx: AuthContextType = {
    state,
    user: state.user,
    displayRole, // dùng như hàm: displayRole(...)
    displayRoleText, // chuỗi gộp sẵn cho code cũ
    login,
    logout,
    hasRole,
    hasAnyRole: hasRole,
    isRoot,
    isImpersonating,
    impersonateRole,
    stopImpersonation,
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
