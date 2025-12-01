/**
 * AddressSelector Component - Cascading dropdowns for Vietnam address selection
 */
import { useState, useEffect } from 'react'

interface Province {
    name: string
    code: number
    division_type: string
    codename: string
    phone_code: number
}

interface District {
    name: string
    code: number
    division_type: string
    codename: string
    province_code: number
}

interface Ward {
    name: string
    code: number
    division_type: string
    codename: string
    district_code: number
}

interface AddressData {
    city: string
    district: string
    ward: string
    address_line: string
}

interface AddressSelectorProps {
    value: AddressData
    onChange: (data: AddressData) => void
    required?: boolean
}

export default function AddressSelector({ value, onChange, required = false }: AddressSelectorProps) {
    const [provinces, setProvinces] = useState<Province[]>([])
    const [districts, setDistricts] = useState<District[]>([])
    const [wards, setWards] = useState<Ward[]>([])

    const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null)
    const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null)

    const [loading, setLoading] = useState({
        provinces: false,
        districts: false,
        wards: false
    })

    // Fetch provinces on mount
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoading(prev => ({ ...prev, provinces: true }))
            try {
                const response = await fetch('https://provinces.open-api.vn/api/')
                const data = await response.json()
                setProvinces(data)
            } catch (error) {
                console.error('Error fetching provinces:', error)
            } finally {
                setLoading(prev => ({ ...prev, provinces: false }))
            }
        }
        fetchProvinces()
    }, [])

    // Find province code from name when value changes (for pre-filling)
    useEffect(() => {
        if (value.city && provinces.length > 0 && !selectedProvinceCode) {
            const province = provinces.find(p => p.name === value.city)
            if (province) {
                setSelectedProvinceCode(province.code)
            }
        }
    }, [value.city, provinces, selectedProvinceCode])

    // Fetch districts when province is selected
    useEffect(() => {
        if (selectedProvinceCode) {
            const fetchDistricts = async () => {
                setLoading(prev => ({ ...prev, districts: true }))
                try {
                    const response = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`)
                    const data = await response.json()
                    setDistricts(data.districts || [])
                } catch (error) {
                    console.error('Error fetching districts:', error)
                } finally {
                    setLoading(prev => ({ ...prev, districts: false }))
                }
            }
            fetchDistricts()
        } else {
            setDistricts([])
            setWards([])
        }
    }, [selectedProvinceCode])

    // Find district code from name when districts are loaded (for pre-filling)
    useEffect(() => {
        if (value.district && districts.length > 0 && !selectedDistrictCode) {
            const district = districts.find(d => d.name === value.district)
            if (district) {
                setSelectedDistrictCode(district.code)
            }
        }
    }, [value.district, districts, selectedDistrictCode])

    // Fetch wards when district is selected
    useEffect(() => {
        if (selectedDistrictCode) {
            const fetchWards = async () => {
                setLoading(prev => ({ ...prev, wards: true }))
                try {
                    const response = await fetch(`https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`)
                    const data = await response.json()
                    setWards(data.wards || [])
                } catch (error) {
                    console.error('Error fetching wards:', error)
                } finally {
                    setLoading(prev => ({ ...prev, wards: false }))
                }
            }
            fetchWards()
        } else {
            setWards([])
        }
    }, [selectedDistrictCode])

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value)
        const province = provinces.find(p => p.code === code)

        if (province) {
            setSelectedProvinceCode(code)
            setSelectedDistrictCode(null)
            setDistricts([])
            setWards([])

            onChange({
                city: province.name,
                district: '',
                ward: '',
                address_line: value.address_line
            })
        } else {
            setSelectedProvinceCode(null)
            setSelectedDistrictCode(null)
            setDistricts([])
            setWards([])

            onChange({
                city: '',
                district: '',
                ward: '',
                address_line: value.address_line
            })
        }
    }

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value)
        const district = districts.find(d => d.code === code)

        if (district) {
            setSelectedDistrictCode(code)
            setWards([])

            onChange({
                city: value.city,
                district: district.name,
                ward: '',
                address_line: value.address_line
            })
        } else {
            setSelectedDistrictCode(null)
            setWards([])

            onChange({
                city: value.city,
                district: '',
                ward: '',
                address_line: value.address_line
            })
        }
    }

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const wardName = e.target.value

        onChange({
            city: value.city,
            district: value.district,
            ward: wardName,
            address_line: value.address_line
        })
    }

    const handleAddressLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({
            city: value.city,
            district: value.district,
            ward: value.ward,
            address_line: e.target.value
        })
    }

    return (
        <div className="space-y-4">
            {/* Province/City */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Tỉnh/Thành phố {required && <span className="text-red-500">*</span>}
                </label>
                <select
                    required={required}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                    value={selectedProvinceCode || ''}
                    onChange={handleProvinceChange}
                    disabled={loading.provinces}
                >
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    {provinces.map(province => (
                        <option key={province.code} value={province.code}>
                            {province.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* District */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Quận/Huyện {required && <span className="text-red-500">*</span>}
                </label>
                <select
                    required={required}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                    value={selectedDistrictCode || ''}
                    onChange={handleDistrictChange}
                    disabled={!selectedProvinceCode || loading.districts}
                >
                    <option value="">-- Chọn Quận/Huyện --</option>
                    {districts.map(district => (
                        <option key={district.code} value={district.code}>
                            {district.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Ward */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Phường/Xã {required && <span className="text-red-500">*</span>}
                </label>
                <select
                    required={required}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                    value={value.ward}
                    onChange={handleWardChange}
                    disabled={!selectedDistrictCode || loading.wards}
                >
                    <option value="">-- Chọn Phường/Xã --</option>
                    {wards.map(ward => (
                        <option key={ward.code} value={ward.name}>
                            {ward.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Address Line (Street/Building/House Number) */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Số nhà, tên đường, tòa nhà {required && <span className="text-red-500">*</span>}
                </label>
                <input
                    type="text"
                    required={required}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-wood))]"
                    placeholder="Ví dụ: 123 Nguyễn Huệ, Tòa nhà ABC"
                    value={value.address_line}
                    onChange={handleAddressLineChange}
                />
            </div>
        </div>
    )
}
