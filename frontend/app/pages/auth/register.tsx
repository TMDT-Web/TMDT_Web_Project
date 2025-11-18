// frontend/app/pages/auth/register.tsx
import * as React from "react";
import { useNavigate } from "react-router";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

export default function RegisterPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await api.post("/auth/register", { email, password, full_name: fullName });
      await auth.login(email, password);
      nav("/admin/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] grid place-content-center">
      <form onSubmit={submit} className="w-[420px] max-w-[92vw] bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">Đăng ký</h1>
        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

        <label className="block text-sm mb-2">
          Họ tên
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>

        <label className="block text-sm mb-2">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>

        <label className="block text-sm mb-4">
          Mật khẩu
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>

        <button
          disabled={loading}
          className="w-full rounded-md bg-green-600 py-2 font-semibold text-white hover:bg-green-700"
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>
      </form>
    </div>
  );
}
