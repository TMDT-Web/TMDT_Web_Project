import * as React from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

export default function AdminLogin() {
  const nav = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await auth.login(email, password); // <-- phải truyền cả email & password
      nav("/admin");
    } catch (ex: any) {
      setErr(ex?.response?.data?.detail ?? ex?.message ?? "Đăng nhập thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form onSubmit={submit} className="w-[420px] max-w-[96vw] rounded-xl bg-white shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Đăng nhập Quản trị</h1>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="space-y-1">
          <label className="text-sm text-gray-600">Email</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">Mật khẩu</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className={`w-full rounded-md px-3 py-2 font-semibold ${busy ? "bg-gray-300" : "bg-blue-600 text-white hover:bg-blue-700"}`}
        >
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
