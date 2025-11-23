/**
 * Collections Page - Bộ sưu tập
 * Minimal Scandinavian Design
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductsService } from '@/client'
import type { CategoryResponse } from '@/client'

export default function Collections() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await ProductsService.getCategoriesApiV1ProductsCategoriesGet()
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section-padding bg-[rgb(var(--color-bg-offwhite))]">
        <div className="container-custom text-center">
          <h1 className="heading-minimal mb-6">Bộ Sưu Tập</h1>
          <p className="text-minimal max-w-2xl mx-auto">
            Khám phá các bộ sưu tập nội thất được tuyển chọn kỹ lưỡng, 
            mang đến sự hài hòa hoàn hảo cho không gian sống của bạn
          </p>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="section-padding">
        <div className="container-custom">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgb(var(--color-primary))] border-r-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(categories) && categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/products?category_id=${category.id}`}
                  className="group"
                >
                  <div className="aspect-lookbook overflow-hidden bg-[rgb(var(--color-bg-offwhite))] mb-4">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgb(var(--color-wood))] to-[rgb(var(--color-moss))] text-white text-4xl font-light">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight group-hover:text-[rgb(var(--color-wood))] transition">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-minimal text-sm">{category.description}</p>
                    )}
                    <div className="flex items-center text-sm text-[rgb(var(--color-text-dark))] group-hover:text-[rgb(var(--color-wood))] transition">
                      <span>Khám phá</span>
                      <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Collection Banner */}
      <section className="section-padding bg-[rgb(var(--color-deep-green))] text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Bộ Sưu Tập Mùa Đông 2025
          </h2>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Tạo nên không gian ấm cúng với những món đồ nội thất tinh tế, 
            mang hơi thở Scandinavian thuần khiết
          </p>
          <Link to="/products?is_featured=true" className="btn-secondary bg-transparent border-white text-white hover:bg-white hover:text-[rgb(var(--color-deep-green))]">
            Xem Ngay
          </Link>
        </div>
      </section>
    </div>
  )
}
