/**
 * Header Component - Scandinavian Minimal Design
 */
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import AuthModal from './AuthModal'

export default function Header() {
  const { user, logout } = useAuth()
  const { items, totalItems } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login')

  return (
    <header className="bg-white border-b border-[rgb(var(--color-border))]">
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="text-2xl md:text-3xl font-semibold tracking-tight">
            LuxeFurniture
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-sm hover:text-[rgb(var(--color-wood))] transition">
              Sản phẩm
            </Link>
            <Link to="/collections" className="text-sm hover:text-[rgb(var(--color-wood))] transition">
              Bộ sưu tập
            </Link>
            <Link to="/about" className="text-sm hover:text-[rgb(var(--color-wood))] transition">
              Giới thiệu
            </Link>
            <Link to="/contact" className="text-sm hover:text-[rgb(var(--color-wood))] transition">
              Liên hệ
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            {/* Search Icon */}
            <button className="text-[rgb(var(--color-text-dark))] hover:text-[rgb(var(--color-wood))] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* User Account */}
            {user ? (
              <div className="relative group">
                <button className="text-[rgb(var(--color-text-dark))] hover:text-[rgb(var(--color-wood))] transition flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm hidden lg:inline">{user.full_name}</span>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Tài khoản
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Đơn hàng
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-50">
                      Quản trị
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t border-gray-100"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalTab('login')
                  setIsAuthModalOpen(true)
                }}
                className="text-sm hover:text-[rgb(var(--color-wood))] transition"
              >
                Đăng nhập
              </button>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative text-[rgb(var(--color-text-dark))] hover:text-[rgb(var(--color-wood))] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[rgb(var(--color-primary))] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-[rgb(var(--color-text-dark))]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[rgb(var(--color-border))]">
            <div className="space-y-3">
              <Link to="/products" className="block py-2 text-sm hover:text-[rgb(var(--color-wood))] transition">
                Sản phẩm
              </Link>
              <Link to="/collections" className="block py-2 text-sm hover:text-[rgb(var(--color-wood))] transition">
                Bộ sưu tập
              </Link>
              <Link to="/about" className="block py-2 text-sm hover:text-[rgb(var(--color-wood))] transition">
                Giới thiệu
              </Link>
              <Link to="/contact" className="block py-2 text-sm hover:text-[rgb(var(--color-wood))] transition">
                Liên hệ
              </Link>
              {!user && (
                <button
                  onClick={() => {
                    setAuthModalTab('login')
                    setIsAuthModalOpen(true)
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left py-2 text-sm hover:text-[rgb(var(--color-wood))] transition"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </header>
  )
}
