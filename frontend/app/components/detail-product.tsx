import { useState } from "react";
import { Link } from "react-router";

interface ProductVariant {
  id: number;
  name: string; // Ví dụ: "Đen - 120cm - Gỗ sồi"
  attributes: {
    [key: string]: string; // { "Màu sắc": "Đen", "Kích thước": "120cm", "Chất liệu": "Gỗ sồi" }
  };
  available: boolean;
  stock: number;
  priceAdjustment?: number; // Thêm giá so với giá gốc
}

interface ProductDetailProps {
  product: {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    category: string;
    stock: number;
    images: string[];
    variants?: ProductVariant[];
    specifications?: {
      material?: string;
      dimensions?: string;
      weight?: string;
      color?: string;
      warranty?: string;
    };
    rating?: number;
    reviewCount?: number;
  };
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  // Keep a string-backed input value so the user can clear the field while
  // editing. We sync it with `quantity` when a valid number is entered or
  // when +/- buttons are used.
  const [inputValue, setInputValue] = useState(String(quantity));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null
  );

  // Nếu không có ảnh, tạo mảng placeholder
  const displayImages =
    product.images.length > 0 ? product.images : [null, null, null, null]; // 4 ảnh placeholder

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(value, product.stock));
    setQuantity(newQuantity);
    // keep inputValue in sync so the visible input matches the internal value
    setInputValue(String(newQuantity));
  };

  const handlePrevImage = () => {
    setSelectedImage((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImage((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleVariantChange = (variantId: number) => {
    setSelectedVariantId(variantId);
  };

  // Tính giá cuối cùng dựa trên variant đã chọn
  const calculateFinalPrice = () => {
    let finalPrice = product.price;
    if (selectedVariantId && product.variants) {
      const variant = product.variants.find((v) => v.id === selectedVariantId);
      if (variant && variant.priceAdjustment) {
        finalPrice += variant.priceAdjustment;
      }
    }
    return finalPrice;
  };

  const finalPrice = calculateFinalPrice();

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - finalPrice) / product.originalPrice) * 100
      )
    : 0;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600">
            Trang chủ
          </Link>
          <span>›</span>
          <Link to="/products" className="hover:text-blue-600">
            Sản phẩm
          </Link>
          <span>›</span>
          <Link
            to={`/category/${product.category}`}
            className="hover:text-blue-600"
          >
            {product.category}
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        {/* Fullscreen Modal */}
        {isFullscreen && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-50"
            >
              <span className="text-4xl font-bold">×</span>
            </button>

            {/* Fullscreen Carousel */}
            <div className="relative w-full h-full flex items-center justify-center p-12">
              {/* Main Image */}
              <div className="relative max-w-6xl max-h-full">
                {displayImages[selectedImage] ? (
                  <img
                    src={displayImages[selectedImage]}
                    alt={product.name}
                    className="max-w-full max-h-[80vh] object-contain mx-auto"
                  />
                ) : (
                  <div className="w-[80vw] h-[80vh] flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-[200px] leading-none">🪑</div>
                      <div className="text-3xl font-medium mt-4">
                        Hình ảnh sản phẩm
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                  >
                    <span className="text-4xl font-bold">‹</span>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                  >
                    <span className="text-4xl font-bold">›</span>
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                  {displayImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-3 rounded-full transition-all ${
                        selectedImage === index
                          ? "bg-white w-12"
                          : "bg-white/50 hover:bg-white/70 w-3"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Image Counter */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white text-lg font-medium bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm">
                {selectedImage + 1} / {displayImages.length}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 bg-white rounded-2xl shadow-lg p-8">
          {/* Left Column - Images with Carousel */}
          <div>
            {/* Main Image with Carousel Navigation */}
            <div
              className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-4 group cursor-zoom-in"
              onClick={() => setIsFullscreen(true)}
            >
              {displayImages[selectedImage] ? (
                <img
                  src={displayImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-9xl mb-4">🪑</div>
                    <div className="text-xl font-medium text-gray-400">
                      Hình ảnh sản phẩm
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      Click để phóng to
                    </div>
                  </div>
                </div>
              )}

              {/* Zoom Icon */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                🔍 Click để phóng to
              </div>

              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg z-10">
                  -{discount}%
                </div>
              )}

              {/* Carousel Navigation Buttons - Only show on hover */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                  >
                    <span className="text-2xl font-bold">‹</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                  >
                    <span className="text-2xl font-bold">›</span>
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {displayImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(index);
                      }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        selectedImage === index
                          ? "bg-blue-600 w-8"
                          : "bg-white/70 hover:bg-white"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Images Grid */}
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-blue-600 shadow-lg scale-105"
                        : "border-gray-200 hover:border-blue-400"
                    }`}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl">🪑</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-xl ${i < product.rating! ? "text-yellow-400" : "text-gray-300"}`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.rating.toFixed(1)} ({product.reviewCount || 0} đánh
                  giá)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-4xl font-bold text-blue-600">
                  {finalPrice.toLocaleString("vi-VN")}đ
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {product.originalPrice.toLocaleString("vi-VN")}đ
                  </span>
                )}
              </div>
              {discount > 0 && (
                <span className="text-red-600 font-semibold">
                  Tiết kiệm{" "}
                  {(product.originalPrice! - finalPrice).toLocaleString(
                    "vi-VN"
                  )}
                  đ
                </span>
              )}
            </div>

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-3 text-lg">
                  Phân loại sản phẩm
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantChange(variant.id)}
                      disabled={!variant.available}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedVariantId === variant.id
                          ? "border-black bg-blue-50 shadow-lg scale-[1.02] rounded-none"
                          : variant.available
                            ? "border-gray-200 hover:border-black hover:rounded-none hover:shadow-md bg-white"
                            : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div
                            className={`font-bold text-base mb-2 ${
                              selectedVariantId === variant.id
                                ? "text-blue-600"
                                : variant.available
                                  ? "text-gray-900"
                                  : "text-gray-400"
                            }`}
                          >
                            {variant.name}
                            {!variant.available && (
                              <span className="ml-2 text-xs font-normal text-red-500">
                                (Hết hàng)
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {Object.entries(variant.attributes).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span className="text-gray-500">{key}:</span>
                                  <span
                                    className={`font-medium ${
                                      selectedVariantId === variant.id
                                        ? "text-blue-600"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {value}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          {selectedVariantId === variant.id ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div
                              className={`w-6 h-6 rounded-full border-2 ${
                                variant.available
                                  ? "border-gray-300"
                                  : "border-gray-200"
                              }`}
                            />
                          )}
                        </div>
                      </div>
                      {variant.available && variant.stock > 0 && (
                        <div
                          className={`text-xs mt-2 pt-2 border-t ${
                            selectedVariantId === variant.id
                              ? "border-blue-200 text-green-600"
                              : "border-gray-200 text-green-600"
                          }`}
                        >
                          <span className="font-medium">
                            ✓ Còn {variant.stock} sản phẩm
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <span className="text-2xl">✓</span>
                  <span>Còn hàng ({product.stock} sản phẩm)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 font-semibold">
                  <span className="text-2xl">✕</span>
                  <span>Tạm hết hàng</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">
                Số lượng:
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 font-bold text-xl transition-colors"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    value={inputValue}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // chỉ hiển thị chữ số
                      const digits = raw.replace(/\D/g, "");
                      setInputValue(digits);

                      // nếu không có chữ số thì không tác động lên `quantity`
                      if (digits === "") return;

                      const parsed = parseInt(digits, 10);
                      if (!Number.isNaN(parsed)) {
                        handleQuantityChange(parsed);
                      }
                    }}
                    onBlur={() => {
                      if (inputValue === "" || Number.isNaN(Number(inputValue))) {
                        handleQuantityChange(1);
                      } else {
                        const digits = String(inputValue).replace(/\D/g, "");
                        if (digits === "") {
                          handleQuantityChange(1);
                        } else {
                          handleQuantityChange(parseInt(digits, 10));
                        }
                      }
                    }}
                    className="w-20 text-center font-semibold text-lg focus:outline-none"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 font-bold text-xl transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-600">
                  {product.stock} sản phẩm có sẵn
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                disabled={product.stock === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <span className="text-2xl">🛒</span>
                Thêm vào giỏ hàng
              </button>
              <button
                disabled={product.stock === 0}
                className="btn-secondary flex-1 text-center"
              >
                Mua ngay
              </button>
            </div>

            {/* Specifications */}
            {product.specifications && (
              <div className="border-t pt-6">
                <h3 className="font-bold text-xl mb-4">Thông số kỹ thuật:</h3>
                <div className="space-y-3">
                  {product.specifications.material && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Chất liệu:</span>
                      <span className="font-semibold">
                        {product.specifications.material}
                      </span>
                    </div>
                  )}
                  {product.specifications.dimensions && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Kích thước:</span>
                      <span className="font-semibold">
                        {product.specifications.dimensions}
                      </span>
                    </div>
                  )}
                  {product.specifications.weight && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Trọng lượng:</span>
                      <span className="font-semibold">
                        {product.specifications.weight}
                      </span>
                    </div>
                  )}
                  {product.specifications.color && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Màu sắc:</span>
                      <span className="font-semibold">
                        {product.specifications.color}
                      </span>
                    </div>
                  )}
                  {product.specifications.warranty && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Bảo hành:</span>
                      <span className="font-semibold">
                        {product.specifications.warranty}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold mb-4">Mô tả sản phẩm</h2>
          <div className="prose max-w-none text-gray-700 leading-relaxed text-justify">
            {product.description}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚚</span>
            </div>
            <h3 className="font-semibold mb-2">Giao hàng miễn phí</h3>
            <p className="text-sm text-gray-600">Cho đơn hàng trên 500k</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="font-semibold mb-2">Chính hãng 100%</h3>
            <p className="text-sm text-gray-600">Cam kết hàng chính hãng</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">↩️</span>
            </div>
            <h3 className="font-semibold mb-2">Đổi trả 7 ngày</h3>
            <p className="text-sm text-gray-600">Miễn phí đổi trả</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🛡️</span>
            </div>
            <h3 className="font-semibold mb-2">Bảo hành chính hãng</h3>
            <p className="text-sm text-gray-600">Hỗ trợ tận tâm</p>
          </div>
        </div>
      </div>
    </div>
  );
}
