import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import GoogleLoginButton from '@/components/GoogleLoginButton';

interface LoginFormProps {
  onSuccessRedirect?: string;
  compact?: boolean; // render without outer card container
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccessRedirect = '/', compact = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate(onSuccessRedirect);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="admin@luxefurniture.com"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-sm text-gray-500">Hoặc</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>
      <GoogleLoginButton onError={setError} />
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          <strong>Tài khoản mặc định:</strong><br />
          Email: admin@luxefurniture.com<br />
          Mật khẩu: Admin@123456
        </p>
      </div>
    </>
  );

  if (compact) {
    return formContent;
  }

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
        <p className="text-gray-600 mt-2">Chào mừng bạn quay trở lại</p>
      </div>
      {formContent}
    </div>
  );
};

export default LoginForm;