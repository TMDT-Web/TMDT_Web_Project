// frontend/app/context/AuthContext.tsx
import * as React from "react";
import { api } from "~/lib/api";
import { lsGet, lsSet, lsRemove } from "~/lib/safeLocalStorage";

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
    return {
      user: null,
      roles: [],
      isAuthenticated: Boolean(accessToken),
      accessToken,
      refreshToken,
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
    setAuthHeader(null);
    setState({
      user: null,
      roles: [],
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
    });
  }, []);

  const hasRole = React.useCallback(
    (...roles: string[]) => {
      if (!state.isAuthenticated) return false;
      if (!roles || roles.length === 0) return true;
      const need = roles.map((r) => String(r || "").toLowerCase());
      return state.roles.some((r) => need.includes(r));
    },
    [state.isAuthenticated, state.roles]
  );

  // Hàm hiển thị tên vai trò (ưu tiên danh sách truyền vào)
  const displayRole = React.useCallback(
    (r?: Array<string | { name?: string }>): string => {
      const source =
        r ??
        (state.user?.roles as Array<string | { name?: string }> | undefined) ??
        [];
      const names = source
        .map((x) => (typeof x === "string" ? x : x?.name ?? ""))
        .map((x) => x.trim())
        .filter(Boolean);
      // Tùy biến quy tắc hiển thị nếu cần
      return names[0]?.toLowerCase() || (state.roles[0] ?? "guest");
    },
    [state.user?.roles, state.roles]
  );

  const displayRoleText = React.useMemo(
    () => (state.roles.length ? state.roles.join(", ") : "guest"),
    [state.roles]
  );

  const ctx: AuthContextType = {
    state,
    user: state.user,
    displayRole,      // dùng như hàm: displayRole(...)
    displayRoleText,  // chuỗi gộp sẵn cho code cũ
    login,
    logout,
    hasRole,
    hasAnyRole: hasRole,
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
