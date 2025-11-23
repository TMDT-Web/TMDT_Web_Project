/**
 * Admin User Management - Users table with role badges and actions
 */
import { useState } from 'react'

export default function UserManage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Mock data
  const users = [
    { id: 1, name: 'Admin User', email: 'admin@luxefurniture.com', role: 'admin', status: 'active', totalOrders: 0, totalSpent: 0, joinDate: '01/01/2024' },
    { id: 2, name: 'Nguyễn Văn A', email: 'nguyenvana@email.com', role: 'customer', status: 'active', totalOrders: 12, totalSpent: 185000000, joinDate: '15/02/2024' },
    { id: 3, name: 'Trần Thị B', email: 'tranthib@email.com', role: 'vip', status: 'active', totalOrders: 28, totalSpent: 450000000, joinDate: '10/01/2024' },
    { id: 4, name: 'Lê Văn C', email: 'levanc@email.com', role: 'customer', status: 'active', totalOrders: 5, totalSpent: 68000000, joinDate: '20/03/2024' },
    { id: 5, name: 'Phạm Thị D', email: 'phamthid@email.com', role: 'customer', status: 'blocked', totalOrders: 2, totalSpent: 15000000, joinDate: '05/04/2024' }
  ]

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'vip': return 'bg-yellow-100 text-yellow-800'
      case 'customer': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'vip': return 'VIP'
      case 'customer': return 'Khách hàng'
      default: return role
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleUpgradeToVIP = (userId: number) => {
    console.log(`Upgrade user ${userId} to VIP`)
    // TODO: API call
  }

  const handleBlockUser = (userId: number, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'block' : 'unblock'
    console.log(`${action} user ${userId}`)
    // TODO: API call
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý người dùng</h2>
        <p className="text-gray-600 mt-1">Tổng {users.length} người dùng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="admin">Quản trị viên</option>
          <option value="vip">VIP</option>
          <option value="customer">Khách hàng</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Người dùng</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Vai trò</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Đơn hàng</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tổng chi tiêu</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trạng thái</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ngày tham gia</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">#{user.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getRoleClass(user.role)}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{user.totalOrders}</td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-800">
                    {formatPrice(user.totalSpent)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Bị chặn'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{user.joinDate}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-700 px-2 py-1 text-sm font-medium"
                        onClick={() => alert(`Xem chi tiết user ${user.id}`)}
                      >
                        Xem
                      </button>
                      {user.role === 'customer' && user.status === 'active' && (
                        <button
                          className="text-yellow-600 hover:text-yellow-700 px-2 py-1 text-sm font-medium"
                          onClick={() => handleUpgradeToVIP(user.id)}
                        >
                          Nâng VIP
                        </button>
                      )}
                      {user.role !== 'admin' && (
                        <button
                          className={`${user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'} px-2 py-1 text-sm font-medium`}
                          onClick={() => handleBlockUser(user.id, user.status)}
                        >
                          {user.status === 'active' ? 'Chặn' : 'Mở chặn'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
