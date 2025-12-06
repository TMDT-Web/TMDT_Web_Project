import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { getCartItems, clearCart } from "../lib/cart";
import { createOrder } from "../lib/orders";
import { getCurrentUser, getAccessToken } from "../lib/auth";
import type { CartItem } from "../lib/cart";

export default function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập");
        navigate("/auth/login");
        return;
      }

      const [items, user] = await Promise.all([
        getCartItems(),
        getCurrentUser(token),
      ]);

      setCartItems(items);
      
      // Load addresses (you need to implement this API call)
      // For now, using mock data
      setAddresses([]);
      
    } catch (error: any) {
      toast.error(error.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
      });

      await clearCart();
      toast.success("Đặt hàng thành công!");
      navigate(`/orders/${order.id}`);
    } catch (error: any) {
      toast.error(error.message || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bronze mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">
          Thanh toán
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Địa chỉ giao hàng
              </h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Bạn chưa có địa chỉ giao hàng
                  </p>
                  <button
                    onClick={() => navigate("/account/addresses")}
                    className="btn-primary"
                  >
                    Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr: any) => (
                    <label
                      key={addr.id}
                      className={`block p-4 border rounded-lg cursor-pointer ${
                        selectedAddressId === addr.id
                          ? "border-bronze bg-bronze/5"
                          : "border-gray-300 hover:border-bronze"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mr-3"
                      />
                      <span className="font-medium">{addr.label}</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {addr.street}, {addr.city}
                      </p>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Phương thức thanh toán
              </h2>

              <div className="space-y-3">
                <label className="block p-4 border rounded-lg cursor-pointer border-gray-300 hover:border-bronze">
                  <input
                    type="radio"
                    name="payment"
                    value="CREDIT_CARD"
                    checked={paymentMethod === "CREDIT_CARD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium">Thẻ tín dụng/ghi nợ</span>
                </label>

                <label className="block p-4 border rounded-lg cursor-pointer border-gray-300 hover:border-bronze">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">
                Đơn hàng của bạn
              </h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product.image_url || "https://via.placeholder.com/60"}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        SL: {item.quantity} × {item.product.price.toLocaleString("vi-VN")}₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider-luxury my-4"></div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{calculateTotal().toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>Miễn phí</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Tổng cộng</span>
                  <span className="text-bronze">
                    {calculateTotal().toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={submitting || !selectedAddressId}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang xử lý..." : "Đặt hàng"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
