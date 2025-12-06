// frontend/app/admin/components/PermissionModal.tsx
import * as React from "react";
import { api } from "~/lib/api";

type Permission = {
  id: number | string;
  code: string;
  name: string;
  allowed: boolean;
  source: "role" | "override-allow" | "override-deny";
};

type Props = {
  userId: number | string;
  userEmail: string;
  open: boolean;
  onClose: () => void;
};

function badge(text: string, cls: string) {
  return <span className={`px-2 py-0.5 text-xs rounded-full border ${cls}`}>{text}</span>;
}

export default function PermissionModal({ userId, userEmail, open, onClose }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [items, setItems] = React.useState<Permission[]>([]);
  const [original, setOriginal] = React.useState<Permission[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ permissions: Permission[] }>(`/users/${userId}/permissions`);
        if (!cancelled) {
          const data = (res.data?.permissions ?? []).map((p) => ({ ...p }));
          setItems(data);
          setOriginal(data);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Không tải được danh sách quyền.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

  const toggle = React.useCallback((idx: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = { ...copy[idx] };
      it.allowed = !it.allowed;
      it.source = it.allowed ? "override-allow" : "override-deny";
      copy[idx] = it;
      return copy;
    });
  }, []);

  const revertLocalChanges = React.useCallback(() => {
    setItems(original.map((p) => ({ ...p })));
  }, [original]);

  const dirty = React.useMemo(() => {
    if (items.length !== original.length) return true;
    for (let i = 0; i < items.length; i++) {
      const a = items[i], b = original[i];
      if (a.id !== b.id || a.allowed !== b.allowed || a.source !== b.source) return true;
    }
    return false;
  }, [items, original]);

  const visible = React.useMemo(() => {
    if (!q.trim()) return items;
    const key = q.trim().toLowerCase();
    return items.filter(
      (p) => p.name.toLowerCase().includes(key) || p.code.toLowerCase().includes(key)
    );
  }, [items, q]);

  const overridePayload = React.useMemo(
    () => items
      .filter((p) => p.source.startsWith("override"))
      .map((p) => ({ permission_id: p.id, allowed: p.allowed })),
    [items]
  );

  const changedCount = React.useMemo(() => {
    let c = 0;
    for (let i = 0; i < items.length; i++) {
      const a = items[i], b = original[i];
      if (a.allowed !== b.allowed || a.source !== b.source) c++;
    }
    return c;
  }, [items, original]);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/users/${userId}/permissions`, { overrides: overridePayload });
      setOriginal(items.map((p) => ({ ...p })));
      onClose();
    } catch (e: any) {
      setError(e?.message || "Lưu permissions thất bại.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-[760px] max-w-[96vw] rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <div className="text-lg font-semibold">Phân quyền chi tiết</div>
            <div className="text-sm text-gray-500">Người dùng: {userEmail}</div>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md border hover:bg-gray-50">
            Đóng
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-b">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên hoặc mã quyền…"
            className="flex-1 rounded-md border px-3 py-1.5 text-sm"
          />
          <button
            onClick={revertLocalChanges}
            disabled={!dirty || saving}
            className={`px-3 py-1.5 rounded-md border text-sm ${
              !dirty || saving ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
            title="Hoàn nguyên các thay đổi chưa lưu"
          >
            Hoàn nguyên
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-sm text-gray-500">Đang tải…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : visible.length === 0 ? (
            <div className="text-sm text-gray-500">Không có quyền phù hợp.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">Quyền</th>
                  <th className="py-2">Mã</th>
                  <th className="py-2 text-center">Cho phép</th>
                  <th className="py-2">Nguồn</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p, _i) => {
                  const idx = items.findIndex((x) => x.id === p.id);
                  return (
                    <tr key={String(p.id)} className="border-t">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2 text-gray-500">{p.code}</td>
                      <td className="py-2 text-center">
                        <input type="checkbox" checked={p.allowed} onChange={() => toggle(idx)} />
                      </td>
                      <td className="py-2">
                        {p.source === "role" && badge("theo vai trò", "bg-gray-100 text-gray-700")}
                        {p.source === "override-allow" &&
                          badge("override: cho phép", "bg-green-100 text-green-700")}
                        {p.source === "override-deny" &&
                          badge("override: chặn", "bg-red-100 text-red-700")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t">
          <div className="text-xs text-gray-500">
            {dirty ? (
              <span>
                Đã chỉnh: <strong>{changedCount}</strong> mục (sẽ gửi phần override).
              </span>
            ) : (
              <span>Không có thay đổi.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-md border hover:bg-gray-50">
              Hủy
            </button>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className={`px-3 py-1.5 rounded-md font-semibold ${
                !dirty || saving
                  ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
