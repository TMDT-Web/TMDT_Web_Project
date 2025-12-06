import ProductDetail from "../components/detail-product";
import type { Route } from "./+types/products.$id";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Chi tiết sản phẩm - Nội Thất 24h` },
    { name: "description", content: "Xem chi tiết sản phẩm nội thất" },
  ];
}

export default function ProductDetailPage({ params }: Route.ComponentProps) {
  // TODO: Fetch từ API dựa trên params.id
  const mockProduct = {
    id: parseInt(params.id),
    name: "Bàn làm việc gỗ sồi hiện đại",
    price: 2500000,
    originalPrice: 3500000,
    description: `
      Bàn làm việc gỗ sồi hiện đại là sự lựa chọn hoàn hảo cho không gian làm việc của bạn. 
      Thiết kế tối giản nhưng vô cùng tinh tế, bàn được làm từ gỗ sồi tự nhiên cao cấp, 
      mang lại độ bền vượt trội và vẻ đẹp sang trọng cho căn phòng.

      ✨ Đặc điểm nổi bật:
      • Chất liệu gỗ sồi tự nhiên 100% nhập khẩu
      • Thiết kế hiện đại, phù hợp mọi không gian
      • Bề mặt chống trầy xước, chống nước
      • Ngăn kéo lớn tiện lợi để đồ
      • Lắp ráp dễ dàng với hướng dẫn chi tiết

      🎯 Phù hợp với:
      • Văn phòng làm việc tại nhà
      • Phòng làm việc công ty
      • Phòng học sinh viên
      • Không gian đọc sách, học tập

      📦 Giao hàng và lắp đặt:
      • Giao hàng toàn quốc, miễn phí nội thành
      • Hỗ trợ lắp đặt tận nơi
      • Bảo hành 24 tháng
    `,
    category: "Bàn làm việc",
    stock: 15,
    images: [
      // Khi tích hợp API, đây sẽ là URL thực
      // Hiện tại để trống để dùng placeholder
    ],
    variants: [
      {
        id: 1,
        name: "Nhỏ - Nâu - Gỗ sồi",
        attributes: {
          "Kích thước": "100cm x 50cm",
          "Màu sắc": "Nâu gỗ tự nhiên",
          "Chất liệu": "Gỗ sồi tự nhiên",
        },
        available: true,
        stock: 10,
        priceAdjustment: -300000,
      },
      {
        id: 2,
        name: "Trung - Nâu - Gỗ sồi",
        attributes: {
          "Kích thước": "120cm x 60cm",
          "Màu sắc": "Nâu gỗ tự nhiên",
          "Chất liệu": "Gỗ sồi tự nhiên",
        },
        available: true,
        stock: 15,
        priceAdjustment: 0,
      },
      {
        id: 3,
        name: "Lớn - Nâu - Gỗ sồi",
        attributes: {
          "Kích thước": "140cm x 70cm",
          "Màu sắc": "Nâu gỗ tự nhiên",
          "Chất liệu": "Gỗ sồi tự nhiên",
        },
        available: true,
        stock: 8,
        priceAdjustment: 500000,
      },
      {
        id: 4,
        name: "Trung - Trắng - Gỗ sồi",
        attributes: {
          "Kích thước": "120cm x 60cm",
          "Màu sắc": "Trắng",
          "Chất liệu": "Gỗ sồi tự nhiên",
        },
        available: true,
        stock: 12,
        priceAdjustment: 200000,
      },
      {
        id: 5,
        name: "Trung - Đen - Gỗ sồi",
        attributes: {
          "Kích thước": "120cm x 60cm",
          "Màu sắc": "Đen",
          "Chất liệu": "Gỗ sồi tự nhiên",
        },
        available: true,
        stock: 7,
        priceAdjustment: 200000,
      },
      {
        id: 6,
        name: "Trung - Nâu - Gỗ công nghiệp",
        attributes: {
          "Kích thước": "120cm x 60cm",
          "Màu sắc": "Nâu gỗ tự nhiên",
          "Chất liệu": "Gỗ công nghiệp",
        },
        available: true,
        stock: 20,
        priceAdjustment: -500000,
      },
      {
        id: 7,
        name: "Lớn - Trắng - Gỗ sồi",
        attributes: {
          "Kích thước": "140cm x 70cm",
          "Màu sắc": "Trắng",
          "Chất liệu": "Gỗ sồi tự nhiên",
        },
        available: false,
        stock: 0,
        priceAdjustment: 700000,
      },
    ],
    specifications: {
      material: "Gỗ sồi tự nhiên",
      dimensions: "120cm x 60cm x 75cm (DxRxC)",
      weight: "25kg",
      color: "Nâu gỗ tự nhiên",
      warranty: "24 tháng",
    },
    rating: 4.5,
    reviewCount: 127,
  };

  return <ProductDetail product={mockProduct} />;
}
