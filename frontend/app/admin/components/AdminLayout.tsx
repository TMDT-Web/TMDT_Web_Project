// frontend/app/admin/components/AdminLayout.tsx
import * as React from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { RequireRole } from "../pages/Guards";

export default function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  // Khi logout, điều hướng về trang đăng nhập admin
  const handleLogout = React.useCallback(() => {
    auth.logout();
    navigate("/admin/login");
  }, [auth, navigate]);

  const isAdminOrRoot = auth.hasRole("admin", "root");
  const isManagerOnly = !isAdminOrRoot && auth.hasRole("manager");

  return (
    <RequireRole allow={["admin", "root", "manager"]} fallback={<NoAccess />}>
      <div className="min-h-screen bg-slate-900 text-white">
        {/* SIDEBAR */}
        <aside className="w-72 p-6 fixed inset-y-0 bg-slate-950">
          <div className="text-xl font-bold mb-6">Admin Panel</div>

          <nav className="space-y-2">
            {/* Admin/Root: chỉ 2 mục */}
            {isAdminOrRoot && (
              <>
                <Nav to="/admin/users">Quản lý người dùng</Nav>
                <Nav to="/admin/roles">Phân quyền / Vai trò</Nav>
              </>
            )}

            {/* Manager: các mục còn lại */}
            {isManagerOnly && (
              <>
                <Nav to="/admin/dashboard">Dashboard</Nav>
                <Nav to="/admin/products">Sản phẩm</Nav>
                <Nav to="/admin/categories">Danh mục</Nav>
                <Nav to="/admin/orders">Đơn hàng</Nav>
                <Nav to="/admin/suppliers">Nhà cung cấp</Nav>
                <Nav to="/admin/warranty">Bảo hành</Nav>
                <Nav to="/admin/import">Nhập hàng</Nav>
                <Nav to="/admin/statistical">Thống kê</Nav>
              </>
            )}

            <Nav to="/">← Về trang bán hàng</Nav>
          </nav>

          {/* User Info */}
          <div className="mt-10 text-sm text-slate-300">
            <div>Tài khoản: {auth.user?.email}</div>
            <div>
              Vai trò:{" "}
              {typeof auth.displayRole === "function"
                ? auth.displayRole(auth.user?.roles)
                : auth.displayRole}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-md bg-rose-600 py-2 font-semibold hover:bg-rose-700"
          >
            Đăng xuất
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <main className="pl-72 p-8">
          <Outlet />
        </main>
      </div>
    </RequireRole>
  );
}

function Nav({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block rounded-md px-3 py-2 hover:bg-slate-800 transition"
    >
      {children}
    </Link>
  );
}

function NoAccess() {
  return (
    <div className="min-h-screen grid place-content-center">
      <div className="bg-white text-slate-900 rounded-xl p-8 shadow">
        <div className="text-lg font-semibold">Không có quyền truy cập</div>
        <p className="text-sm text-slate-600 mt-1">
          Bạn cần quyền quản trị để vào khu vực này.
        </p>
        <div className="mt-4">
          <Link className="text-blue-600 underline" to="/admin/login">
            Về trang đăng nhập quản trị
          </Link>
        </div>
      </div>
    </div>
  );
}
