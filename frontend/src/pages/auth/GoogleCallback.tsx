import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Đăng nhập Google thất bại');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (accessToken && refreshToken) {
        try {
          // Store tokens using keys expected by interceptors
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
          
          // Fetch user info
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiBase}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            // Persist user in context; token already stored above
            login(userData, accessToken);
            navigate('/');
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (err) {
          console.error('Login error:', err);
          setError('Không thể hoàn tất đăng nhập');
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        setError('Thiếu thông tin xác thực');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        {error ? (
          <>
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <p className="text-gray-600">Đang chuyển hướng về trang đăng nhập...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang xử lý đăng nhập với Google...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
