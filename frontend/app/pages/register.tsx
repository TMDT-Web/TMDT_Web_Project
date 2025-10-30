import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fullNameRef = useRef<HTMLInputElement | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmRef = useRef<HTMLInputElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);

  const handleForwardTab = (e: any, nextRef?: { current: HTMLElement | null }) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    nextRef?.current?.focus();
  };

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

  // Clear form fields only when the page was fully reloaded
  useEffect(() => {
    if (isPageReload()) {
      setFullName("");
      setUsername("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "Đăng ký tài khoản ";
    return () => {
      document.title = prev;
    };
  }, []);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim() || !phone.trim() || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      // focus first empty field
      if (!fullName.trim()) {
        fullNameRef.current?.focus();
      } else if (!username.trim()) {
        usernameRef.current?.focus();
      } else if (!phone.trim()) {
        phoneRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    const phoneDigits = phone.trim();
    if (!/^0\d{9}$/.test(phoneDigits)) {
      toast.error("Số điện thoại không hợp lệ.");
      phoneRef.current?.focus();
      return;
    }

    if (password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự.");
      passwordRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu và xác nhận mật khẩu không khớp.");
      confirmRef.current?.focus();
      return;
    }

  // TODO: send registration data to backend
  toast.success(`Đăng ký thành công (giả lập)\nTài khoản: ${username}\nSố điện thoại: ${phoneDigits}`);

  // redirect to login and prefill username + password
  // small delay so toast is visible briefly
  setTimeout(() => {
    navigate("/auth/login", { state: { username, password } });
  }, 700);
  };

  return (
    <div className="flex md:justify-end justify-center items-center min-h-screen bg-[url('./asset/img/bg-login-register.jpg')] bg-cover bg-center">
      <div className="bg-white/10 md:bg-transparent md:bg-gradient-to-l md:from-white/70 md:via-white/20 md:to-transparent p-10 md:px-16 md:py-12 md:rounded-none rounded-xl md:shadow-none shadow-lg w-full md:w-1/2 lg:w-1/3 h-auto md:h-screen flex flex-col justify-center max-w-md md:max-w-none">
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          Đăng ký
        </h2>

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-100 text-sm font-semibold mb-2">
                Tên người dùng
              </label>
              <input
                ref={fullNameRef}
                type="text"
                placeholder="Tên người dùng"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => handleForwardTab(e, usernameRef)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-100 text-sm font-semibold mb-2">
              Tên tài khoản
            </label>
            <input
              ref={usernameRef}
              type="text"
              placeholder="Tên tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => handleForwardTab(e, phoneRef)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-100 text-sm font-semibold mb-2">
              Số điện thoại
            </label>
            <input
              ref={phoneRef}
              type="tel"
              inputMode="tel"
              
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
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
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => handleForwardTab(e, confirmRef)}
                className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                minLength={8}
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
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
          </div>

          <div>
            <label className="block text-gray-100 text-sm font-semibold mb-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                ref={confirmRef}
                type={showConfirm ? "text" : "password"}
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => handleForwardTab(e, submitRef)}
                className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                minLength={8}
              />

              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
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
          </div>

          <button
            type="submit"
            ref={submitRef}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                fullNameRef.current?.focus();
              }
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold text-lg shadow-md hover:shadow-lg"
          >
            Đăng ký
          </button>
        </form>

        <p className="text-center text-sm text-gray-200 mt-6">
          Bạn đã có tài khoản?
          <Link to="/auth/login" className="text-indigo-600 hover:underline font-semibold">
            Đăng nhập
          </Link>
        </p>

        <Link to="/" className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-semibold shadow-sm backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}
