/**
 * BannerSlider Component - Homepage banner carousel
 */
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatImageUrl } from '@/utils/format'

interface Banner {
    id: number
    title: string
    subtitle?: string
    image_url: string
    link_url?: string
    display_order: number
    is_active: boolean
}

export default function BannerSlider() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)
    const navigate = useNavigate()

    // Fetch active banners
    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/banners/active')
            if (response.ok) {
                const data = await response.json()
                setBanners(data || [])
            }
        } catch (error) {
            console.error('Error fetching banners:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-rotation effect
    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length)
        }, 5000) // 5 seconds

        return () => clearInterval(interval)
    }, [isAutoPlaying, banners.length])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrevious()
            if (e.key === 'ArrowRight') goToNext()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex, banners.length])

    const goToPrevious = () => {
        setIsAutoPlaying(false)
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
        setTimeout(() => setIsAutoPlaying(true), 10000) // Resume after 10s
    }

    const goToNext = () => {
        setIsAutoPlaying(false)
        setCurrentIndex((prev) => (prev + 1) % banners.length)
        setTimeout(() => setIsAutoPlaying(true), 10000) // Resume after 10s
    }

    const goToSlide = (index: number) => {
        setIsAutoPlaying(false)
        setCurrentIndex(index)
        setTimeout(() => setIsAutoPlaying(true), 10000) // Resume after 10s
    }

    const handleBannerClick = (banner: Banner) => {
        if (banner.link_url) {
            // Check if internal link (starts with /)
            if (banner.link_url.startsWith('/')) {
                navigate(banner.link_url)
            } else {
                // External link - open in same tab
                window.location.href = banner.link_url
            }
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 py-20">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
                </div>
            </div>
        )
    }

    // No banners - show static hero
    if (banners.length === 0) {
        return (
            <section className="bg-gradient-to-r from-amber-50 to-amber-100 py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">LuxeFurniture</h1>
                    <p className="text-xl text-gray-700 mb-8">Premium furniture for your home</p>
                </div>
            </section>
        )
    }

    const currentBanner = banners[currentIndex]

    return (
        <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900 group">
            {/* Banners */}
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                >
                    {/* Banner Image */}
                    <img
                        src={formatImageUrl(banner.image_url)}
                        alt={banner.title}
                        className={`w-full h-full object-cover ${banner.link_url ? 'cursor-pointer' : ''}`}
                        onClick={() => handleBannerClick(banner)}
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>

                    {/* Banner Content */}
                    <div className="absolute inset-0 flex items-center">
                        <div className="container mx-auto px-4 md:px-8">
                            <div className="max-w-2xl">
                                <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg animate-fade-in">
                                    {banner.title}
                                </h2>
                                {banner.subtitle && (
                                    <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow-md animate-fade-in animation-delay-200">
                                        {banner.subtitle}
                                    </p>
                                )}
                                {banner.link_url && (
                                    <button
                                        onClick={() => handleBannerClick(banner)}
                                        className="bg-white text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-lg animate-fade-in animation-delay-400"
                                    >
                                        Xem ngay
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
                        aria-label="Previous banner"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
                        aria-label="Next banner"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Dot Indicators */}
            {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                                    ? 'bg-white w-8'
                                    : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Go to banner ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
