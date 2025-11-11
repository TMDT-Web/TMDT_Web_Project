// frontend/app/pages/auth/login.tsx
import * as React from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

export default function LoginPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await auth.login(email, password);
      nav("/admin/dashboard");
    } catch (err: any) {
      setError(err?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] grid place-content-center">
      <form onSubmit={submit} className="w-[380px] max-w-[92vw] bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">Đăng nhập</h1>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

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
          className="w-full rounded-md bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
