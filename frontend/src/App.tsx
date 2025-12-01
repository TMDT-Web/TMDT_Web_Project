import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { SocketProvider } from './context/SocketContext'

// Layouts
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import AuthLayout from './layouts/AuthLayout'

// Components
import ProtectedRoute from './components/ProtectedRoute'

// Shop Pages
import Home from './pages/shop/Home'
import ProductList from './pages/shop/ProductList'
import ProductDetail from './pages/shop/ProductDetail'
import Cart from './pages/shop/Cart'
import Checkout from './pages/shop/Checkout'
import PaymentCallback from './pages/shop/PaymentCallback'
import QRPayment from './pages/payment/QRPayment'
import QRConfirm from './pages/payment/QRConfirm'
import Orders from './pages/shop/Orders'
import Profile from './pages/shop/Profile'
import Collections from './pages/shop/Collections'
import About from './pages/shop/About'
import Contact from './pages/shop/Contact'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Admin Pages
import Dashboard from './pages/admin/Dashboard'
import ProductManage from './pages/admin/ProductManage'
import OrderManage from './pages/admin/OrderManage'
import UserManage from './pages/admin/UserManage'
import ChatSupport from './pages/admin/ChatSupport'
import CategoryManage from './pages/admin/CategoryManage'
import CollectionManage from './pages/admin/CollectionManage'
import BannerManage from './pages/admin/BannerManage'

// Error Pages
import NotFound from './pages/error/NotFound'

import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Shop Routes */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/callback" element={<PaymentCallback />} />
                  <Route path="/payment/qr" element={<QRPayment />} />
                  <Route path="/payment/qr-confirm" element={<QRConfirm />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<ProductManage />} />
                  <Route path="categories" element={<CategoryManage />} />
                  <Route path="collections" element={<CollectionManage />} />
                  <Route path="banners" element={<BannerManage />} />
                  <Route path="orders" element={<OrderManage />} />
                  <Route path="users" element={<UserManage />} />
                  <Route path="chat" element={<ChatSupport />} />
                </Route>

                {/* Error Routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
