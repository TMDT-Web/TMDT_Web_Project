import { useEffect, useState } from "react";
import ProductDetail from "../components/detail-product";
import { getProduct } from "../lib/products";
import type { Product } from "../lib/types";
import type { Route } from "./+types/products.$id";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Chi tiết sản phẩm - Nội Thất 24h` },
    { name: "description", content: "Xem chi tiết sản phẩm nội thất" },
  ];
}

export default function ProductDetailPage({ params }: Route.ComponentProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Chi tiết sản phẩm - Nội Thất 24h";

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProduct(parseInt(params.id));
        setProduct(data);
        // Update title with product name
        document.title = `${data.name} - Nội Thất 24h`;
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || "Không tìm thấy sản phẩm"}
          </h2>
          <p className="text-gray-600 mb-6">
            Sản phẩm không tồn tại hoặc đã bị xóa.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay về trang chủ
          </a>
        </div>
      </div>
    );
  }

  // Transform API data to match ProductDetail component props
  const productData = {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: undefined, // Backend doesn't have originalPrice yet
    description: product.description || "Chưa có mô tả chi tiết",
    category: product.category?.name || "Chưa phân loại",
    stock: product.stock_quantity,
    images: product.images
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      .map((img) => img.file_path),
    variants: undefined, // Backend doesn't have variants yet
    specifications: product.specifications || {},
    rating: undefined, // Backend doesn't have rating yet
    reviewCount: undefined,
  };

  return <ProductDetail product={productData} />;
}
