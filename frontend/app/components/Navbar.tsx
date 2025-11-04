import { Link } from "react-router";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-[rgb(var(--color-border))]">
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[rgb(var(--color-primary))] flex items-center justify-center">
              <span className="text-white font-bold text-xl" style={{ fontFamily: 'Playfair Display' }}>L</span>
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Playfair Display' }}>
              LUXE FURNITURE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))] transition-colors">
              HOME
            </Link>
            <Link to="/products" className="text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))] transition-colors">
              PRODUCTS
            </Link>
            <Link to="/collections" className="text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))] transition-colors">
              COLLECTIONS
            </Link>
            <Link to="/about" className="text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))] transition-colors">
              ABOUT
            </Link>
            <Link to="/contact" className="text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))] transition-colors">
              CONTACT
            </Link>
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <button className="hover:text-[rgb(var(--color-secondary))] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link to="/account" className="hover:text-[rgb(var(--color-secondary))] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <Link to="/cart" className="hover:text-[rgb(var(--color-secondary))] transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-[rgb(var(--color-accent))] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[rgb(var(--color-border))] bg-white">
          <div className="container-custom py-4 space-y-4">
            <Link to="/" className="block text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))]">
              HOME
            </Link>
            <Link to="/products" className="block text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))]">
              PRODUCTS
            </Link>
            <Link to="/collections" className="block text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))]">
              COLLECTIONS
            </Link>
            <Link to="/about" className="block text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))]">
              ABOUT
            </Link>
            <Link to="/contact" className="block text-sm font-medium tracking-wider hover:text-[rgb(var(--color-secondary))]">
              CONTACT
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
