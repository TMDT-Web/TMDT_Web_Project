export default function StatisticalPage() {
  const monthlyRevenue = [
    { month: "T1", revenue: 45000000, orders: 120 },
    { month: "T2", revenue: 52000000, orders: 145 },
    { month: "T3", revenue: 48000000, orders: 130 },
    { month: "T4", revenue: 65000000, orders: 178 },
    { month: "T5", revenue: 58000000, orders: 156 },
    { month: "T6", revenue: 72000000, orders: 195 },
  ];

  const topProducts = [
    { name: "Bàn làm việc gỗ tự nhiên", sold: 234, revenue: 35100000 },
    { name: "Ghế xoay văn phòng", sold: 189, revenue: 28350000 },
    { name: "Tủ quần áo 3 cánh", sold: 156, revenue: 46800000 },
    { name: "Kệ sách hiện đại", sold: 143, revenue: 21450000 },
  ];

  const stats = [
    {
      label: "Doanh thu tháng này",
      value: "₫72M",
      icon: "💰",
      color: "from-green-500 to-emerald-500",
      trend: "+15%",
    },
    {
      label: "Đơn hàng",
      value: "195",
      icon: "🛒",
      color: "from-blue-500 to-cyan-500",
      trend: "+8%",
    },
    {
      label: "Khách hàng mới",
      value: "48",
      icon: "👥",
      color: "from-purple-500 to-pink-500",
      trend: "+23%",
    },
    {
      label: "Tỷ lệ hoàn thành",
      value: "94%",
      icon: "📊",
      color: "from-orange-500 to-red-500",
      trend: "+2%",
    },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
            📈
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              Thống kê & Báo cáo
            </h1>
            <p className="text-rose-100 mt-1">
              Phân tích doanh thu và hiệu suất kinh doanh
            </p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg`}
              >
                {stat.icon}
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-slate-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-50 to-purple-50 p-6 border-b-2 border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center text-white text-xl shadow-md">
                📊
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Doanh thu theo tháng
                </h2>
                <p className="text-sm text-slate-600">6 tháng gần nhất</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {monthlyRevenue.map((data) => (
                <div key={data.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      {data.month}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">{data.orders} đơn</span>
                      <span className="font-bold text-green-600">
                        ₫{(data.revenue / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b-2 border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl shadow-md">
                🏆
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Top sản phẩm
                </h2>
                <p className="text-sm text-slate-600">Bán chạy nhất</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-200">
                  <span className="text-slate-600">
                    Đã bán: <b className="text-slate-900">{product.sold}</b>
                  </span>
                  <span className="font-bold text-green-600">
                    ₫{(product.revenue / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">
              📅
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Hiệu suất hôm nay
              </h3>
              <p className="text-sm text-slate-600">Cập nhật realtime</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span className="text-sm text-slate-600">Đơn hàng mới</span>
              <span className="font-bold text-blue-600">12</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span className="text-sm text-slate-600">Doanh thu hôm nay</span>
              <span className="font-bold text-green-600">₫3.2M</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span className="text-sm text-slate-600">Đã giao hàng</span>
              <span className="font-bold text-purple-600">8</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Cần xử lý</h3>
              <p className="text-sm text-slate-600">Ưu tiên cao</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50 border border-yellow-200">
              <span className="text-sm text-slate-700">Đơn chờ xác nhận</span>
              <span className="font-bold text-yellow-600">5</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200">
              <span className="text-sm text-slate-700">Sản phẩm hết hàng</span>
              <span className="font-bold text-red-600">3</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-sm text-slate-700">
                Đánh giá chưa phản hồi
              </span>
              <span className="font-bold text-blue-600">7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
