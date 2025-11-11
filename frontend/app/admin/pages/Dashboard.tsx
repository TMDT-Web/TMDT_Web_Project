import * as React from "react";
import { useAuth } from "~/context/AuthContext";

export default function Dashboard() {
  const auth = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="rounded-lg border bg-white p-6 text-slate-800">
        <div>Tài khoản: {auth.user?.email}</div>
        <div>Vai trò hiển thị: {auth.displayRole(auth.user?.roles)}</div>
        {/* hoặc: <div>Vai trò hiển thị: {auth.displayRole()}</div> */}
      </div>
    </div>
  );
}
