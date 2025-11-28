import { useEffect, useState } from "react";
import addressData from "@/utils/vietnam-address.json";
import { AddressesService } from "@/client/services/AddressesService";
import type { AddressResponse } from "@/client/models/AddressResponse";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// Format output
const buildAddress = (
  line: string,
  wardName: string | null,
  districtName: string,
  cityName: string
) => {
  return [line, wardName, districtName, cityName].filter(Boolean).join(", ");
};

export default function AddressSelector({ value, onChange }: Props) {
  const [mode, setMode] = useState<"saved" | "new">("saved");

  // Form fields
  const [cityCode, setCityCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [addressLine, setAddressLine] = useState("");

  // Address from DB
  const [saved, setSaved] = useState<AddressResponse | null>(null);

  // Load saved address
  useEffect(() => {
    loadSavedAddress();
  }, []);

  const loadSavedAddress = async () => {
    try {
      const list = await AddressesService.getMyAddressesApiV1AddressesGet();
      if (list.length === 0) return;

      const newest = list[list.length - 1];
      setSaved(newest);

      // convert readable names
      const cityObj = addressData.find((c) => c.name === newest.city);
      const districtObj = cityObj?.districts.find((d) => d.name === newest.district);
      const wardObj = districtObj?.wards.find((w) => w.name === newest.ward);

      setCityCode(cityObj?.code || "");
      setDistrictCode(districtObj?.code || "");
      setWardCode(wardObj?.code || "");
      setAddressLine(newest.address_line);

      onChange(
        buildAddress(
          newest.address_line,
          newest.ward || null,
          newest.district,
          newest.city
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  /** Get structured list */
  const provinces = addressData;
  const districts =
    provinces.find((p) => p.code === cityCode)?.districts || [];
  const wards =
    districts.find((d) => d.code === districtCode)?.wards || [];

  /** Update new-mode address */
  const updateNewOutput = (
    line: string,
    cityCode: string,
    districtCode: string,
    wardCode: string
  ) => {
    const cityName = provinces.find((c) => c.code === cityCode)?.name || "";
    const districtName =
      districts.find((d) => d.code === districtCode)?.name || "";
    const wardName =
      wards.find((w) => w.code === wardCode)?.name || null;

    onChange(buildAddress(line, wardName, districtName, cityName));
  };

  return (
    <div className="space-y-4">

      {/* MODE SWITCH */}
      <div className="flex gap-3">
        <button
          type="button"
          className={`px-4 py-2 border rounded-lg ${
            mode === "saved" ? "bg-gray-200" : ""
          }`}
          onClick={() => {
            setMode("saved");
            if (saved) {
              onChange(
                buildAddress(
                  saved.address_line,
                  saved.ward || null,
                  saved.district,
                  saved.city
                )
              );
            }
          }}
        >
          Địa chỉ có sẵn
        </button>

        <button
          type="button"
          className={`px-4 py-2 border rounded-lg ${
            mode === "new" ? "bg-gray-200" : ""
          }`}
          onClick={() => {
            setMode("new");
            setCityCode("");
            setDistrictCode("");
            setWardCode("");
            setAddressLine("");
            onChange("");
          }}
        >
          + Địa chỉ mới
        </button>
      </div>

      {/* SAVED MODE: UI đẹp giống cũ + disabled */}
      {mode === "saved" && saved && (
        <div className="space-y-3">
          {/* CITY */}
          <select
            className="w-full border p-3 rounded-lg"
            disabled
            value={cityCode}
          >
            <option>
              {addressData.find((p) => p.code === cityCode)?.name || ""}
            </option>
          </select>

          {/* DISTRICT */}
          <select
            className="w-full border p-3 rounded-lg"
            disabled
            value={districtCode}
          >
            <option>
              {districts.find((d) => d.code === districtCode)?.name || ""}
            </option>
          </select>

          {/* WARD */}
          <select
            className="w-full border p-3 rounded-lg"
            disabled
            value={wardCode}
          >
            <option>
              {wards.find((w) => w.code === wardCode)?.name || "Không có"}
            </option>
          </select>

          {/* ADDRESS LINE (editable) */}
          <input
            className="w-full border p-3 rounded-lg"
            placeholder="Số nhà, tên đường"
            value={addressLine}
            onChange={(e) => {
              setAddressLine(e.target.value);
              onChange(
                buildAddress(
                  e.target.value,
                  saved.ward || null,
                  saved.district,
                  saved.city
                )
              );
            }}
          />
        </div>
      )}

      {/* NEW MODE */}
      {mode === "new" && (
        <div className="space-y-3">
          {/* CITY */}
          <select
            className="w-full border p-3 rounded-lg"
            value={cityCode}
            onChange={(e) => {
              setCityCode(e.target.value);
              setDistrictCode("");
              setWardCode("");
              updateNewOutput(addressLine, e.target.value, "", "");
            }}
          >
            <option value="">Tỉnh / Thành phố</option>
            {provinces.map((p) => (
              <option value={p.code} key={p.code}>
                {p.name}
              </option>
            ))}
          </select>

          {/* DISTRICT */}
          <select
            className="w-full border p-3 rounded-lg"
            disabled={!cityCode}
            value={districtCode}
            onChange={(e) => {
              setDistrictCode(e.target.value);
              setWardCode("");
              updateNewOutput(addressLine, cityCode, e.target.value, "");
            }}
          >
            <option value="">Quận / Huyện</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>

          {/* WARD */}
          <select
            className="w-full border p-3 rounded-lg"
            disabled={!districtCode}
            value={wardCode}
            onChange={(e) => {
              setWardCode(e.target.value);
              updateNewOutput(addressLine, cityCode, districtCode, e.target.value);
            }}
          >
            <option value="">Phường / Xã</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>

          {/* ADDRESS LINE */}
          <input
            className="w-full border p-3 rounded-lg"
            placeholder="Số nhà, tên đường"
            value={addressLine}
            onChange={(e) => {
              setAddressLine(e.target.value);
              updateNewOutput(e.target.value, cityCode, districtCode, wardCode);
            }}
          />
        </div>
      )}
    </div>
  );
}
