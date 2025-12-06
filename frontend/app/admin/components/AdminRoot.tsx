// frontend/app/admin/components/AdminRoot.tsx
import { Outlet } from "react-router";
import { AuthProvider } from "~/context/AuthContext";

/**
 * Root wrapper cho tất cả admin routes
 * Wrap AuthProvider để đảm bảo context luôn có sẵn cho admin routes
 */
export default function AdminRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
