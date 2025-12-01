import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import '@/styles/QRConfirm.css';

export const QRConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = parseInt(searchParams.get('order_id') || '0');

  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string>('');
  const [autoConfirming, setAutoConfirming] = useState(true);

  // Auto-confirm on page load
  useEffect(() => {
    if (orderId && autoConfirming) {
      handleConfirmPayment();
    }
  }, [orderId]);

  const handleConfirmPayment = async () => {
    if (!orderId) {
      setError('Mã đơn hàng không hợp lệ');
      setAutoConfirming(false);
      return;
    }

    try {
      setLoading(true);
      // Call API directly without auth (public endpoint)
      const response = await api.post('/api/v1/payments/qr/confirm', {
        order_id: orderId
      });
      
      if (response.data.success) {
        setConfirmed(true);
        setAutoConfirming(false);
        // Auto-close or show success message
        setTimeout(() => {
          window.close(); // Try to close if opened in new tab
        }, 3000);
      } else {
        setError(response.data.message || 'Xác nhận thanh toán thất bại');
        setAutoConfirming(false);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Lỗi xác nhận thanh toán';
      setError(errMsg);
      setAutoConfirming(false);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Success state - mobile only
  if (confirmed) {
    return (
      <div className="qr-confirm-container mobile-only success">
        <div className="confirm-card">
          <div className="success-animation">
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
                <div className="icon-circle"></div>
                <div className="icon-fix"></div>
              </div>
            </div>
          </div>
          <h1>Thanh toán thành công!</h1>
          <div className="success-details">
            <div className="order-badge">
              <span className="badge-label">Mã đơn hàng</span>
              <span className="badge-value">#{orderId}</span>
            </div>
            <p className="success-message">
              Đơn hàng của bạn đã được xác nhận và đang được xử lý.
            </p>
          </div>
          <div className="success-actions">
            <p className="auto-close-msg">
              <span className="pulse-dot"></span>
              Trang này sẽ tự động đóng sau 3 giây
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || autoConfirming) {
    return (
      <div className="qr-confirm-container mobile-only">
        <div className="confirm-card loading">
          <div className="loading-animation">
            <div className="payment-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <div className="loading-spinner"></div>
          </div>
          <h1>Đang xử lý thanh toán...</h1>
          <p className="loading-text">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="qr-confirm-container mobile-only error">
        <div className="confirm-card">
          <div className="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1>Thanh toán thất bại</h1>
          <div className="error-details">
            <p className="error-message">{error}</p>
          </div>
          <div className="error-actions">
            <button className="retry-button" onClick={handleConfirmPayment}>
              Thử lại
            </button>
            <button className="back-button" onClick={() => window.close()}>
              Đóng trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial state (shouldn't show since auto-confirming)
  return (
    <div className="qr-confirm-container mobile-only">
      <div className="confirm-card">
        <div className="payment-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </div>
        <h1>Xác nhận thanh toán</h1>
        <div className="order-info-mobile">
          <span className="order-label">Mã đơn hàng</span>
          <span className="order-number">#{orderId}</span>
        </div>
        <p className="info-text">Đang tự động xác nhận thanh toán...</p>
      </div>
    </div>
  );
};

export default QRConfirm;
