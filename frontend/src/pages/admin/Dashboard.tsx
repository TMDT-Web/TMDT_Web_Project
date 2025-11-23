/**
 * Admin Dashboard - Enterprise style with stats, charts, tables
 */

export default function Dashboard() {
  // Mock data for now (TODO: integrate with real API)
  const stats = [
    {
      label: 'Doanh thu tháng',
      value: '₫125,500,000',
      change: 12.5,
      icon: '💰',
      color: '#10b981'
    },
    {
      label: 'Đơn hàng mới',
      value: '48',
      change: 8.2,
      icon: '🛒',
      color: '#3b82f6'
    },
    {
      label: 'Khách hàng',
      value: '1,234',
      change: 15.3,
      icon: '👥',
      color: '#8b5cf6'
    },
    {
      label: 'Sản phẩm',
      value: '156',
      change: 0,
      icon: '📦',
      color: '#f59e0b'
    }
  ]

  const monthlyRevenueData = [
    { month: 'T1', revenue: 95000000 },
    { month: 'T2', revenue: 105000000 },
    { month: 'T3', revenue: 88000000 },
    { month: 'T4', revenue: 115000000 },
    { month: 'T5', revenue: 130000000 },
    { month: 'T6', revenue: 125000000 }
  ]

  const topProducts = [
    { name: 'Sofa Monaco', revenue: 45000000, sales: 28 },
    { name: 'Bàn ăn Milan', revenue: 38000000, sales: 32 },
    { name: 'Giường Copenhagen', revenue: 35000000, sales: 22 },
    { name: 'Kệ sách Stockholm', revenue: 28000000, sales: 45 },
    { name: 'Ghế Barcelona', revenue: 22000000, sales: 38 }
  ]

  const recentOrders = [
    { id: '#ORD-2024-003', customer: 'Lê Minh Tuấn', products: 'Bàn ăn Milan, Ghế ăn x4', total: '₫32,500,000', status: 'pending', date: '22/12/2024' },
    { id: '#ORD-2024-002', customer: 'Phạm Thị Mai', products: 'Giường Copenhagen King', total: '₫15,900,000', status: 'shipping', date: '20/12/2024' },
    { id: '#ORD-2024-001', customer: 'Nguyễn Văn An', products: 'Sofa Monaco 3 chỗ', total: '₫22,500,000', status: 'delivered', date: '18/12/2024' }
  ]

  const maxRevenue = Math.max(...monthlyRevenueData.map(d => d.revenue))

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'shipping': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận'
      case 'shipping': return 'Đang giao'
      case 'delivered': return 'Đã giao'
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
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.revenue.toLocaleString('vi-VN')} VND</p>
                </div>
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  {product.sales} đã bán
                </div>
              </div>
            ))}
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
              {recentOrders.map((order, index) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
