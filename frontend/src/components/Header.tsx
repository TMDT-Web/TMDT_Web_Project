/**
 * Header Component - Scandinavian Minimal Design
 */
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import AuthModal from './AuthModal'
import { CollectionsService } from '@/client'
import type { CollectionResponse } from '@/client'
import { Bell } from 'lucide-react'

interface HeaderProps {
  externalAuthModalState?: { isOpen: boolean; tab: 'login' | 'register' }
  onAuthModalClose?: () => void
}

export default function Header({ externalAuthModalState, onAuthModalClose }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { items, totalItems } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false)
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const collectionsRef = useRef<HTMLDivElement>(null)
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)

  // Handle external auth modal state from MainLayout
  useEffect(() => {
    if (externalAuthModalState?.isOpen) {
      setIsAuthModalOpen(true)
      setAuthModalTab(externalAuthModalState.tab)
    }
  }, [externalAuthModalState])

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window && user) {
      const permission = Notification.permission
      setShowNotificationPrompt(permission === 'default')
    }
  }, [user])

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await CollectionsService.getCollectionsApiV1CollectionsGet({
          limit: 10,
          isActive: true
        })
        setCollections(response.collections)
      } catch (error) {
        console.error('Failed to fetch collections:', error)
      }
    }
    fetchCollections()
  }, [])

  // Close collections dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collectionsRef.current && !collectionsRef.current.contains(event.target as Node)) {
        setIsCollectionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
            
            {/* Collections Dropdown */}
            <div ref={collectionsRef} className="relative">
              <button
                onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                className="text-sm hover:text-[rgb(var(--color-wood))] transition flex items-center gap-1"
              >
                Bộ sưu tập
                <svg 
                  className={`w-4 h-4 transition-transform ${isCollectionsOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isCollectionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[rgb(var(--color-border))] rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <Link
                      to="/collections"
                      onClick={() => setIsCollectionsOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-gray-50 transition font-medium text-[rgb(var(--color-wood))]"
                    >
                      Tất cả bộ sưu tập
                    </Link>
                    <div className="border-t border-[rgb(var(--color-border))] my-1"></div>
                    {collections.length > 0 ? (
                      collections.map((collection) => (
                        <Link
                          key={collection.id}
                          to={`/collections/${collection.id}`}
                          onClick={() => setIsCollectionsOpen(false)}
                          className="block px-4 py-2 text-sm hover:bg-gray-50 transition"
                        >
                          {collection.name}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Chưa có bộ sưu tập
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/about" className="text-sm hover:text-[rgb(var(--color-wood))] transition">
              Giới thiệu
            </Link>
            <Link to="/contact" className="text-sm hover:text-[rgb(var(--color-wood))] transition">
              Liên hệ
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            {/* Search */}
            <div className="flex items-center gap-2">
              <input
                ref={searchRef}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onBlur={() => {
                  if (!searchText) setIsSearchOpen(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchOpen(false)
                    ;(e.target as HTMLInputElement).blur()
                  }
                  if (e.key === 'Enter') {
                    const q = searchText.trim()
                    if (q) {
                      const url = `/products?search=${encodeURIComponent(q)}`
                      window.dispatchEvent(new CustomEvent('perform-product-search', { detail: { query: q } }))
                      navigate(url)
                    }
                  }
                }}
                placeholder="Tìm kiếm..."
                className={`transition-all duration-300 border border-[rgb(var(--color-border))] rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]
                  ${isSearchOpen ? 'w-40 md:w-64 px-4 py-2 opacity-100' : 'w-0 px-0 py-0 opacity-0 pointer-events-none'}`}
              />
              <button
                className="text-[rgb(var(--color-text-dark))] hover:text-[rgb(var(--color-wood))] transition"
                aria-label="Tìm kiếm"
                onClick={() => {
                  if (isSearchOpen) {
                    const q = searchText.trim()
                    if (q) {
                      const url = `/products?search=${encodeURIComponent(q)}`
                      window.dispatchEvent(new CustomEvent('perform-product-search', { detail: { query: q } }))
                      navigate(url)
                    }
                  } else {
                    setIsSearchOpen(true)
                    setTimeout(() => searchRef.current?.focus(), 10)
                  }
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* User Account */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="text-[rgb(var(--color-text-dark))] hover:text-[rgb(var(--color-wood))] transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm hidden lg:inline">{user.full_name}</span>
                </button>
                {/* Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Tài khoản
                      </Link>
                      <Link 
                        to="/orders" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Đơn hàng
                      </Link>
                      <Link 
                        to="/coupons" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Mã khuyến mãi
                      </Link>
                      {(user.role === 'admin' || user.role === 'staff') && (
                        <Link 
                          to="/admin" 
                          className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Quản trị
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          logout()
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t border-gray-100"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
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
              
              {/* Collections Dropdown - Mobile */}
              <div>
                <button
                  onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                  className="w-full text-left py-2 text-sm hover:text-[rgb(var(--color-wood))] transition flex items-center justify-between"
                >
                  Bộ sưu tập
                  <svg 
                    className={`w-4 h-4 transition-transform ${isCollectionsOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isCollectionsOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    <Link
                      to="/collections"
                      onClick={() => {
                        setIsCollectionsOpen(false)
                        setIsMenuOpen(false)
                      }}
                      className="block py-1 text-sm text-[rgb(var(--color-wood))] hover:text-[rgb(var(--color-wood-dark))] transition"
                    >
                      Tất cả bộ sưu tập
                    </Link>
                    {collections.map((collection) => (
                      <Link
                        key={collection.id}
                        to={`/collections/${collection.id}`}
                        onClick={() => {
                          setIsCollectionsOpen(false)
                          setIsMenuOpen(false)
                        }}
                        className="block py-1 text-sm hover:text-[rgb(var(--color-wood))] transition"
                      >
                        {collection.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

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
        onClose={() => {
          setIsAuthModalOpen(false)
          onAuthModalClose?.()
        }}
        defaultTab={authModalTab}
      />
    </header>
  )
}
