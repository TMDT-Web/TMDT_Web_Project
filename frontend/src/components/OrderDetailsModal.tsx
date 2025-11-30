/**
 * Order Details Modal Component
 */
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductsService } from '@/client/services/ProductsService'
import type { OrderResponse } from '@/client'

interface OrderDetailsModalProps {
    order: OrderResponse | null
    isOpen: boolean
    onClose: () => void
}

// Component to fetch and display product image
const ProductImage = ({ productId }: { productId: number }) => {
    const { data: product, isLoading } = useQuery({
        queryKey: ['product', productId],
        queryFn: () => ProductsService.getProductApiV1ProductsProductIdGet(productId),
        enabled: !!productId
    })

    const hasImage = product?.images && product.images.length > 0

    return (
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : hasImage ? (
                <img
                    src={product!.images![0]}
                    alt={product!.name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )}
        </div>
    )
}

export default function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen || !order) return null

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            'pending': 'Chờ xác nhận',
            'confirmed': 'Đã xác nhận',
            'processing': 'Đang xử lý',
            'shipping': 'Đang giao',
            'delivered': 'Đã giao',
            'cancelled': 'Đã hủy',
            'refunded': 'Đã hoàn tiền'
        }
        return statusMap[status] || status
    }

    const getStatusColor = (status: string) => {
        const colorMap: Record<string, string> = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'processing': 'bg-purple-100 text-purple-800',
            'shipping': 'bg-indigo-100 text-indigo-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
            'refunded': 'bg-gray-100 text-gray-800'
        }
        return colorMap[status] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 animate-fadeIn">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                Chi tiết đơn hàng #{order.id.toString().padStart(6, '0')}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Đặt ngày {new Date(order.created_at).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 hover:bg-gray-100 transition"
                        >
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Status & Payment */}
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Trạng thái đơn hàng</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Thanh toán</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${order.is_paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                {order.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mb-6">
                        <h4 className="font-semibold text-lg mb-3">Địa chỉ giao hàng</h4>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium">{order.full_name}</p>
                            <p className="text-gray-600">{order.phone_number}</p>
                            <p className="text-gray-600 mt-2">{order.shipping_address}</p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                        <h4 className="font-semibold text-lg mb-3">Sản phẩm ({order.items?.length || 0})</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {order.items?.map((item) => (
                                <div key={item.id} className="flex gap-4 p-3 border border-gray-200 rounded-lg">
                                    <ProductImage productId={item.product_id} />
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-medium truncate">{item.product_name}</h5>
                                        {item.variant && <p className="text-sm text-gray-500">{item.variant}</p>}
                                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                                        <p className="text-sm text-[rgb(var(--color-wood))] font-medium">
                                            {item.price_at_purchase.toLocaleString('vi-VN')}₫
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-[rgb(var(--color-wood))]">
                                            {(item.price_at_purchase * item.quantity).toLocaleString('vi-VN')}₫
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Tạm tính</span>
                                <span>{order.subtotal.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Phí vận chuyển</span>
                                <span>{order.shipping_fee.toLocaleString('vi-VN')}₫</span>
                            </div>
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Giảm giá</span>
                                    <span>-{order.discount_amount.toLocaleString('vi-VN')}₫</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold text-[rgb(var(--color-wood))] pt-2 border-t">
                                <span>Tổng cộng</span>
                                <span>{order.total_amount.toLocaleString('vi-VN')}₫</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.note && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">Ghi chú:</p>
                            <p className="text-sm text-gray-600 mt-1">{order.note}</p>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Phương thức thanh toán:</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' :
                                order.payment_method === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                                    order.payment_method}
                        </p>
                    </div>

                    {/* Close Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
