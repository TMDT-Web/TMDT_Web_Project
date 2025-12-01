/**
 * Payment Service
 * Handles payment gateway integration (VNPay, Momo)
 */

import api from './api';

export interface PaymentInitResponse {
  success: boolean;
  payment_url: string;
  message: string;
}

export interface PaymentStatus {
  order_id: number;
  is_paid: boolean;
  payment_method: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const paymentService = {
  /**
   * Initialize VNPay payment
   */
  async initVNPayPayment(orderId: number): Promise<PaymentInitResponse> {
    try {
      // Use unified create endpoint
      const response = await this.createPayment(orderId, 'vnpay');
      return response;
    } catch (error) {
      console.error('VNPay payment initialization error:', error);
      throw error;
    }
  },

  /**
   * Initialize Momo payment
   */
  async initMomoPayment(orderId: number): Promise<PaymentInitResponse> {
    try {
      // Use unified create endpoint
      const response = await this.createPayment(orderId, 'momo');
      return response;
    } catch (error) {
      console.error('Momo payment initialization error:', error);
      throw error;
    }
  },

  /**
   * Generate QR code for payment
   */
  async generateQRCode(orderId: number, paymentMethod: string = 'bank_transfer'): Promise<{ success: boolean; qr_code: string; order_id: number; amount: number }> {
    try {
      const response = await api.post('/api/v1/payments/qr/generate', {
        order_id: orderId,
        payment_method: paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw error;
    }
  },

  /**
   * Confirm QR code payment
   */
  async confirmQRPayment(orderId: number): Promise<{ success: boolean; message: string; order_id: number }> {
    try {
      const response = await api.post('/api/v1/payments/qr/confirm', {
        order_id: orderId
      });
      return response.data;
    } catch (error) {
      console.error('QR payment confirmation error:', error);
      throw error;
    }
  },

  /**
   * Check order payment status (for polling)
   */
  async checkOrderStatus(orderId: number): Promise<{ is_paid: boolean; status: string }> {
    try {
      const response = await api.get(`/api/v1/orders/${orderId}`);
      return {
        is_paid: response.data.is_paid || false,
        status: response.data.status || 'pending'
      };
    } catch (error) {
      console.error('Order status check error:', error);
      throw error;
    }
  },

  /**
   * Unified create payment call
   */
  async createPayment(orderId: number, gateway: string): Promise<PaymentInitResponse> {
    try {
      const response = await api.post('/api/v1/payments/create', {
        order_id: orderId,
        gateway
      });
      // Normalize backend response
      const data = response.data;
      return {
        success: !!data.success,
        payment_url: data.payment_url || data.payUrl || data.payurl || data.data?.payUrl || "",
        message: data.message || data.msg || ''
      } as PaymentInitResponse;
    } catch (error) {
      console.error('Create payment error:', error);
      throw error;
    }
  },

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: number): Promise<PaymentStatus> {
    try {
      const response = await api.get(`/api/v1/payments/order/${orderId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  },

  /**
   * Handle payment callback
   * Called when user returns from payment gateway
   */
  async handlePaymentCallback(queryParams: URLSearchParams): Promise<{
    success: boolean;
    orderId?: number;
    message: string;
  }> {
    try {
      // Extract order ID from callback params
      const vnpOrderInfo = queryParams.get('vnp_OrderInfo');
      const momoOrderId = queryParams.get('orderId');
      
      let orderId: number | null = null;
      let paymentMethod = '';

      // VNPay callback
      if (vnpOrderInfo) {
        // Extract order ID from OrderInfo (format: "Thanh toán đơn hàng #{order_id}")
        const match = vnpOrderInfo.match(/#(\d+)/);
        if (match) {
          orderId = parseInt(match[1]);
          paymentMethod = 'vnpay';
        }
      }

      // Momo callback
      if (momoOrderId) {
        orderId = parseInt(momoOrderId);
        paymentMethod = 'momo';
      }

      if (!orderId) {
        return {
          success: false,
          message: 'Invalid payment callback parameters'
        };
      }

      // Get payment status
      const status = await this.getPaymentStatus(orderId);

      return {
        success: status.is_paid,
        orderId,
        message: status.is_paid
          ? `Payment successful for order ${orderId}`
          : `Payment pending for order ${orderId}`
      };
    } catch (error) {
      console.error('Error handling payment callback:', error);
      return {
        success: false,
        message: 'Error processing payment callback'
      };
    }
  }
};

export default paymentService;
