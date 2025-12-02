/**
 * Checkout Page - Order checkout with shipping info + Address Selector (FINAL)
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

import { orderService } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { PaymentGateway } from "@/types/models";

import AddressSelector from "@/components/AddressSelector";
import { formatImageUrl } from "@/utils/format";
import { userService } from "@/services/user.service";

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  /** SHIPPING INFO */
  const [shippingName, setShippingName] = useState(user?.full_name || "");
  const [shippingPhone, setShippingPhone] = useState(user?.phone || "");
  const [shippingAddress, setShippingAddress] = useState({
    city: '',
    district: '',
    ward: '',
    address_line: ''
  });

  /** PAYMENT — USE ENUM EXACTLY AS models.ts */
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>(
    PaymentGateway.COD
  );

  /** BANK SELECTION */
  const [selectedBank, setSelectedBank] = useState("vietcombank");
  
  const banks = [
    { id: "vietcombank", name: "Vietcombank", logo: "vietcombank.png" },
    { id: "techcombank", name: "Techcombank", logo: "techcombank.png" },
    { id: "mbbank", name: "MB Bank", logo: "mbbank.png" },
    { id: "bidv", name: "BIDV", logo: "bidv.png" },
    { id: "agribank", name: "Agribank", logo: "agribank.png" },
    { id: "vietinbank", name: "VietinBank", logo: "vietinbank.png" },
    { id: "tpbank", name: "TPBank", logo: "tpbank.png" },
  ];

  const [notes, setNotes] = useState("");

  // Fetch user addresses to pre-fill default address
  const { data: addresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: userService.getAddresses,
    enabled: !!user
  });

  // Auto-fill shipping address from default address
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find(addr => addr.is_default) || addresses[0];
      if (defaultAddr) {
        setShippingAddress({
          city: defaultAddr.city,
          district: defaultAddr.district,
          ward: defaultAddr.ward || '',
          address_line: defaultAddr.address_line
        });
      }
    }
  }, [addresses]);

  /** ORDER SUBMIT */
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      // Create order first
      const order = await orderService.createOrder(orderData);
      
      // Handle payment gateway redirection
      if (order.payment_method === PaymentGateway.VNPAY) {
        const response = await paymentService.initVNPayPayment(order.id);
        if (response.success && response.payment_url) {
          // Redirect to VNPay
          window.location.href = response.payment_url;
        }
      } else if (order.payment_method === PaymentGateway.MOMO) {
        const response = await paymentService.initMomoPayment(order.id);
        if (response.success && response.payment_url) {
          // Redirect to Momo
          window.location.href = response.payment_url;
        }
      }
      
      return order;
    },
    onSuccess: (data) => {
      clearCart();

      // Handle different payment methods
      if (data.payment_method === PaymentGateway.COD) {
        toast.success(
          `Đặt hàng thành công! Mã đơn hàng: #${data.id}. Tổng tiền: ${data.total_amount.toLocaleString("vi-VN")}₫`
        );
        navigate(`/orders`);
      } else if (data.payment_method === PaymentGateway.MOMO) {
        // Redirect to QR payment with Momo selected
        navigate(`/payment/qr?order_id=${data.id}&amount=${data.total_amount}&method=momo`);
      } else if (data.payment_method === PaymentGateway.VNPAY) {
        // Redirect to QR payment with VNPay selected
        navigate(`/payment/qr?order_id=${data.id}&amount=${data.total_amount}&method=vnpay`);
      } else if (data.payment_method === PaymentGateway.BANK_TRANSFER) {
        // Redirect to QR payment with Bank Transfer selected
        navigate(`/payment/qr?order_id=${data.id}&amount=${data.total_amount}&method=bank`);
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
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        navigate("/login");
        return;
      }

      toast.error(message);
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

    // Validate structured address
    if (!shippingAddress.city || !shippingAddress.district || !shippingAddress.address_line) {
      toast.warning("Vui lòng điền đầy đủ thông tin địa chỉ giao hàng!");
      return;
    }

    // Combine address into a single string
    const fullAddress = [
      shippingAddress.address_line,
      shippingAddress.ward,
      shippingAddress.district,
      shippingAddress.city
    ].filter(Boolean).join(', ');

    const payload = {
      full_name: shippingName,
      phone_number: shippingPhone,
      shipping_address: fullAddress,
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
                      required={true}
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
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))]">
                    <input
                      type="radio"
                      name="payment"
                      value={PaymentGateway.COD}
                      checked={paymentGateway === PaymentGateway.COD}
                      onChange={() =>
                        setPaymentGateway(PaymentGateway.COD)
                      }
                      className="mr-1"
                    />
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))]">
                    <input
                      type="radio"
                      name="payment"
                      value={PaymentGateway.MOMO}
                      checked={paymentGateway === PaymentGateway.MOMO}
                      onChange={() =>
                        setPaymentGateway(PaymentGateway.MOMO)
                      }
                      className="mr-1"
                    />
                    <img
                      src={(() => {
                        try {
                          const url = new URL('../../assets/momo.png', import.meta.url).href;
                          return url;
                        } catch {
                          return '/payments/momo.png';
                        }
                      })()}
                      alt="MoMo"
                      className="w-7 h-7 object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span>Ví MoMo</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-[rgb(var(--color-wood))]">
                    <input
                      type="radio"
                      name="payment"
                      value={PaymentGateway.VNPAY}
                      checked={paymentGateway === PaymentGateway.VNPAY}
                      onChange={() =>
                        setPaymentGateway(PaymentGateway.VNPAY)
                      }
                      className="mr-1"
                    />
                    <img
                      src={(() => {
                        try {
                          const url = new URL('../../assets/vnpay.png', import.meta.url).href;
                          return url;
                        } catch {
                          return '/payments/vnpay.png';
                        }
                      })()}
                      alt="VNPay"
                      className="w-7 h-7 object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span>VNPay QR</span>
                  </label>

                  <div className="border-2 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer hover:text-[rgb(var(--color-wood))]">
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
                        className="mr-1"
                      />
                      <img
                        src={(() => {
                          try {
                            const url = new URL('../../assets/bank.png', import.meta.url).href;
                            return url;
                          } catch {
                            return '/payments/bank.png';
                          }
                        })()}
                        alt="Bank"
                        className="w-7 h-7 object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span>Chuyển khoản ngân hàng</span>
                    </label>

                    {paymentGateway === PaymentGateway.BANK_TRANSFER && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="block text-sm font-medium mb-3">
                          Chọn ngân hàng
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {banks.map((bank) => (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={() => setSelectedBank(bank.id)}
                              className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 hover:border-[rgb(var(--color-wood))] transition-colors ${
                                selectedBank === bank.id
                                  ? "border-[rgb(var(--color-wood))] bg-[rgb(var(--color-wood))]/5"
                                  : "border-gray-200"
                              }`}
                            >
                              <img
                                src={(() => {
                                  try {
                                    const url = new URL(`../../assets/banks/${bank.logo}`, import.meta.url).href;
                                    return url;
                                  } catch {
                                    return `/banks/${bank.logo}`;
                                  }
                                })()}
                                alt={bank.name}
                                className="w-12 h-12 object-contain"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                              <span className="text-xs text-center">
                                {bank.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
