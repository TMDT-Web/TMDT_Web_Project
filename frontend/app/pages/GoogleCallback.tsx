import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { saveTokens } from "../lib/auth";

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Parse tokens from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const isNewUser = params.get("is_new_user") === "true";

    if (accessToken && refreshToken) {
      // Save tokens to localStorage
      saveTokens({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "bearer",
      });

      // Show success message
      if (isNewUser) {
        toast.success("Đăng ký thành công với Google!");
      } else {
        toast.success("Đăng nhập thành công!");
      }

      // Redirect to home page
      setTimeout(() => {
        navigate("/");
      }, 500);
    } else {
      toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.");
      navigate("/auth/login");
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
