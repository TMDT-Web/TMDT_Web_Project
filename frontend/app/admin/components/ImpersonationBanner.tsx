// frontend/app/admin/components/ImpersonationBanner.tsx
import { useAuth } from "~/context/AuthContext";

/**
 * Banner cảnh báo khi Root đang mạo danh role khác
 * Hiển thị ở top của mọi trang admin
 */
export function ImpersonationBanner() {
  const auth = useAuth();

  if (!auth.isImpersonating) return null;

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 border-b-4 border-yellow-600 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
              <span className="text-2xl">👁️</span>
            </div>
            <div>
              <div className="font-bold text-white text-lg flex items-center gap-2">
                <span>Chế độ Mạo danh (Impersonation)</span>
                <span className="px-2 py-0.5 bg-white/30 rounded text-sm">
                  {auth.state.impersonatedRole?.toUpperCase()}
                </span>
              </div>
              <div className="text-yellow-100 text-sm">
                Bạn đang xem giao diện dưới vai trò{" "}
                <strong>{auth.state.impersonatedRole}</strong>. Mọi hành động
                được ghi nhận dưới tên Root.
              </div>
            </div>
          </div>
          <button
            onClick={auth.stopImpersonation}
            className="px-5 py-2.5 rounded-xl bg-white text-amber-700 font-bold hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span>🔙</span>
            <span>Quay lại Root</span>
          </button>
        </div>
      </div>
    </div>
  );
}
