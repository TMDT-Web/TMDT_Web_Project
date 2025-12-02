import React, { useState, useEffect } from 'react';
import { NotificationsService } from '@/client/services/NotificationsService';
import type { NotificationPreferenceResponse } from '@/client/models/NotificationPreferenceResponse';

const NotificationSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferenceResponse | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

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

  const handleToggle = (key: keyof Pick<NotificationPreferenceResponse, 'email_enabled' | 'sms_enabled' | 'push_enabled' | 'order_updates' | 'promotions'>) => {
    if (!preferences) return;
    setPreferences(prev => prev ? { ...prev, [key]: !prev[key] } : null);
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
              <div>
                <div className="font-medium">Thông báo đẩy</div>
                <div className="text-sm text-gray-500">Nhận thông báo trực tiếp trên trình duyệt</div>
              </div>
              <button
                onClick={() => handleToggle('push_enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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

        <div className="border-t pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
          <div className="mt-4">
            <button
              onClick={handleSendTestEmail}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Gửi thử email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
