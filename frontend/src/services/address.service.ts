/**
 * Vietnam Address Service - Using provinces.open-api.vn
 * Free API with full data for all 63 provinces/cities in Vietnam
 */

import { apiClient } from './apiClient'

export interface Ward {
    code: number
    name: string
    name_en: string
    full_name: string
    full_name_en: string
    code_name: string
}

export interface District {
    code: number
    name: string
    name_en: string
    full_name: string
    full_name_en: string
    code_name: string
    wards?: Ward[]
}

export interface Province {
    code: number
    name: string
    name_en: string
    full_name: string
    full_name_en: string
    code_name: string
    districts?: District[]
}

const API_BASE_URL = 'https://provinces.open-api.vn/api'

export const addressService = {
    /**
     * Get all provinces/cities in Vietnam
     */
    async getProvinces(): Promise<Province[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/p/`)
            if (!response.ok) throw new Error('Failed to fetch provinces')
            return await response.json()
        } catch (error) {
            console.error('Error fetching provinces:', error)
            throw error
        }
    },

    /**
     * Get a province with all its districts
     */
    async getProvinceWithDistricts(provinceCode: number): Promise<Province> {
        try {
            const response = await fetch(`${API_BASE_URL}/p/${provinceCode}?depth=2`)
            if (!response.ok) throw new Error('Failed to fetch province details')
            return await response.json()
        } catch (error) {
            console.error('Error fetching province details:', error)
            throw error
        }
    },

    /**
     * Get a district with all its wards
     */
    async getDistrictWithWards(districtCode: number): Promise<District> {
        try {
            const response = await fetch(`${API_BASE_URL}/d/${districtCode}?depth=2`)
            if (!response.ok) throw new Error('Failed to fetch district details')
            return await response.json()
        } catch (error) {
            console.error('Error fetching district details:', error)
            throw error
        }
    },

    /**
     * Get all districts of a province
     */
    async getDistrictsByProvince(provinceCode: number): Promise<District[]> {
        try {
            const province = await this.getProvinceWithDistricts(provinceCode)
            return province.districts || []
        } catch (error) {
            console.error('Error fetching districts:', error)
            throw error
        }
    },

    /**
     * Get all wards of a district
     */
    async getWardsByDistrict(districtCode: number): Promise<Ward[]> {
        try {
            const district = await this.getDistrictWithWards(districtCode)
            return district.wards || []
        } catch (error) {
            console.error('Error fetching wards:', error)
            throw error
        }
    },

    // ============ BACKEND ADDRESS CRUD OPERATIONS ============

    /**
     * Get all addresses of current user from backend
     */
    async getMyAddresses(): Promise<UserAddress[]> {
        try {
            const response = await apiClient.get('/api/v1/addresses')
            return response.data
        } catch (error) {
            console.error('Error fetching user addresses:', error)
            throw error
        }
    },

    /**
     * Get default address of current user
     */
    async getDefaultAddress(): Promise<UserAddress | null> {
        try {
            const addresses = await this.getMyAddresses()
            return addresses.find(addr => addr.is_default) || null
        } catch (error) {
            console.error('Error fetching default address:', error)
            return null
        }
    },

    /**
     * Create new address for current user
     */
    async createAddress(data: CreateAddressData): Promise<UserAddress> {
        try {
            const response = await apiClient.post('/api/v1/addresses', data)
            return response.data
        } catch (error) {
            console.error('Error creating address:', error)
            throw error
        }
    },

    /**
     * Update existing address
     */
    async updateAddress(addressId: number, data: UpdateAddressData): Promise<UserAddress> {
        try {
            const response = await apiClient.put(`/api/v1/addresses/${addressId}`, data)
            return response.data
        } catch (error) {
            console.error('Error updating address:', error)
            throw error
        }
    },

    /**
     * Set address as default
     */
    async setDefaultAddress(addressId: number): Promise<UserAddress> {
        try {
            const response = await apiClient.post(`/api/v1/addresses/${addressId}/set-default`)
            return response.data
        } catch (error) {
            console.error('Error setting default address:', error)
            throw error
        }
    }
}

// ============ BACKEND ADDRESS TYPES ============

export interface UserAddress {
    id: number
    user_id: number
    name: string
    receiver_name: string
    receiver_phone: string
    address_line: string
    ward: string | null
    district: string
    city: string
    postal_code: string | null
    is_default: boolean
    notes: string | null
    created_at: string
    updated_at: string
}

export interface CreateAddressData {
    name: string
    receiver_name: string
    receiver_phone: string
    address_line: string
    ward?: string
    district: string
    city: string
    postal_code?: string
    is_default?: boolean
    notes?: string
}

export interface UpdateAddressData {
    name?: string
    receiver_name?: string
    receiver_phone?: string
    address_line?: string
    ward?: string
    district?: string
    city?: string
    postal_code?: string
    is_default?: boolean
    notes?: string
}

