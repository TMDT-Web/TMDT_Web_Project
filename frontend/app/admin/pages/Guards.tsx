// frontend/app/admin/pages/Guards.tsx
import * as React from "react";
import { useAuth } from "~/context/AuthContext";

/**
 * Dùng để bao route/trang cần quyền.
 * Ví dụ:
 *   <RequireRole allow={['admin']} fallback={<NoAccess/>}>
 *     ...admin layout...
 *   </RequireRole>
 */
export function RequireRole({
  allow,
  children,
  fallback = null,
}: {
  // BỔ SUNG 'admin' và giữ các value khác
  allow: Array<"admin" | "manager" | "staff" | "customer" | "root">;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasRole } = useAuth();
  // chuẩn hoá: lower-case ngay tại đây để tránh sai khác
  const normalized = React.useMemo(
    () => allow.map((r) => r.toLowerCase()),
    [allow]
  );

  return hasRole(...normalized) ? <>{children}</> : <>{fallback}</>;
}

/** Alias để không phải đổi import ở file cũ */
export function RequireAnyRole(props: React.ComponentProps<typeof RequireRole>) {
  return <RequireRole {...props} />;
}
