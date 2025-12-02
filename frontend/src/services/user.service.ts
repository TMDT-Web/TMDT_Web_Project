/**
 * User Service - Wrapper for user-related API calls
 */
import { UsersService } from '@/client/services/UsersService'
import { AddressesService } from '@/client/services/AddressesService'
import type { UserUpdate } from '@/client/models/UserUpdate'
import type { AddressCreate } from '@/client/models/AddressCreate'
import type { AddressUpdate } from '@/client/models/AddressUpdate'
import type { AddressResponse } from '@/client/models/AddressResponse'

export const userService = {
    /**
     * Update current user profile
     */
    updateProfile: async (data: UserUpdate) => {
        return await UsersService.updateMyProfileApiV1UsersMePut(data)
    },

    /**
     * Change password
     */
    changePassword: async (data: { current_password: string, new_password: string }) => {
        return await UsersService.changePasswordApiV1UsersMeChangePasswordPost(data)
    },

    /**
     * Get user's addresses
     */
    getAddresses: async (): Promise<AddressResponse[]> => {
        return await AddressesService.getMyAddressesApiV1AddressesGet()
    },

    /**
     * Create a new address
     */
    createAddress: async (data: AddressCreate): Promise<AddressResponse> => {
        return await AddressesService.createAddressApiV1AddressesPost(data)
    },

    /**
     * Update an existing address
     */
    updateAddress: async (addressId: number, data: AddressUpdate): Promise<AddressResponse> => {
        return await AddressesService.updateAddressApiV1AddressesAddressIdPut(addressId, data)
    },

    /**
     * Delete an address
     */
    deleteAddress: async (addressId: number): Promise<void> => {
        return await AddressesService.deleteAddressApiV1AddressesAddressIdDelete(addressId)
    },

    /**
     * Get loyalty information
     */
    getLoyaltyInfo: async () => {
        return await UsersService.getMyLoyaltyApiV1UsersMeLoyaltyGet()
    }
}
