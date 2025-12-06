import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="bg-[rgb(var(--color-primary))] text-white">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl mb-6" style={{ fontFamily: 'Playfair Display' }}>
              LUXE FURNITURE
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Crafting timeless elegance for your living spaces. Premium furniture that combines luxury, comfort, and sophistication.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="sr-only">Pinterest</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/collections" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase mb-6">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/shipping" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/warranty" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  Warranty
                </Link>
              </li>
              <li>
                <Link to="/care" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  Care Guide
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 text-sm hover:text-[rgb(var(--color-accent))] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase mb-6">Newsletter</h4>
            <p className="text-gray-300 text-sm mb-4">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:border-[rgb(var(--color-accent))] transition-colors"
              />
              <button type="submit" className="w-full btn-secondary !text-white !border-white hover:!bg-white hover:!text-[rgb(var(--color-primary))]">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="divider-luxury !bg-gradient-to-r !from-transparent !via-white/30 !to-transparent"></div>

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2025 Luxe Furniture. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/terms" className="hover:text-[rgb(var(--color-accent))] transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="hover:text-[rgb(var(--color-accent))] transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
