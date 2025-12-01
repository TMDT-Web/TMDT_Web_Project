/**
 * Payment Callback Page
 * Handles payment gateway callback (VNPay, Momo)
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { paymentService } from '@/services/payment.service';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract order ID from callback params
        const vnpOrderInfo = searchParams.get('vnp_OrderInfo');
        const momoOrderId = searchParams.get('orderId');
        const vnpResponseCode = searchParams.get('vnp_ResponseCode');

        let extractedOrderId: number | null = null;
        let paymentMethod = '';

        // VNPay callback
        if (vnpOrderInfo) {
          // Extract order ID from OrderInfo (format: "Thanh toán đơn hàng - Order #{order_id}")
          const match = vnpOrderInfo.match(/#(\d+)/);
          if (match) {
            extractedOrderId = parseInt(match[1]);
            paymentMethod = 'vnpay';
          }
        }

        // Momo callback
        if (momoOrderId) {
          extractedOrderId = parseInt(momoOrderId);
          paymentMethod = 'momo';
        }

        if (!extractedOrderId) {
          setStatus('failed');
          setErrorMessage('Không tìm thấy mã đơn hàng');
          return;
        }

        setOrderId(extractedOrderId);

        // Check payment result from gateway response
        if (paymentMethod === 'vnpay' && vnpResponseCode !== '00') {
          setStatus('failed');
          setErrorMessage(`Thanh toán thất bại (Mã: ${vnpResponseCode})`);
          return;
        }

        // Get payment status from server
        const paymentStatus = await paymentService.getPaymentStatus(extractedOrderId);

        if (paymentStatus.is_paid) {
          setStatus('success');
          // Auto-redirect to order details after 3 seconds
          const timer = setTimeout(() => {
            navigate(`/orders/${extractedOrderId}`);
          }, 3000);
          return () => clearTimeout(timer);
        } else {
          setStatus('pending');
          setErrorMessage('Thanh toán đang chờ xử lý');
        }
      } catch (error) {
        console.error('Error processing payment callback:', error);
        setStatus('failed');
        setErrorMessage('Lỗi khi xử lý kết quả thanh toán');
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang xác nhận thanh toán</h2>
          <p className="text-gray-600">Vui lòng chờ...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Thanh toán thành công!</h1>
          <p className="text-gray-600 mb-6">
            Đơn hàng #{orderId} đã được xác nhận. Chuyển hướng đến trang đơn hàng...
          </p>
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="btn-primary w-full"
          >
            Xem chi tiết đơn hàng
          </button>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Thanh toán thất bại</h1>
          <p className="text-gray-600 mb-6">
            {errorMessage || 'Có lỗi xảy ra trong quá trình thanh toán'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/cart')}
              className="btn-primary w-full"
            >
              Quay lại giỏ hàng
            </button>
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="btn-secondary w-full"
            >
              Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pending status
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="h-10 w-10 text-yellow-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-yellow-600 mb-2">Thanh toán đang chờ xử lý</h1>
        <p className="text-gray-600 mb-6">
          {errorMessage || 'Đơn hàng của bạn đang chờ xác nhận từ cổng thanh toán'}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="btn-primary w-full"
          >
            Xem chi tiết đơn hàng
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="btn-secondary w-full"
          >
            Xem tất cả đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
