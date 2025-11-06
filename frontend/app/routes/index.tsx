import { Link } from "react-router";
import { useState, useEffect } from "react";
import { getProducts } from "../lib/products";
import type { ProductListItem } from "../lib/types";
import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LUXE FURNITURE - Premium Furniture & Interior Design" },
    { name: "description", content: "Discover timeless elegance with our curated collection of luxury furniture" },
  ];
}

export default function Home() {
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const heroSlides = [
    {
      title: "Timeless Elegance",
      subtitle: "Transform Your Space",
      description: "Discover our curated collection of luxury furniture",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600",
      cta: "Explore Collection"
    },
    {
      title: "Artisan Crafted",
      subtitle: "Premium Quality",
      description: "Handpicked pieces that define sophistication",
      image: "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1600",
      cta: "Shop Now"
    },
    {
      title: "Modern Living",
      subtitle: "Contemporary Design",
      description: "Where comfort meets refined aesthetics",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600",
      cta: "View Catalogue"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts({ page: 1, size: 8 });
        setProducts(response.items);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    {
      name: "Living Room",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
      count: "120+ Items",
      slug: "living-room"
    },
    {
      name: "Bedroom",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600",
      count: "85+ Items",
      slug: "bedroom"
    },
    {
      name: "Dining",
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600",
      count: "65+ Items",
      slug: "dining"
    },
    {
      name: "Office",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600",
      count: "95+ Items",
      slug: "office"
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section with Slideshow */}
      <section className="relative h-screen">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentHeroSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center text-white">
              <div className="container-custom text-center">
                <p className="text-sm tracking-[0.3em] uppercase mb-4 text-[rgb(var(--color-accent))]">
                  {slide.subtitle}
                </p>
                <h1 className="text-6xl md:text-8xl mb-6 font-light">
                  {slide.title}
                </h1>
                <p className="text-xl mb-12 text-gray-200 max-w-2xl mx-auto">
                  {slide.description}
                </p>
                <Link to="/products" className="btn-primary">
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
        
        {/* Slide Indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroSlide(index)}
              className={`h-1 transition-all duration-300 ${
                index === currentHeroSlide 
                  ? 'w-12 bg-[rgb(var(--color-accent))]' 
                  : 'w-8 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.3em] uppercase text-[rgb(var(--color-secondary))] mb-4">
              Shop by Room
            </p>
            <h2 className="mb-6">Explore Our Collections</h2>
            <div className="divider-luxury max-w-xs mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/products?category=${category.slug}`}
                className="group relative overflow-hidden aspect-[3/4] luxury-card"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                  <div className="p-8 text-white w-full">
                    <h3 className="text-2xl mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-300">{category.count}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>DISCOVER</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.3em] uppercase text-[rgb(var(--color-secondary))] mb-4">
              Curated Selection
            </p>
            <h2 className="mb-6">Featured Products</h2>
            <div className="divider-luxury max-w-xs mx-auto"></div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-[rgb(var(--color-secondary))] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[rgb(var(--color-text-muted))]">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group"
                >
                  <div className="luxury-card overflow-hidden mb-4 aspect-square">
                    {product.main_image ? (
                      <img
                        src={product.main_image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <span className="text-6xl">🪑</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs tracking-wider text-[rgb(var(--color-text-muted))] uppercase mb-2">
                    {product.category?.name || 'Furniture'}
                  </p>
                  <h4 className="text-xl mb-2 group-hover:text-[rgb(var(--color-secondary))] transition-colors">
                    {product.name}
                  </h4>
                  <p className="font-medium text-lg">₫{Number(product.price).toLocaleString('vi-VN')}</p>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Link to="/products" className="btn-secondary">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="relative h-[600px] bg-fixed bg-center bg-cover" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1615873968403-89e068629265?w=1600')"
      }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="container-custom text-center">
            <p className="text-sm tracking-[0.3em] uppercase mb-4 text-[rgb(var(--color-accent))]">
              New Season
            </p>
            <h2 className="text-5xl md:text-7xl mb-8 font-light">
              Autumn Collection 2025
            </h2>
            <p className="text-xl mb-12 max-w-2xl mx-auto text-gray-200">
              Embrace the warmth of the season with our latest arrivals. Timeless pieces designed for comfort and elegance.
            </p>
            <Link to="/collections/autumn-2025" className="btn-primary">
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2 border-[rgb(var(--color-secondary))]">
                <svg className="w-10 h-10 text-[rgb(var(--color-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl mb-4">Premium Quality</h4>
              <p className="text-[rgb(var(--color-text-muted))] leading-relaxed">
                Handcrafted pieces made from the finest materials, built to last generations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2 border-[rgb(var(--color-secondary))]">
                <svg className="w-10 h-10 text-[rgb(var(--color-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl mb-4">Free Delivery</h4>
              <p className="text-[rgb(var(--color-text-muted))] leading-relaxed">
                Complimentary white-glove delivery and setup for all orders over ₫5,000,000.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2 border-[rgb(var(--color-secondary))]">
                <svg className="w-10 h-10 text-[rgb(var(--color-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl mb-4">Lifetime Warranty</h4>
              <p className="text-[rgb(var(--color-text-muted))] leading-relaxed">
                We stand behind our craftsmanship with comprehensive warranty coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-padding bg-[rgb(var(--color-primary))] text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm tracking-[0.3em] uppercase mb-4 text-[rgb(var(--color-accent))]">
              Stay Connected
            </p>
            <h2 className="mb-6">Join Our Newsletter</h2>
            <p className="text-gray-300 mb-8 text-lg">
              Be the first to know about new collections, exclusive offers, and design inspiration.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:border-[rgb(var(--color-accent))] transition-colors"
              />
              <button type="submit" className="btn-secondary !text-white !border-white hover:!bg-white hover:!text-[rgb(var(--color-primary))] px-12">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
