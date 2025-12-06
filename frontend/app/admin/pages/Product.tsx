import { useEffect, useState } from "react";
import { api } from "~/lib/api";

type Product = {
  id:number; name:string; price:number; sku?:string;
  category?: { id:number; name:string };
  created_at:string;
};

export default function AdminProducts() {
  const [rows, setRows] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Product[]>(`/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📦 Products</h1>

      <div className="flex gap-2 mb-4">
        <input
          placeholder="Tìm sản phẩm…"
          className="border rounded px-3 py-2"
          value={q} onChange={e=>setQ(e.target.value)}
        />
        <button onClick={load} className="px-4 py-2 rounded bg-blue-600 text-white">Tìm</button>
      </div>

      {loading ? "Đang tải…" : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Tên</th>
                <th className="p-2">Giá</th>
                <th className="p-2">Danh mục</th>
                <th className="p-2">Tạo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.price.toLocaleString()}</td>
                  <td className="p-2">{p.category?.name ?? "-"}</td>
                  <td className="p-2">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
