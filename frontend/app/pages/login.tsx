import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { toast } from "react-toastify";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);

  const isPageReload = () => {
    try {
      const navEntries = (window.performance && (window.performance as any).getEntriesByType)
        ? (window.performance as any).getEntriesByType('navigation') as PerformanceNavigationTiming[]
        : null;
      if (navEntries && navEntries.length > 0) {
        return navEntries[0].type === 'reload';
      }
      // fallback for older browsers
      // @ts-ignore
      if ((window.performance as any).navigation) {
        // @ts-ignore
        return (window.performance as any).navigation.type === 1;
      }
    } catch (err) {
      // ignore
    }
    return false;
  };

  // Clear fields only when the user performed a full page reload.
  useEffect(() => {
    if (isPageReload()) {
      setUsername("");
      setPassword("");
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleForwardTab = (e: any, nextRef?: { current: HTMLElement | null }) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    nextRef?.current?.focus();
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    // validate empty fields and show toast errors
    if (!username.trim()) {
      toast.error("Tên tài khoản không được trống.");
      usernameRef.current?.focus();
      return;
    }
    if (!password.trim()) {
      toast.error("Mật khẩu không được trống.");
      passwordRef.current?.focus();
      return;
    }

    // placeholder for real login action
    toast.success(`Đang thử đăng nhập...`);
  };

  // Set page title while on login page
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Đăng nhập tài khoản";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  // Prefill from navigation state (e.g., after successful registration)
  useEffect(() => {
    if (location && (location as any).state) {
      const state = (location as any).state as { username?: string; password?: string };
      if (state.username) setUsername(state.username);
      if (state.password) setPassword(state.password);
    }
  }, [location]);

  return (
    <div className="flex md:justify-end justify-center items-center min-h-screen bg-[url('./asset/img/bg-login-register.jpg')] bg-cover bg-center">
      <div className="bg-white/10 md:bg-transparent md:bg-gradient-to-l md:from-white/70 md:via-white/20 md:to-transparent p-10 md:px-16 md:py-12 md:rounded-none rounded-xl md:shadow-none shadow-lg w-full md:w-1/2 lg:w-1/3 h-auto md:h-screen flex flex-col justify-center max-w-md md:max-w-none">
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          Đăng nhập
        </h2>

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-100 text-sm font-semibold mb-2">
              Tên tài khoản
            </label>
            <input
              type="text"
              placeholder="Tên tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              ref={usernameRef}
              onKeyDown={(e) => handleForwardTab(e, passwordRef)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-100 text-sm font-semibold mb-2">
              Mật khẩu
            </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  ref={passwordRef}
                  onKeyDown={(e) => handleForwardTab(e, submitRef)}
                  className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            <div className="text-right mt-2">
              <a href="#" className="text-sm text-indigo-600 hover:underline font-medium">
                Quên mật khẩu?
              </a>
            </div>
          </div>

          <button
            type="submit"
            ref={submitRef}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                usernameRef.current?.focus();
              }
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold text-lg shadow-md hover:shadow-lg"
          >
            Đăng nhập
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-400/60"></div>
          <span className="text-gray-300 text-sm font-medium">hoặc</span>
          <div className="flex-1 h-px bg-gray-400/60"></div>
        </div>

        <Link
          to="http://localhost:8000/api/auth/google/login"
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition font-semibold shadow-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Đăng nhập bằng Google
        </Link>

        <p className="text-center text-sm text-gray-200 mt-6">
          Chưa có tài khoản? 
          <Link to="/auth/register" className="text-indigo-600 hover:underline font-semibold">
            Đăng ký
          </Link>
        </p>

        <Link
          to="/"
          className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-semibold shadow-sm backdrop-blur-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}