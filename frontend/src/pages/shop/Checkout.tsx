/**
 * Checkout Page - Order checkout with shipping info + Address Selector (FINAL)
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

import { orderService } from "@/services/order.service";
import { PaymentGateway } from "@/types/models";

import AddressSelector from "@/components/address/AddressSelector";
import { formatImageUrl } from "@/utils/format";

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  /** SHIPPING INFO */
  const [shippingName, setShippingName] = useState(user?.full_name || "");
  const [shippingPhone, setShippingPhone] = useState(user?.phone || "");
  const [shippingAddress, setShippingAddress] = useState("");

  /** PAYMENT — USE ENUM EXACTLY AS models.ts */
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>(
    PaymentGateway.COD
  );

  const [notes, setNotes] = useState("");

  /** ORDER SUBMIT */
  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (data) => {
      clearCart();

      if (data.payment?.payment_url) {
        window.location.href = data.payment.payment_url;
      } else {
        alert(
          `Đặt hàng thành công!\nMã đơn hàng: #${data.id}\nTổng tiền: ${data.total_amount.toLocaleString(
            "vi-VN"
          )}₫`
        );
        navigate("/");
      }
    },
    onError: (error: any) => {
      let message = "Đặt hàng thất bại. Vui lòng thử lại!";

      if (error?.response?.data?.detail) {
        const d = error.response.data.detail;

        if (Array.isArray(d))
          message = d
            .map((e) => `${e.loc?.join(".")} - ${e.msg}`)
            .join("\n");
        else if (typeof d === "string") message = d;
        else message = JSON.stringify(d);
      }

      if (error?.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }

      alert(message);
    },
  });

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const shippingFee = totalPrice >= 500000 ? 0 : 30000;
  const finalTotal = totalPrice + shippingFee;

  /** HANDLE SUBMIT */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      alert("Vui lòng chọn hoặc nhập địa chỉ giao hàng!");
      return;
    }

    const payload = {
      full_name: shippingName,
      phone_number: shippingPhone,
      shipping_address: shippingAddress,
      payment_method: paymentGateway, // ENUM OK
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        ...(item.variant && { variant: item.variant }),
      })),
      note: notes.trim() || undefined,
    };

    createOrderMutation.mutate(payload);
  };

  return (
    <div className="section-padding bg-[rgb(var(--color-bg-light))] min-h-screen">
      <div className="container-custom">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT — SHIPPING */}
            <div className="lg:col-span-2 space-y-6">
              {/* SHIPPING INFO */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="font-bold text-xl mb-6">Thông tin giao hàng</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* NAME */}
                  <div>
                    <label className="block text-sm mb-2">Họ và tên *</label>
                    <input
                      required
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  {/* PHONE */}
                  <div>
                    <label className="block text-sm mb-2">Số điện thoại *</label>
                    <input
                      required
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  {/* ADDRESS SELECTOR */}
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2">
                      Địa chỉ giao hàng *
                    </label>
                    <AddressSelector
                      value={shippingAddress}
                      onChange={(v) => setShippingAddress(v)}
                    />
                  </div>

                  {/* NOTES */}
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2">Ghi chú</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="font-bold text-xl mb-6">
                  Phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  {/* COD */}
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))]">
                    <input
                      type="radio"
                      name="payment"
                      value={PaymentGateway.COD}
                      checked={paymentGateway === PaymentGateway.COD}
                      onChange={() =>
                        setPaymentGateway(PaymentGateway.COD)
                      }
                      className="mr-3"
                    />
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </label>

                  {/* MOMO */}
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))]">
                    <input
                      type="radio"
                      name="payment"
                      value={PaymentGateway.MOMO}
                      checked={paymentGateway === PaymentGateway.MOMO}
                      onChange={() =>
                        setPaymentGateway(PaymentGateway.MOMO)
                      }
                      className="mr-3"
                    />
                    <span>Ví MoMo</span>
                  </label>

                  {/* VNPAY */}
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))]">
                    <input
                      type="radio"
                      name="payment"
                      value={PaymentGateway.VNPAY}
                      checked={paymentGateway === PaymentGateway.VNPAY}
                      onChange={() =>
                        setPaymentGateway(PaymentGateway.VNPAY)
                      }
                      className="mr-3"
                    />
                    <span>VNPay</span>
                  </label>

                  {/* BANK TRANSFER */}
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))]">
                    <input
                      type="radio"
                      name="payment"
                      value={PaymentGateway.BANK_TRANSFER}
                      checked={
                        paymentGateway === PaymentGateway.BANK_TRANSFER
                      }
                      onChange={() =>
                        setPaymentGateway(PaymentGateway.BANK_TRANSFER)
                      }
                      className="mr-3"
                    />
                    <span>Chuyển khoản ngân hàng</span>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT — ORDER SUMMARY */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h3 className="font-bold text-xl mb-6">
                  Đơn hàng ({items.length} sản phẩm)
                </h3>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={formatImageUrl(item.product.thumbnail_url)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.product.name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          SL: {item.quantity}
                        </p>
                        <p className="font-medium">
                          {(
                            item.product.price * item.quantity
                          ).toLocaleString("vi-VN")}
                          ₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium">
                      {totalPrice.toLocaleString("vi-VN")}₫
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Phí vận chuyển:
                    </span>
                    <span className="font-medium">
                      {shippingFee === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        `${shippingFee.toLocaleString("vi-VN")}₫`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-lg pt-3 border-t">
                    <span className="font-bold">Tổng cộng:</span>
                    <span className="font-bold text-[rgb(var(--color-wood))] text-2xl">
                      {finalTotal.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {createOrderMutation.isPending
                    ? "Đang xử lý..."
                    : "Đặt hàng"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
