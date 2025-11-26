/**
 * Vietnam Address Service - Using provinces.open-api.vn
 * Free API with full data for all 63 provinces/cities in Vietnam
 */

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
    }
}
