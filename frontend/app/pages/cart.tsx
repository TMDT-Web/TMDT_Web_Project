import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { getCartItems, updateCartItem, removeCartItem, clearCart } from "../lib/cart";
import { isAuthenticated } from "../lib/auth";
import type { CartItem } from "../lib/cart";

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error("Vui lòng đăng nhập để xem giỏ hàng");
      navigate("/auth/login", { state: { from: "/cart" } });
      return;
    }

    loadCart();
  }, [navigate]);

  const loadCart = async () => {
    try {
      const items = await getCartItems();
      setCartItems(items);
    } catch (error: any) {
      console.error("Error loading cart:", error);
      toast.error(error.message || "Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await updateCartItem(itemId, { quantity: newQuantity });
      setCartItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
      toast.success("Đã cập nhật số lượng");
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật");
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await removeCartItem(itemId);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      toast.success("Đã xóa sản phẩm");
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa");
    }
  };

  const handleClearCart = async () => {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) return;

    try {
      await clearCart();
      setCartItems([]);
      toast.success("Đã xóa toàn bộ giỏ hàng");
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bronze mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <svg
            className="w-24 h-24 mx-auto mb-6 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">
            Giỏ hàng trống
          </h2>
          <p className="text-gray-600 mb-8">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <Link
            to="/products"
            className="btn-primary inline-block"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Giỏ hàng của bạn
          </h1>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-6 flex gap-6"
              >
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <img
                    src={item.product.image_url || "https://via.placeholder.com/150"}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-grow">
                  <Link
                    to={`/products/${item.product.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-bronze"
                  >
                    {item.product.name}
                  </Link>
                  {item.product.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {item.product.description}
                    </p>
                  )}
                  <p className="text-lg font-bold text-bronze mt-2">
                    {item.product.price.toLocaleString("vi-VN")}₫
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  <div className="flex items-center gap-3 border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-gray-100"
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-lg font-bold text-gray-900">
                    {(item.product.price * item.quantity).toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính ({cartItems.length} sản phẩm)</span>
                  <span>{calculateTotal().toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>Miễn phí</span>
                </div>
                <div className="divider-luxury my-4"></div>
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Tổng cộng</span>
                  <span className="text-bronze">
                    {calculateTotal().toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="btn-primary w-full block text-center mb-4"
              >
                Tiến hành thanh toán
              </Link>

              <Link
                to="/products"
                className="btn-secondary w-full block text-center"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
