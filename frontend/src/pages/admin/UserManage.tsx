import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { UsersService } from "@/client/services/UsersService";
import { AddressesService } from "@/client/services/AddressesService";
import addressData from "@/utils/vietnam-address.json";
import { useToast } from "@/components/Toast";

import type { UserResponse } from "@/client/models/UserResponse";
import type { AdminUserUpdate } from '@/client/models/AdminUserUpdate'
import type { AddressResponse } from "@/client/models/AddressResponse";
import { UserRole } from "@/client/models/UserRole";

export default function UserManage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Block access for staff role
  useEffect(() => {
    if (!authLoading && user?.role === 'staff') {
      navigate('/admin', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [editForm, setEditForm] = useState<AdminUserUpdate>({});
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  
  // VIP upgrade notification
  const [vipNotification, setVipNotification] = useState<{ show: boolean; message: string; userName: string }>({ 
    show: false, 
    message: '', 
    userName: '' 
  });
  
  // Address editing state
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    receiver_name: '',
    receiver_phone: '',
    city_code: '',
    city_name: '',
    district_code: '',
    district_name: '',
    ward_code: '',
    ward_name: '',
    street: '',
  });


  const loadUsers = async () => {
    // Only load if user is authenticated and is admin
    if (!user || user.role !== UserRole.ADMIN) {
      return;
    }

    setIsLoadingUsers(true);
    try {
      const res = await UsersService.getUsersApiV1UsersGet(0, 50);
      setUsers(res.users);
    } catch (err) {
      console.error("Failed to load users:", err);
      if ((err as any)?.response?.status === 401) {
        // Token expired or invalid - redirect to login
        navigate("/login");
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Helper function to update a user in state without reloading
  const updateUserInState = (userId: number, updates: Partial<UserResponse>) => {
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === userId ? { ...u, ...updates } : u)
    );
  };

  useEffect(() => {
    // Don't load users while auth is still loading
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      navigate("/login");
      return;
    }

    // Redirect to home if not admin
    if (user.role !== UserRole.ADMIN) {
      navigate("/");
      return;
    }

    loadUsers();
  }, [authLoading, user, navigate]);

  const openEdit = async (u: UserResponse) => {
    setEditing(u);

    setEditForm({
      full_name: u.full_name,
      phone: u.phone ?? "",
      role: u.role,
      is_active: u.is_active,
      address_id: (u as any).default_address_id ?? null,
    });

    // reset previous addresses / errors
    setAddresses([]);
    setAddressesError(null);

    try {
      // If admin endpoint not available, fall back to current user's addresses
      const res = await AddressesService.getMyAddressesApiV1AddressesGet();
      setAddresses(res);
      setAddressesError(null);
    } catch (err) {
      console.error("Load address failed:", err);
      const status = (err as any)?.response?.status;
      if (status === 401) {
        setAddressesError('Bạn cần đăng nhập admin để xem/sửa địa chỉ');
      } else {
        setAddressesError('Không thể tải địa chỉ');
      }
      setAddresses([]);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;

    try {
      const updated = await UsersService.updateUserApiV1UsersUserIdPut(editing.id, editForm);
      updateUserInState(editing.id, updated);
      setEditing(null);
      setAddresses([]);
      setAddressesError(null);
    } catch (err) {
      console.error("Update failed:", err);
      alert('❌ Không thể cập nhật thông tin user');
    }
  };

  const saveNewAddress = async () => {
    if (!editing || !newAddressForm.street || !newAddressForm.city_code || !newAddressForm.district_code || !newAddressForm.ward_code) {
      toast.warning('Vui lòng nhập đầy đủ thông tin địa chỉ');
      return;
    }

    try {
      const payload = {
        name: newAddressForm.receiver_name,
        receiver_name: newAddressForm.receiver_name,
        receiver_phone: newAddressForm.receiver_phone,
        address_line: newAddressForm.street,
        city: newAddressForm.city_name,
        district: newAddressForm.district_name,
        ward: newAddressForm.ward_name,
        postal_code: '',
        notes: '',
        is_default: false,
      };

      await AddressesService.createAddressApiV1AddressesPost(payload);
      
      // Reload addresses
      const res = await AddressesService.getMyAddressesApiV1AddressesGet();
      setAddresses(res);
      
      // Reset form
      setIsAddingNewAddress(false);
      setNewAddressForm({
        receiver_name: '',
        receiver_phone: '',
        city_code: '',
        city_name: '',
        district_code: '',
        district_name: '',
        ward_code: '',
        ward_name: '',
        street: '',
      });
    } catch (err) {
      console.error("Create address failed:", err);
      toast.error('Không thể thêm địa chỉ mới');
    }
  };

  const cancelAddNewAddress = () => {
    setIsAddingNewAddress(false);
    setNewAddressForm({
      receiver_name: '',
      receiver_phone: '',
      city_code: '',
      city_name: '',
      district_code: '',
      district_name: '',
      ward_code: '',
      ward_name: '',
      street: '',
    });
  };

  const filtered = users.filter((u) => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      u.full_name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s);

    const matchRole = roleFilter === "all" || u.role === roleFilter;

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Quản lý người dùng</h2>

      <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm">
        <input
          className="border border-gray-300 rounded-lg p-3 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tìm tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)}
        >
          <option value="all">Tất cả</option>
          <option value={UserRole.CUSTOMER}>Khách hàng</option>
          <option value={UserRole.STAFF}>Nhân viên</option>
          <option value={UserRole.ADMIN}>Quản trị</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Người dùng</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vai trò</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">VIP</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">#{u.id}</td>

                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{u.full_name}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </td>

                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    u.role === UserRole.ADMIN
                      ? 'bg-purple-100 text-purple-800'
                      : u.role === UserRole.STAFF
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {u.role === UserRole.ADMIN ? 'Quản trị' : u.role === UserRole.STAFF ? 'Nhân viên' : 'Khách hàng'}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    u.vip_tier === 'diamond'
                      ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                      : u.vip_tier === 'gold'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : u.vip_tier === 'silver'
                      ? 'bg-gray-200 text-gray-700 border border-gray-400'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}>
                    {u.vip_tier === 'diamond' ? '💎 Diamond' : u.vip_tier === 'gold' ? '🥇 Gold' : u.vip_tier === 'silver' ? '🥈 Silver' : 'Member'}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    u.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {u.is_active ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </td>

                <td className="px-6 py-4 text-right space-x-2">
                  {u.role === UserRole.ADMIN ? (
                    <span className="text-gray-400 text-sm italic">Không khả dụng</span>
                  ) : (
                    <>
                      <button
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all duration-200 hover:shadow-md"
                        onClick={() => openEdit(u)}
                      >
                        Sửa
                      </button>

                      {u.role === UserRole.CUSTOMER && (
                        <>
                          <button
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 ${
                              u.vip_tier === 'diamond' 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-yellow-500 hover:bg-yellow-600 hover:shadow-md'
                            }`}
                            disabled={u.vip_tier === 'diamond'}
                            onClick={async () => {
                              try {
                                const response = await UsersService.upgradeUserVipApiV1UsersUserIdUpgradeVipPut(u.id);
                                updateUserInState(u.id, { vip_tier: response.vip_tier as any });
                                setVipNotification({ 
                                  show: true, 
                                  message: `✅ ${response.message || 'Nâng VIP thành công'} cho ${u.full_name}!`,
                                  userName: u.full_name 
                                });
                                setTimeout(() => {
                                  setVipNotification({ show: false, message: '', userName: '' });
                                }, 3000);
                              } catch (error: any) {
                                alert(`❌ Lỗi: ${error.body?.detail || 'Không thể nâng VIP'}`);
                              }
                            }}
                            title={u.vip_tier === 'diamond' ? 'Đã đạt cấp VIP tối đa' : 'Nâng lên cấp VIP tiếp theo'}
                          >
                            {u.vip_tier === 'diamond' ? '💎 Max VIP' : '⬆️ Nâng VIP'}
                          </button>
                          <button
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 ${
                              u.vip_tier === 'member' 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-orange-500 hover:bg-orange-600 hover:shadow-md'
                            }`}
                            disabled={u.vip_tier === 'member'}
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                const response = await fetch(`http://localhost:8000/api/v1/users/${u.id}/downgrade-vip`, {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  }
                                });
                                if (!response.ok) {
                                  const error = await response.json();
                                  throw new Error(error.detail || 'Không thể hạ VIP');
                                }
                                const data = await response.json();
                                updateUserInState(u.id, { vip_tier: data.vip_tier });
                                setVipNotification({ 
                                  show: true, 
                                  message: `✅ ${data.message || 'Hạ VIP thành công'} cho ${u.full_name}!`,
                                  userName: u.full_name 
                                });
                                setTimeout(() => {
                                  setVipNotification({ show: false, message: '', userName: '' });
                                }, 3000);
                              } catch (error: any) {
                                alert(`❌ Lỗi: ${error.message || 'Không thể hạ VIP'}`);
                              }
                            }}
                            title={u.vip_tier === 'member' ? 'Đã ở cấp VIP thấp nhất' : 'Hạ xuống cấp VIP trước đó'}
                          >
                            {u.vip_tier === 'member' ? '🆕 Min VIP' : '⬇️ Hạ VIP'}
                          </button>
                        </>
                      )}

                      <button
                        onClick={async () => {
                          await UsersService.updateUserStatusApiV1UsersUserIdStatusPut(u.id, !u.is_active);
                          updateUserInState(u.id, { is_active: !u.is_active });
                        }}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:shadow-md ${
                          u.is_active
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {u.is_active ? 'Chặn' : 'Mở'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h3 className="text-xl font-bold text-white">
                Sửa người dùng: {editing.full_name}
              </h3>
            </div>

            <div className="p-8 space-y-6 max-h-96 overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên đầy đủ</label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tên đầy đủ"
                  value={editForm.full_name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Số điện thoại"
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
                <select
                  disabled={editing.role === UserRole.ADMIN}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={editForm.role || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value as UserRole,
                    })
                  }
                >
                  <option value="">-- Chọn vai trò --</option>
                  <option value={UserRole.CUSTOMER}>Khách hàng</option>
                  <option value={UserRole.STAFF}>Nhân viên</option>
                </select>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active ?? true}
                    onChange={(e) =>
                      setEditForm({ ...editForm, is_active: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Đang hoạt động</span>
                </label>
              </div>

              {/* ADDRESSES SECTION */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Địa chỉ ({addresses.length})</h4>
                  <button
                    onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                    className={`px-3 py-1 text-sm rounded font-medium transition-all ${
                      isAddingNewAddress
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isAddingNewAddress ? '✕ Hủy' : '+ Thêm địa chỉ'}
                  </button>
                </div>

                {addressesError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
                    {addressesError}
                  </div>
                )}

                {/* ADD NEW ADDRESS FORM */}
                {isAddingNewAddress && (
                  <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 mb-4 space-y-3">
                    <h5 className="font-semibold text-gray-900 mb-3">Tạo địa chỉ mới</h5>
                    
                    {/* Receiver Name */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Tên người nhận</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500"
                        placeholder="Nhập tên người nhận"
                        value={newAddressForm.receiver_name}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, receiver_name: e.target.value })}
                      />
                    </div>

                    {/* Receiver Phone */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Số điện thoại</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500"
                        placeholder="Nhập số điện thoại"
                        value={newAddressForm.receiver_phone}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, receiver_phone: e.target.value })}
                      />
                    </div>

                    {/* City Dropdown */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Tỉnh / Thành phố</label>
                      <select
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500"
                        value={newAddressForm.city_code}
                        onChange={(e) => {
                          const city = addressData.find(c => c.code === e.target.value);
                          setNewAddressForm({
                            ...newAddressForm,
                            city_code: e.target.value,
                            city_name: city?.name || '',
                            district_code: '',
                            district_name: '',
                            ward_code: '',
                            ward_name: '',
                          });
                        }}
                      >
                        <option value="">-- Chọn tỉnh/thành phố --</option>
                        {addressData.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* District Dropdown */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Quận / Huyện</label>
                      <select
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500"
                        value={newAddressForm.district_code}
                        disabled={!newAddressForm.city_code}
                        onChange={(e) => {
                          const city = addressData.find(c => c.code === newAddressForm.city_code);
                          const district = city?.districts.find(d => d.code === e.target.value);
                          setNewAddressForm({
                            ...newAddressForm,
                            district_code: e.target.value,
                            district_name: district?.name || '',
                            ward_code: '',
                            ward_name: '',
                          });
                        }}
                      >
                        <option value="">-- Chọn quận/huyện --</option>
                        {addressData.find(c => c.code === newAddressForm.city_code)?.districts.map(d => (
                          <option key={d.code} value={d.code}>{d.name}</option>
                        )) || []}
                      </select>
                    </div>

                    {/* Ward Dropdown */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Phường / Xã</label>
                      <select
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500"
                        value={newAddressForm.ward_code}
                        disabled={!newAddressForm.district_code}
                        onChange={(e) => {
                          const city = addressData.find(c => c.code === newAddressForm.city_code);
                          const district = city?.districts.find(d => d.code === newAddressForm.district_code);
                          const ward = district?.wards.find(w => w.code === e.target.value);
                          setNewAddressForm({
                            ...newAddressForm,
                            ward_code: e.target.value,
                            ward_name: ward?.name || '',
                          });
                        }}
                      >
                        <option value="">-- Chọn phường/xã --</option>
                        {addressData.find(c => c.code === newAddressForm.city_code)?.districts.find(d => d.code === newAddressForm.district_code)?.wards.map(w => (
                          <option key={w.code} value={w.code}>{w.name}</option>
                        )) || []}
                      </select>
                    </div>

                    {/* Street Input */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Số nhà & Tên đường</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500"
                        placeholder="Nhập số nhà và tên đường"
                        value={newAddressForm.street}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, street: e.target.value })}
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={cancelAddNewAddress}
                        className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={saveNewAddress}
                        className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 font-medium"
                      >
                        Thêm địa chỉ
                      </button>
                    </div>
                  </div>
                )}

                {/* EXISTING ADDRESSES LIST */}
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <label className="flex items-start gap-3 cursor-pointer flex-1">
                            <input
                              type="radio"
                              name="default_address"
                              checked={editForm.address_id === addr.id}
                              onChange={() =>
                                setEditForm({
                                  ...editForm,
                                  address_id: addr.id,
                                })
                              }
                              className="w-5 h-5 mt-1 text-blue-600"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {addr.receiver_name} • {addr.receiver_phone}
                              </p>
                              <p className="text-sm text-gray-600">
                                {addr.address_line}
                              </p>
                              <p className="text-sm text-gray-600">
                                {addr.ward}, {addr.district}, {addr.city}
                              </p>
                            </div>
                          </label>
                          {editForm.address_id === addr.id && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium">
                              Mặc định
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Chưa có địa chỉ nào</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 flex justify-end gap-3 border-t">
              <button
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors duration-200"
                onClick={() => {
                  setEditing(null);
                  setAddresses([]);
                  setAddressesError(null);
                  setEditForm({});
                }}
              >
                Hủy
              </button>

              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                onClick={saveEdit}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP UPGRADE NOTIFICATION */}
      {vipNotification.show && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg shadow-2xl p-6 animate-bounce z-50 max-w-sm">
          <div className="flex items-center gap-4">
            <div className="text-3xl">⭐</div>
            <div>
              <p className="font-bold text-lg">{vipNotification.message}</p>
              <p className="text-sm opacity-90">Người dùng sẽ nhận được đặc quyền VIP</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

