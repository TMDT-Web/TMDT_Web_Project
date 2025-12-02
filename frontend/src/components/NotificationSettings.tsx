import React, { useState, useEffect } from 'react';
import { NotificationsService } from '@/client/services/NotificationsService';
import type { NotificationPreferenceResponse } from '@/client/models/NotificationPreferenceResponse';
import { Bell, BellOff } from 'lucide-react';

const NotificationSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferenceResponse | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    fetchPreferences();
    checkPushSupport();
  }, []);

  const checkPushSupport = () => {
    // Check if browser supports push notifications
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSupported(supported);
    
    if (supported) {
      setPushPermission(Notification.permission);
    }
  };

  const fetchPreferences = async () => {
    try {
      const data = await NotificationsService.getNotificationPreferencesApiV1NotificationsPreferencesGet();
      setPreferences(data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await NotificationsService.updateNotificationPreferencesApiV1NotificationsPreferencesPut({
        email_enabled: preferences.email_enabled,
        sms_enabled: preferences.sms_enabled,
        push_enabled: preferences.push_enabled,
        order_updates: preferences.order_updates,
        promotions: preferences.promotions,
      });
      setMessage({ type: 'success', text: 'Đã lưu cài đặt thông báo' });
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Không thể lưu cài đặt' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setMessage(null);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/notifications/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage({ type: 'success', text: 'Đã gửi email thử nghiệm. Vui lòng kiểm tra hộp thư của bạn!' });
    } catch (err) {
      console.error('Test email error:', err);
      setMessage({ type: 'error', text: 'Không thể gửi email thử nghiệm. Vui lòng kiểm tra cấu hình SMTP.' });
    }
  };

  const handleToggle = async (key: keyof Pick<NotificationPreferenceResponse, 'email_enabled' | 'sms_enabled' | 'push_enabled' | 'order_updates' | 'promotions'>) => {
    if (!preferences) return;
    
    // Special handling for push_enabled
    if (key === 'push_enabled' && !preferences.push_enabled) {
      // User is trying to enable push notifications
      const success = await requestPushPermission();
      if (!success) {
        return; // Don't toggle if permission denied
      }
    }
    
    setPreferences(prev => prev ? { ...prev, [key]: !prev[key] } : null);
  };

  const requestPushPermission = async (): Promise<boolean> => {
    if (!pushSupported) {
      setMessage({ 
        type: 'error', 
        text: 'Trình duyệt của bạn không hỗ trợ thông báo đẩy' 
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        // Subscribe to push notifications
        await subscribeToPushNotifications();
        setMessage({ 
          type: 'success', 
          text: 'Đã bật thông báo đẩy thành công!' 
        });
        return true;
      } else if (permission === 'denied') {
        setMessage({ 
          type: 'error', 
          text: 'Bạn đã từ chối quyền thông báo. Vui lòng bật lại trong cài đặt trình duyệt.' 
        });
        return false;
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Cần cấp quyền thông báo để sử dụng tính năng này' 
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setMessage({ 
        type: 'error', 
        text: 'Không thể yêu cầu quyền thông báo' 
      });
      return false;
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      // Get VAPID public key from backend (you'll need to add this endpoint)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LQ'; // Replace with your actual key
      
      // Convert VAPID key
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Send subscription to backend
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const subscriptionJSON = subscription.toJSON();
      
      await fetch('/api/v1/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: subscriptionJSON.endpoint,
          p256dh: subscriptionJSON.keys?.p256dh || '',
          auth: subscriptionJSON.keys?.auth || '',
          user_agent: navigator.userAgent
        })
      });

      console.log('Push subscription successful');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  };

  const sendTestPushNotification = async () => {
    if (!preferences?.push_enabled) {
      setMessage({ 
        type: 'error', 
        text: 'Vui lòng bật thông báo đẩy trước' 
      });
      return;
    }

    if (pushPermission !== 'granted') {
      setMessage({ 
        type: 'error', 
        text: 'Chưa cấp quyền thông báo' 
      });
      return;
    }

    try {
      // Send test notification directly via browser
      const notificationOptions: NotificationOptions = {
        body: 'Thông báo đẩy đang hoạt động! Bạn sẽ nhận được thông báo về đơn hàng và khuyến mãi.',
        icon: '/logo.png',
        badge: '/badge.png',
      };
      
      new Notification('LuxeFurniture - Thông báo thử nghiệm', notificationOptions);
      
      setMessage({ 
        type: 'success', 
        text: 'Đã gửi thông báo thử nghiệm!' 
      });
    } catch (error) {
      console.error('Test push error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Không thể gửi thông báo thử nghiệm' 
      });
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="max-w-2xl">
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
          Không thể tải cài đặt thông báo. Vui lòng thử lại sau.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Cài đặt thông báo</h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Kênh nhận thông báo</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email</div>
                <div className="text-sm text-gray-500">Nhận thông báo qua email</div>
              </div>
              <button
                onClick={() => handleToggle('email_enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.email_enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.email_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">SMS</div>
                <div className="text-sm text-gray-500">Nhận thông báo qua tin nhắn SMS</div>
              </div>
              <button
                onClick={() => handleToggle('sms_enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.sms_enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.sms_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  Thông báo đẩy
                  {preferences.push_enabled ? (
                    <Bell className="w-4 h-4 text-green-600" />
                  ) : (
                    <BellOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Nhận thông báo trực tiếp trên trình duyệt
                  {!pushSupported && (
                    <span className="block text-red-500 text-xs mt-1">
                      ⚠️ Trình duyệt không hỗ trợ
                    </span>
                  )}
                  {pushSupported && pushPermission === 'denied' && (
                    <span className="block text-red-500 text-xs mt-1">
                      ⚠️ Đã bị từ chối. Vui lòng bật lại trong cài đặt trình duyệt
                    </span>
                  )}
                  {pushSupported && pushPermission === 'granted' && preferences.push_enabled && (
                    <span className="block text-green-600 text-xs mt-1">
                      ✓ Đã kích hoạt
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleToggle('push_enabled')}
                disabled={!pushSupported || pushPermission === 'denied'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  preferences.push_enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.push_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Loại thông báo</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Cập nhật đơn hàng</div>
                <div className="text-sm text-gray-500">Thông báo về trạng thái đơn hàng của bạn</div>
              </div>
              <button
                onClick={() => handleToggle('order_updates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.order_updates ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.order_updates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Khuyến mãi</div>
                <div className="text-sm text-gray-500">Nhận thông báo về chương trình khuyến mãi và ưu đãi</div>
              </div>
              <button
                onClick={() => handleToggle('promotions')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.promotions ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.promotions ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
          
          <button
            onClick={handleSendTestEmail}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
          >
            📧 Gửi thử email
          </button>

          {/* Push notification buttons */}
          {pushSupported && (
            <>
              {pushPermission === 'default' && (
                <button
                  onClick={requestPushPermission}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition flex items-center justify-center gap-2"
                >
                  <Bell className="w-5 h-5" />
                  🔔 Yêu cầu quyền thông báo (Click để Allow)
                </button>
              )}

              {pushPermission === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                  <p className="text-red-800 font-medium mb-2">❌ Đã từ chối quyền thông báo</p>
                  <p className="text-red-600">
                    Để bật lại: Click vào biểu tượng 🔒 trên thanh địa chỉ → Cài đặt trang web → Thông báo → Cho phép
                  </p>
                </div>
              )}

              {pushPermission === 'granted' && preferences?.push_enabled && (
                <button
                  onClick={sendTestPushNotification}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <Bell className="w-5 h-5" />
                  📱 Gửi thử thông báo đẩy
                </button>
              )}
            </>
          )}

          {!pushSupported && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              ⚠️ Trình duyệt của bạn không hỗ trợ thông báo đẩy. Vui lòng sử dụng Chrome, Firefox, hoặc Edge.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
