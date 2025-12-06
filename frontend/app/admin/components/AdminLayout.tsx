// frontend/app/admin/components/AdminLayout.tsx
import * as React from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { RequireRole } from "../pages/Guards";
import { ImpersonationBanner } from "./ImpersonationBanner";

export default function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  // Khi logout, điều hướng về trang đăng nhập admin
  const handleLogout = React.useCallback(() => {
    auth.logout();
    navigate("/admin/login");
  }, [auth, navigate]);

  const isAdminOrRoot = auth.hasRole("admin", "root");
  const isManager = auth.hasRole("manager");
  const isStaff = auth.hasRole("staff");

  // Impersonation UI state
  const [showImpersonateMenu, setShowImpersonateMenu] = React.useState(false);

  const handleImpersonate = (role: string) => {
    auth.impersonateRole(role);
    setShowImpersonateMenu(false);
  };

  return (
    <RequireRole
      allow={["admin", "root", "manager", "staff"]}
      fallback={<NoAccess />}
    >
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* SIDEBAR - Gradient xanh dương sang tím */}
        <aside className="w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white fixed left-0 top-0 bottom-0 overflow-y-auto flex flex-col shadow-2xl">
          <div className="p-6 border-b border-blue-700/30 bg-blue-950/40">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-xs text-blue-200 mt-1">Quản trị hệ thống</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {/* ROOT: Full access - Tất cả chức năng */}
            {auth.hasRole("root") && (
              <>
                <div className="text-xs uppercase tracking-wider text-blue-300/70 px-3 mb-2 font-bold">
                  🔱 Super Admin
                </div>
                <NavItem to="/admin/dashboard" icon="📊">
                  Dashboard
                </NavItem>
                <NavItem to="/admin/users" icon="👥">
                  Quản lý người dùng
                </NavItem>
                <NavItem to="/admin/roles" icon="🔐">
                  Phân quyền / Vai trò
                </NavItem>
                <NavItem to="/admin/products" icon="📦">
                  Sản phẩm
                </NavItem>
                <NavItem to="/admin/categories" icon="📁">
                  Danh mục
                </NavItem>
                <NavItem to="/admin/orders" icon="🛒">
                  Đơn hàng
                </NavItem>
                <NavItem to="/admin/suppliers" icon="🏭">
                  Nhà cung cấp
                </NavItem>
                <NavItem to="/admin/warranty" icon="🛡️">
                  Bảo hành
                </NavItem>
                <NavItem to="/admin/import" icon="📥">
                  Nhập hàng
                </NavItem>
                <NavItem to="/admin/statistical" icon="📈">
                  Thống kê
                </NavItem>
              </>
            )}

            {/* ADMIN: Quản lý hệ thống & người dùng */}
            {auth.hasRole("admin") && !auth.hasRole("root") && (
              <>
                <div className="text-xs uppercase tracking-wider text-blue-300/70 px-3 mb-2 font-bold">
                  👑 Administrator
                </div>
                <NavItem to="/admin/dashboard" icon="📊">
                  Dashboard
                </NavItem>
                <NavItem to="/admin/users" icon="👥">
                  Quản lý người dùng
                </NavItem>
                <NavItem to="/admin/roles" icon="🔐">
                  Phân quyền / Vai trò
                </NavItem>
                <NavItem to="/admin/statistical" icon="📈">
                  Thống kê
                </NavItem>
              </>
            )}

            {/* MANAGER: Quản lý nghiệp vụ đầy đủ */}
            {isManager && !auth.hasRole("admin") && !auth.hasRole("root") && (
              <>
                <div className="text-xs uppercase tracking-wider text-blue-300/70 px-3 mb-2 font-bold">
                  🏢 Manager
                </div>
                <NavItem to="/admin/dashboard" icon="📊">
                  Dashboard
                </NavItem>
                <NavItem to="/admin/products" icon="📦">
                  Sản phẩm
                </NavItem>
                <NavItem to="/admin/categories" icon="📁">
                  Danh mục
                </NavItem>
                <NavItem to="/admin/orders" icon="🛒">
                  Đơn hàng
                </NavItem>
                <NavItem to="/admin/suppliers" icon="🏭">
                  Nhà cung cấp
                </NavItem>
                <NavItem to="/admin/warranty" icon="🛡️">
                  Bảo hành
                </NavItem>
                <NavItem to="/admin/import" icon="📥">
                  Nhập hàng
                </NavItem>
                <NavItem to="/admin/statistical" icon="📈">
                  Thống kê
                </NavItem>
              </>
            )}

            {/* STAFF: Quyền hạn chế - Chỉ xem và quản lý đơn hàng, bảo hành */}
            {isStaff &&
              !isManager &&
              !auth.hasRole("admin") &&
              !auth.hasRole("root") && (
                <>
                  <div className="text-xs uppercase tracking-wider text-blue-300/70 px-3 mb-2 font-bold">
                    👔 Staff
                  </div>
                  <NavItem to="/admin/dashboard" icon="📊">
                    Dashboard
                  </NavItem>
                  <NavItem to="/admin/orders" icon="🛒">
                    Đơn hàng
                  </NavItem>
                  <NavItem to="/admin/warranty" icon="🛡️">
                    Bảo hành
                  </NavItem>
                  <NavItem to="/admin/products" icon="📦">
                    Xem sản phẩm
                  </NavItem>
                </>
              )}

            <div className="pt-4 mt-4 border-t border-blue-700/30">
              <NavItem to="/" icon="🏠">
                Về trang bán hàng
              </NavItem>
            </div>
          </nav>

          {/* User Info & Logout ở cuối sidebar */}
          <div className="p-4 border-t border-blue-700/30 bg-indigo-950/50 backdrop-blur-sm">
            {/* Impersonation Banner - chỉ hiện khi đang mạo danh */}
            {auth.isImpersonating && (
              <div className="mb-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-yellow-200 text-xs font-semibold mb-2">
                  <span>👁️</span>
                  <span>Đang mạo danh</span>
                </div>
                <button
                  onClick={auth.stopImpersonation}
                  className="w-full text-xs bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 rounded-lg transition-all"
                >
                  🔙 Quay lại Root
                </button>
              </div>
            )}

            {/* Root Impersonation Menu */}
            {auth.isRoot && !auth.isImpersonating && (
              <div className="mb-3 relative">
                <button
                  onClick={() => setShowImpersonateMenu(!showImpersonateMenu)}
                  className="w-full bg-purple-500/20 border border-purple-400/40 hover:bg-purple-500/30 rounded-lg py-2.5 px-3 text-left transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👁️</span>
                      <span className="text-xs font-semibold text-purple-200">
                        Mạo danh vai trò
                      </span>
                    </div>
                    <span className="text-purple-300 text-xs">
                      {showImpersonateMenu ? "▼" : "▶"}
                    </span>
                  </div>
                </button>

                {showImpersonateMenu && (
                  <div className="absolute bottom-full mb-2 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden z-50">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => handleImpersonate("admin")}
                        className="w-full text-left px-3 py-2 text-sm text-violet-300 hover:bg-violet-500/20 rounded transition"
                      >
                        👑 Admin
                      </button>
                      <button
                        onClick={() => handleImpersonate("manager")}
                        className="w-full text-left px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/20 rounded transition"
                      >
                        🏢 Manager
                      </button>
                      <button
                        onClick={() => handleImpersonate("staff")}
                        className="w-full text-left px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/20 rounded transition"
                      >
                        👔 Staff
                      </button>
                      <button
                        onClick={() => handleImpersonate("customer")}
                        className="w-full text-left px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 rounded transition"
                      >
                        👤 Customer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-blue-200 mb-3">
              <div className="truncate font-medium" title={auth.user?.email}>
                {auth.user?.email}
              </div>
              <div className="text-blue-300/70 mt-0.5">
                {typeof auth.displayRole === "function"
                  ? auth.displayRole(auth.user?.roles)
                  : auth.displayRole}
                {auth.isImpersonating && (
                  <span className="text-yellow-300 ml-1">(Mạo danh)</span>
                )}
                {auth.isRoot && !auth.isImpersonating && (
                  <span className="text-purple-300 ml-1">🔱</span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-600 py-2.5 text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-red-500/50"
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT - Nền sáng với card trắng */}
        <main className="flex-1 ml-64">
          {/* Impersonation Warning Banner */}
          <ImpersonationBanner />

          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </RequireRole>
  );
}

function NavItem({
  to,
  icon,
  children,
}: {
  to: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-100 hover:bg-blue-700/40 hover:text-white transition-all group backdrop-blur-sm"
    >
      {icon && (
        <span className="text-lg group-hover:scale-110 transition-transform">
          {icon}
        </span>
      )}
      <span className="font-medium">{children}</span>
    </Link>
  );
}

function NoAccess() {
  return (
    <div className="min-h-screen grid place-content-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 max-w-md">
        <div className="text-lg font-bold text-slate-900">
          ⚠️ Không có quyền truy cập
        </div>
        <p className="text-sm text-slate-600 mt-2">
          Bạn cần quyền quản trị để vào khu vực này.
        </p>
        <div className="mt-6">
          <Link
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            to="/admin/login"
          >
            <span>🔐</span>
            Về trang đăng nhập quản trị
          </Link>
        </div>
      </div>
    </div>
  );
}
