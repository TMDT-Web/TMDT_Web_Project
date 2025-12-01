import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '@/services/payment.service';
import '@/styles/QRPayment.css';

type PaymentMethod = 'momo' | 'vnpay' | 'bank';

export const QRPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = parseInt(searchParams.get('order_id') || '0');
  const amountFromUrl = parseInt(searchParams.get('amount') || '0');
  const methodFromUrl = (searchParams.get('method') || 'bank') as PaymentMethod;
  
  const selectedMethod = methodFromUrl; // Use method from URL directly
  // Bank selection (only used when method = 'bank')
  const banks = [
    { key: 'vietcombank', name: 'Vietcombank', img: (() => { try { return new URL('../../assets/banks/vietcombank.png', import.meta.url).href; } catch { return '/payments/banks/vietcombank.png'; } })() },
    { key: 'techcombank', name: 'Techcombank', img: (() => { try { return new URL('../../assets/banks/techcombank.png', import.meta.url).href; } catch { return '/payments/banks/techcombank.png'; } })() },
    { key: 'bidv', name: 'BIDV', img: (() => { try { return new URL('../../assets/banks/bidv.png', import.meta.url).href; } catch { return '/payments/banks/bidv.png'; } })() },
    { key: 'vietinbank', name: 'VietinBank', img: (() => { try { return new URL('../../assets/banks/vietinbank.png', import.meta.url).href; } catch { return '/payments/banks/vietinbank.png'; } })() },
    { key: 'mbbank', name: 'MBBank', img: (() => { try { return new URL('../../assets/banks/mbbank.png', import.meta.url).href; } catch { return '/payments/banks/mbbank.png'; } })() },
    { key: 'tpbank', name: 'TPBank', img: (() => { try { return new URL('../../assets/banks/tpbank.png', import.meta.url).href; } catch { return '/payments/banks/tpbank.png'; } })() }
  ] as const;
  const [selectedBank, setSelectedBank] = useState<string>(banks[0].key);
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [orderAmount, setOrderAmount] = useState(amountFromUrl);
  const [error, setError] = useState<string>('');
  const [autoConfirmed, setAutoConfirmed] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-generate QR on page load
  useEffect(() => {
    if (orderId && selectedMethod) {
      handleGenerateQR();
    }
    
    return () => {
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      setError('');
      // Pass bank key for backend (optional enhancement later)
      const response = await paymentService.generateQRCode(orderId, selectedMethod);
      if (response.success) {
        setQrCode(response.qr_code);
        setOrderAmount(response.amount);
        // Start polling after QR is generated
        startPolling();
      } else {
        setError('Không thể tạo mã QR');
      }
    } catch (err) {
      setError('Lỗi khi tạo mã QR');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMethodInfo = (method: PaymentMethod) => {
    switch (method) {
      case 'momo':
        return {
          name: 'Ví MoMo',
          logo: '🎀',
          logoImg: (() => { try { return new URL('../../assets/momo.png', import.meta.url).href; } catch { return '/payments/momo.png'; } })(),
          color: '#D82D8B',
          description: 'Quét mã để thanh toán qua ví MoMo',
          accountInfo: 'Tài khoản: Luxe Furniture\nSố điện thoại: 0901234567'
        };
      case 'vnpay':
        return {
          name: 'VNPay QR',
          logo: '💳',
          logoImg: (() => { try { return new URL('../../assets/vnpay.png', import.meta.url).href; } catch { return '/payments/vnpay.png'; } })(),
          color: '#0066B3',
          description: 'Quét mã bằng ứng dụng ngân hàng hỗ trợ VNPay',
          accountInfo: 'Ngân hàng: Hỗ trợ tất cả ngân hàng liên kết VNPay'
        };
      case 'bank':
        return {
          name: 'Chuyển khoản ngân hàng',
          logo: '🏦',
          logoImg: (() => { try { return new URL('../../assets/bank.png', import.meta.url).href; } catch { return '/payments/bank.png'; } })(),
          color: '#00A86B',
          description: 'Quét mã QR để chuyển khoản ngân hàng',
          accountInfo: 'Ngân hàng: Vietcombank\nSố tài khoản: 1234567890\nChủ TK: LUXE FURNITURE'
        };
    }
  };

  const startPolling = () => {
    // Poll every 3 seconds to check if QR was scanned
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Check order status via API
        const response = await paymentService.checkOrderStatus(orderId);
        if (response.is_paid || response.status === 'confirmed') {
          // Payment confirmed! Stop polling and redirect
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setAutoConfirmed(true);
          // Redirect to orders page after showing success message
          setTimeout(() => {
            navigate('/orders');
          }, 2000);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  const handleConfirmPayment = async () => {
    try {
      setConfirming(true);
      const response = await paymentService.confirmQRPayment(orderId);
      if (response.success) {
        // Show success and redirect to orders page
        setAutoConfirmed(true);
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else {
        setError(response.message || 'Failed to confirm payment');
      }
    } catch (err) {
      setError('Error confirming payment');
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  // Validation: Check if orderId exists
  if (!orderId || orderId === 0) {
    return (
      <div className="qr-payment-container">
        <div className="qr-payment-card">
          <div className="error-message" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>❌ Lỗi</h2>
            <p>Không tìm thấy đơn hàng. Vui lòng thử lại!</p>
            <button 
              className="cancel-btn" 
              onClick={() => navigate('/cart')}
              style={{ marginTop: '20px' }}
            >
              Quay về giỏ hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="qr-payment-container">
        <div className="qr-spinner">
          <div className="spinner"></div>
          <p>Generating QR code...</p>
        </div>
      </div>
    );
  }

  if (autoConfirmed) {
    return (
      <div className="qr-payment-container">
        <div className="qr-payment-card success">
          <div className="success-icon">✓</div>
          <h2>Thanh toán thành công!</h2>
          <p>Đơn hàng #{orderId} đã được xác nhận</p>
          <p>Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  const currentMethod = getMethodInfo(selectedMethod);

  return (
    <div className="qr-payment-container">
      <div className="qr-payment-card modern">
        {/* Header */}
        <div className="payment-header">
          <h1>
            Thanh toán {currentMethod.name}
            {selectedMethod === 'bank' ? (
              <span className="bank-name"> — {banks.find(b => b.key === selectedBank)?.name}</span>
            ) : null}
          </h1>
          <p className="order-badge">Đơn hàng #{orderId}</p>
          <p className="payment-amount">{orderAmount.toLocaleString('vi-VN')} ₫</p>
        </div>

        {loading ? (
          <div className="loading-qr">
            <span className="spinner-large"></span>
            <p>Đang tạo mã QR {currentMethod.name}...</p>
          </div>
        ) : error ? (
          <div className="error-section">
            <div className="error-message">{error}</div>
            <button className="retry-btn" onClick={handleGenerateQR} style={{ background: currentMethod.color }}>
              Thử lại
            </button>
            <button className="cancel-btn" onClick={() => navigate('/orders')}>
              Quay lại đơn hàng
            </button>
          </div>
        ) : qrCode ? (
          <>
            {/* QR Code Display */}
            <div className="qr-display-section">
              <div className="method-badge" style={{ background: currentMethod.color }}>
                <span className="badge-icon">{currentMethod.logo}</span>
                <span className="badge-text">{currentMethod.name}</span>
              </div>

              <div className="qr-code-wrapper">
                <img src={qrCode} alt="QR Code Payment" className="qr-image" />
                <div className="qr-border" style={{ borderColor: currentMethod.color }}></div>
              </div>

              <div className="polling-status">
                <span className="pulse-dot" style={{ background: currentMethod.color }}></span>
                <span>Đang chờ thanh toán...</span>
              </div>

              <div className="payment-details">
                <div className="detail-row">
                  <span className="label">Mã đơn hàng:</span>
                  <span className="value">#{orderId}</span>
                </div>
                <div className="detail-row total">
                  <span className="label">Số tiền:</span>
                  <span className="value">{orderAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              <div className="qr-instructions">
                <h4>Hướng dẫn thanh toán</h4>
                <ol>
                  <li>Mở ứng dụng {currentMethod.name}</li>
                  <li>Chọn tính năng quét mã QR</li>
                  <li>Quét mã QR bên trên</li>
                  <li>Xác nhận thanh toán</li>
                </ol>
                <p className="auto-confirm-note">
                  ✓ Hệ thống sẽ tự động xác nhận khi bạn thanh toán thành công
                </p>
              </div>

              <div className="qr-actions">
                <button
                  className="cancel-btn"
                  onClick={() => navigate('/orders')}
                >
                  Quay lại đơn hàng
                </button>
              </div>
            </div>
          </>
        ) : (
          // No QR yet and not loading => show bank selector for bank method
          selectedMethod === 'bank' ? (
            <div className="bank-selector">
              <h3>Chọn ngân hàng để chuyển khoản</h3>
              <div className="bank-grid">
                {banks.map((bank) => (
                  <button
                    key={bank.key}
                    className={`bank-card ${selectedBank === bank.key ? 'active' : ''}`}
                    onClick={() => setSelectedBank(bank.key)}
                    title={bank.name}
                  >
                    <img
                      src={bank.img}
                      alt={bank.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="bank-title">{bank.name}</span>
                  </button>
                ))}
              </div>

              {error && <div className="error-message">{error}</div>}
              <button className="generate-qr-btn" onClick={handleGenerateQR} style={{ background: currentMethod.color }}>
                📱 Tạo mã QR chuyển khoản
              </button>
              <button className="cancel-btn" onClick={() => navigate('/orders')}>Quay lại đơn hàng</button>
            </div>
          ) : (
            // For momo/vnpay: just show primary action
            <div className="pre-qr-actions">
              {error && <div className="error-message">{error}</div>}
              <button className="generate-qr-btn" onClick={handleGenerateQR} style={{ background: currentMethod.color }}>
                📱 Tạo mã QR {currentMethod.name}
              </button>
              <button className="cancel-btn" onClick={() => navigate('/orders')}>Quay lại đơn hàng</button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default QRPayment;
