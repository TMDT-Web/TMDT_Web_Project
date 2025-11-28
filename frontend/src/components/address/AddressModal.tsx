import { useState } from "react";
import { AddressesService } from "@/client/services/AddressesService";
import { AddressCreate } from "@/client/models/AddressCreate";
import addressData from "@/utils/vietnam-address.json";

export default function AddressModal({ onClose, onSuccess }) {
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");

  const cities = addressData;
  const districts = city
    ? cities.find((c) => c.code === city)?.districts || []
    : [];
  const wards = district
    ? districts.find((d) => d.code === district)?.wards || []
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cityName = cities.find((c) => c.code === city)?.name || "";
    const districtName = districts.find((d) => d.code === district)?.name || "";
    const wardName = wards.find((w) => w.code === ward)?.name || "";

    const payload: AddressCreate = {
      name: "Địa chỉ mới",
      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      address_line: street,
      city: cityName,
      district: districtName,
      ward: wardName,
      postal_code: "",
      notes: "",
      is_default: false,
    };

    try {
      await AddressesService.createAddressApiV1AddressesPost(payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Không thể thêm địa chỉ!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg">

        <h2 className="text-xl font-bold mb-4">Thêm địa chỉ mới</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block mb-1 text-sm">Tên người nhận</label>
            <input
              required
              className="w-full border px-3 py-2 rounded"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Số điện thoại</label>
            <input
              required
              className="w-full border px-3 py-2 rounded"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
            />
          </div>

          {/* City */}
          <div>
            <label className="block mb-1 text-sm">Tỉnh / Thành phố</label>
            <select
              required
              className="w-full border px-3 py-2 rounded"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setDistrict("");
                setWard("");
              }}
            >
              <option value="">-- Chọn Tỉnh/TP --</option>
              {cities.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block mb-1 text-sm">Quận / Huyện</label>
            <select
              required
              className="w-full border px-3 py-2 rounded"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setWard("");
              }}
              disabled={!city}
            >
              <option value="">-- Chọn Quận/Huyện --</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Ward */}
          <div>
            <label className="block mb-1 text-sm">Phường / Xã</label>
            <select
              required
              className="w-full border px-3 py-2 rounded"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              disabled={!district}
            >
              <option value="">-- Chọn Phường/Xã --</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Street */}
          <div>
            <label className="block mb-1 text-sm">Số nhà & Tên đường</label>
            <input
              required
              className="w-full border px-3 py-2 rounded"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={onClose}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-[rgb(var(--color-wood))] text-white rounded"
            >
              Lưu địa chỉ
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
