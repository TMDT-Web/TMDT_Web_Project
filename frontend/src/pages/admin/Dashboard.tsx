/**
 * Admin Dashboard - Enterprise style with stats, charts, tables
 */
import { useQuery } from '@tanstack/react-query'
import { orderService } from '@/services/order.service'
import { UsersService } from '@/client/services/UsersService'
import { ProductsService } from '@/client/services/ProductsService'

export default function Dashboard() {
  // Fetch real data
  const { data: ordersData } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => orderService.getAllOrders(1, 100)
  })

  const { data: usersData } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => UsersService.getAll()
  })

  const { data: productsData } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => ProductsService.getProductsApiV1ProductsGet(0, 1000)
  })

  const orders = ordersData?.orders || []
  const users = usersData?.users || []
  const products = productsData?.products || []

  // Calculate real stats - only count completed orders
  const completedOrders = orders.filter(o => o.status === 'completed')
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyOrders = completedOrders.filter(o => {
    const orderDate = new Date(o.created_at)
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
  })

  const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0)
  const totalCustomers = users.filter(u => u.role === 'customer').length
  const totalProducts = products.length

  // Calculate revenue by month (last 6 months) - only completed orders
  const monthlyRevenueData = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const month = date.getMonth()
    const year = date.getFullYear()
    
    const monthOrders = completedOrders.filter(o => {
      const orderDate = new Date(o.created_at)
      return orderDate.getMonth() === month && orderDate.getFullYear() === year
    })
    
    const revenue = monthOrders.reduce((sum, order) => sum + order.total_amount, 0)
    monthlyRevenueData.push({
      month: `T${month + 1}`,
      revenue
    })
  }

  const stats = [
    {
      label: 'Doanh thu tháng',
      value: monthlyRevenue.toLocaleString('vi-VN') + ' ₫',
      change: 0,
      icon: '💰',
      color: '#10b981'
    },
    {
      label: 'Đơn hàng mới',
      value: monthlyOrders.length.toString(),
      change: 0,
      icon: '🛒',
      color: '#3b82f6'
    },
    {
      label: 'Khách hàng',
      value: totalCustomers.toString(),
      change: 0,
      icon: '👥',
      color: '#8b5cf6'
    },
    {
      label: 'Sản phẩm',
      value: totalProducts.toString(),
      change: 0,
      icon: '📦',
      color: '#f59e0b'
    }
  ]

  // Calculate top products by revenue - only completed orders
  const productSales = new Map<number, { name: string, revenue: number, quantity: number }>()
  
  completedOrders.forEach(order => {
    order.items?.forEach(item => {
      const productId = item.product_id
      const productName = item.product_name || item.product?.name || 'Sản phẩm'
      const revenue = (item.price_at_purchase || item.price || 0) * item.quantity
      
      if (productSales.has(productId)) {
        const current = productSales.get(productId)!
        current.revenue += revenue
        current.quantity += item.quantity
      } else {
        productSales.set(productId, {
          name: productName,
          revenue,
          quantity: item.quantity
        })
      }
    })
  })

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Recent orders (last 5)
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(order => ({
      id: `#${order.id.toString().padStart(6, '0')}`,
      customer: order.full_name,
      products: order.items && order.items.length > 0
        ? order.items.length === 1
          ? order.items[0].product_name || order.items[0].product?.name || 'Sản phẩm'
          : `${order.items[0].product_name || order.items[0].product?.name || 'Sản phẩm'} (+${order.items.length - 1})`
        : 'Không có sản phẩm',
      total: order.total_amount.toLocaleString('vi-VN') + ' ₫',
      status: order.status,
      date: new Date(order.created_at).toLocaleDateString('vi-VN')
    }))

  const maxRevenue = Math.max(...monthlyRevenueData.map(d => d.revenue))

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'awaiting_payment': return 'bg-orange-100 text-orange-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-indigo-100 text-indigo-800'
      case 'shipping': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận'
      case 'awaiting_payment': return 'Chờ thanh toán'
      case 'confirmed': return 'Đã xác nhận'
      case 'processing': return 'Đang xử lý'
      case 'shipping': return 'Đang giao'
      case 'completed': return 'Hoàn thành'
      case 'cancelled': return 'Đã hủy'
      case 'refunded': return 'Đã hoàn tiền'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-semibold text-slate-800 mb-1">{stat.value}</h3>
              {stat.change !== 0 && (
                <span className={`text-sm ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change > 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Doanh thu theo tháng</h3>
            <select className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
          <div className="flex items-end justify-between gap-3 h-64">
            {monthlyRevenueData.map((data, index) => {
              const height = (data.revenue / maxRevenue) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-52">
                    <div
                      className="w-full bg-blue-500 rounded-t-md relative group cursor-pointer hover:bg-blue-600 transition-colors"
                      style={{ height: `${height}%` }}
                      title={`${data.revenue.toLocaleString('vi-VN')} VND`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700">
                        {Math.round(data.revenue / 1000000)}M
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{data.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Sản phẩm bán chạy</h3>
          <div className="space-y-4">
            {topProducts.length > 0 ? topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.revenue.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  {product.quantity} đã bán
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">Chưa có dữ liệu bán hàng</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Đơn hàng gần đây</h3>
          <a href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Xem tất cả →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Mã đơn</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Khách hàng</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sản phẩm</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tổng tiền</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? recentOrders.map((order, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-sm font-mono text-blue-600">{order.id}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-800">{order.customer}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{order.products}</td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-800">{order.total}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{order.date}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">Chưa có đơn hàng nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
