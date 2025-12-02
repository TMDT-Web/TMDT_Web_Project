/**
 * Admin Layout - Enterprise Dashboard Style
 * Based on EC-REF AdminLayout
 */
import { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface MenuItem {
  path: string
  icon: string
  label: string
  exact?: boolean
}

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const allMenuItems: MenuItem[] = [
    { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: '📦', label: 'Sản phẩm' },
    { path: '/admin/categories', icon: '📁', label: 'Danh mục' },
    { path: '/admin/collections', icon: '🎨', label: 'Bộ sưu tập' },
    { path: '/admin/banners', icon: '🖼️', label: 'Banner Trang Chủ' },
    { path: '/admin/orders', icon: '🛒', label: 'Đơn hàng' },
    { path: '/admin/stock-receipts', icon: '📝', label: 'Phiếu nhập' },
    { path: '/admin/users', icon: '👥', label: 'Người dùng' },
    { path: '/admin/chat', icon: '💬', label: 'Chat Support' }
  ]

  // Filter menu items based on user role
  const menuItems = user?.role === 'staff' 
    ? allMenuItems.filter(item => item.path !== '/admin/users' && item.path !== '/admin/chat')
    : allMenuItems

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-[70px]' : 'w-[260px]'} bg-slate-800 text-white flex flex-col fixed h-screen z-50 transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <Link to="/admin" className="flex items-center gap-3 text-white no-underline text-lg font-semibold">
            <span className="text-2xl">🏢</span>
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Admin Panel</span>}
          </Link>
          <button
            className="bg-white/10 border-0 text-white w-7 h-7 rounded flex items-center justify-center cursor-pointer text-sm hover:bg-white/20 transition-colors"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-3 text-white/70 no-underline transition-all border-l-3 ${isActive(item.path, item.exact)
                  ? 'bg-blue-500/10 text-blue-400 border-l-blue-400'
                  : 'border-l-transparent hover:bg-white/5 hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center px-3' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!isSidebarCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-white/10 py-3">
          <Link
            to="/"
            className={`flex items-center gap-3 px-5 py-3 text-white/70 no-underline transition-all hover:bg-white/5 hover:text-white ${isSidebarCollapsed ? 'justify-center px-3' : ''}`}
            title="Xem trang chủ"
          >
            <span className="text-xl flex-shrink-0">🏠</span>
            {!isSidebarCollapsed && <span className="text-sm font-medium whitespace-nowrap">Trang chủ</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-[70px]' : 'ml-[260px]'}`}>
        {/* Header */}
        <header className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-40">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 m-0">
              {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Admin Panel'}
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                👤
              </span>
              <span className="text-sm font-medium text-gray-600">{user?.full_name || 'Admin'}</span>
            </div>
            <button
              className="bg-red-500 text-white border-0 px-4 py-2 rounded-md text-sm font-medium cursor-pointer hover:bg-red-600 transition-colors"
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

