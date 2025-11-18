import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Trang chủ";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Sản phẩm nổi bật</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded p-4">Card demo 1</div>
        <div className="border rounded p-4">Card demo 2</div>
        <div className="border rounded p-4">Card demo 3</div>
        <div className="border rounded p-4">Card demo 4</div>
      </div>
    </div>
  );
}
