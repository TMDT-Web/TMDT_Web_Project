/**
 * Footer Component - Minimal Scandinavian Design
 */
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[rgb(var(--color-deep-green))] text-white">
      <div className="container-custom section-padding-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold tracking-tight">LuxeFurniture</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Nội thất cao cấp, thiết kế tinh tế cho không gian sống của bạn
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-medium mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/products?category_id=1" className="hover:text-white transition">
                  Sofa & Ghế
                </Link>
              </li>
              <li>
                <Link to="/products?category_id=2" className="hover:text-white transition">
                  Bàn
                </Link>
              </li>
              <li>
                <Link to="/products?category_id=3" className="hover:text-white transition">
                  Giường & Tủ
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-white transition">
                  Bộ sưu tập
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-medium mb-4">Về chúng tôi</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/about#policy" className="hover:text-white transition">
                  Chính sách
                </Link>
              </li>
              <li>
                <Link to="/about#shipping" className="hover:text-white transition">
                  Vận chuyển
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>273 An Dương Vương, Q5, TP.HCM</li>
              <li>
                <a href="tel:0934191038" className="hover:text-white transition">
                  0934191038
                </a>
              </li>
              <li>
                <a href="mailto:3123560077@sv.sgu.edu.vn" className="hover:text-white transition">
                  3123560077@sv.sgu.edu.vn
                </a>
              </li>
            </ul>

            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              <a href="#" className="hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                  <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm7.845-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-600 mt-12 pt-8 text-sm text-gray-400 text-center">
          <p>&copy; {new Date().getFullYear()} LuxeFurniture. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
