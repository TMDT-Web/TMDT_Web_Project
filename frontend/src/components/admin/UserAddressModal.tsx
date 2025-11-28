import { useEffect, useState } from "react";
import { AdminAddressService } from "@/client/services/AdminAddressService";
import type { AddressResponse } from "@/client/models/AddressResponse";
import type { AddressCreate } from "@/client/models/AddressCreate";

export default function UserAddressModal({ user, onClose }) {
  const [list, setList] = useState<AddressResponse[]>([]);
  const [form, setForm] = useState<AddressCreate>({
    name: "",
    receiver_name: "",
    receiver_phone: "",
    city: "",
    district: "",
    ward: "",
    address_line: "",
  });

  const load = async () => {
    const data = await AdminAddressService.getUserAddresses(user.id);
    setList(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    await AdminAddressService.create(user.id, form);
    setForm({
      name: "",
      receiver_name: "",
      receiver_phone: "",
      city: "",
      district: "",
      ward: "",
      address_line: "",
    });
    load();
  };

  const remove = async (addrId: number) => {
    await AdminAddressService.delete(user.id, addrId);
    load();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 w-[600px] rounded shadow space-y-4">
        <h2 className="text-xl font-semibold">
          Địa chỉ của {user.full_name}
        </h2>

        {/* Form thêm địa chỉ */}
        <div className="grid grid-cols-2 gap-2">
          <input
            className="border p-2"
            placeholder="Họ tên"
            value={form.receiver_name}
            onChange={(e) => setForm({ ...form, receiver_name: e.target.value })}
          />
          <input
            className="border p-2"
            placeholder="SĐT"
            value={form.receiver_phone}
            onChange={(e) => setForm({ ...form, receiver_phone: e.target.value })}
          />
          <input
            className="border p-2"
            placeholder="Tỉnh / Thành phố"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            className="border p-2"
            placeholder="Quận / Huyện"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
          />
          <input
            className="border p-2"
            placeholder="Phường / Xã"
            value={form.ward}
            onChange={(e) => setForm({ ...form, ward: e.target.value })}
          />
          <input
            className="border p-2 col-span-2"
            placeholder="Địa chỉ chi tiết"
            value={form.address_line}
            onChange={(e) => setForm({ ...form, address_line: e.target.value })}
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>
          Thêm địa chỉ
        </button>

        <hr />

        <h3 className="font-semibold">Danh sách địa chỉ:</h3>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {list.map((a) => (
            <div key={a.id} className="p-3 border rounded flex justify-between">
              <div>
                <div className="font-medium">{a.receiver_name} - {a.receiver_phone}</div>
                <div className="text-sm text-gray-600">
                  {a.address_line}, {a.ward}, {a.district}, {a.city}
                </div>
              </div>

              <button
                onClick={() => remove(a.id)}
                className="text-red-600"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>

        <button className="mt-4 text-gray-700 underline" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
