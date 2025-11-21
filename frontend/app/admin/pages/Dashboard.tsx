import { useAuth } from "~/context/AuthContext";

export default function Dashboard() {
  const auth = useAuth();

  // Hiển thị role label với icon và description
  const getRoleLabel = () => {
    const role = auth.displayRole();
    const icons: Record<string, string> = {
      root: "🔱 Root",
      admin: "👑 Admin",
      manager: "🏢 Manager",
      staff: "👔 Staff",
      customer: "👤 Customer",
    };
    return icons[role] || role;
  };

  const getRoleDescription = () => {
    const role = auth.displayRole();
    const descriptions: Record<string, string> = {
      root: "Super Administrator - Full Access",
      admin: "Administrator - System Management",
      manager: "Manager - Business Operations",
      staff: "Staff - Limited Access",
      customer: "Customer - Shopping Only",
    };
    return descriptions[role] || "Unknown Role";
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="rounded-lg border bg-white p-6 text-slate-800">
        <div className="mb-3">
          <span className="font-medium">Tài khoản:</span>{" "}
          <span className="text-blue-600">{auth.user?.email}</span>
        </div>
        <div className="mb-3">
          <span className="font-medium">Quyền hiện tại:</span>{" "}
          <span className="text-lg font-bold">{getRoleLabel()}</span>
          {auth.isImpersonating && (
            <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              (Đang mạo danh)
            </span>
          )}
        </div>
        <div className="text-sm text-slate-600">{getRoleDescription()}</div>
        {auth.isRoot && !auth.isImpersonating && (
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
            💡 Bạn có thể sử dụng chức năng <strong>Mạo danh</strong> trong
            sidebar để test UX của các vai trò khác.
          </div>
        )}
      </div>
    </div>
  );
}
