import * as React from "react";
import { useParams } from "react-router";
import { api } from "~/lib/api";

type ProductRead = {
  id: number | string;
  name?: string;
  title?: string;              // phòng khi backend dùng "title"
  price?: number;
  description?: string | null;
  images?: string[];           // nếu có mảng ảnh
  image_url?: string;          // nếu chỉ có 1 ảnh
  category?: { id: number | string; name?: string };
  [k: string]: any;            // nới lỏng để không vỡ type
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = React.useState<ProductRead | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    async function load() {
      try {
        if (!id) throw new Error("Thiếu id sản phẩm");
        // Backend FastAPI của bạn đang mount ở /api, api.get đã tự thêm prefix "/api"
        const res = await api.get<ProductRead>(`/products/${id}`);
        if (alive) setData(res);
      } catch (err: any) {
        if (alive) setError(err?.message || "Lỗi tải sản phẩm");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="p-6">Đang tải sản phẩm...</div>;
  if (error)   return <div className="p-6 text-red-600">Lỗi: {error}</div>;
  if (!data)   return <div className="p-6">Không tìm thấy sản phẩm.</div>;

  const displayName = data.name ?? data.title ?? `Sản phẩm #${data.id}`;
  const firstImage =
    (Array.isArray(data.images) && data.images.length > 0 && data.images[0]) ||
    data.image_url ||
    "";

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="w-full">
        {firstImage ? (
          <img
            src={firstImage}
            alt={displayName}
            className="w-full h-auto rounded-lg border"
          />
        ) : (
          <div className="w-full aspect-video rounded-lg border grid place-items-center text-gray-500">
            Chưa có ảnh
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-3">{displayName}</h1>
        <div className="text-gray-600 mb-4">
          Mã: <span className="font-mono">{String(data.id)}</span>
        </div>

        {typeof data.price !== "undefined" && (
          <div className="text-xl font-bold mb-4">
            {new Intl.NumberFormat("vi-VN").format(Number(data.price))} ₫
          </div>
        )}

        {data.description && (
          <p className="text-gray-700 leading-relaxed mb-6">
            {data.description}
          </p>
        )}

        {data.category?.name && (
          <div className="text-sm text-gray-500 mb-6">
            Danh mục: {data.category.name}
          </div>
        )}

        {/* Tạm thời đặt nút, sẽ nối cart sau */}
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
            Thêm vào giỏ
          </button>
          <button className="px-4 py-2 rounded border hover:bg-gray-50">
            Mua ngay
          </button>
        </div>

        {/* Debug nhanh: hiện toàn bộ JSON để đối chiếu schema backend */}
        <pre className="mt-8 text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
