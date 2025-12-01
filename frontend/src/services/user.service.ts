/**
 * User Service - Wrapper for user-related API calls
 */
import { UsersService } from '@/client/services/UsersService'
import { AddressesService } from '@/client/services/AddressesService'
import { OpenAPI } from '@/client/core/OpenAPI'
import { request as __request } from '@/client/core/request'
import type { UserUpdate } from '@/client/models/UserUpdate'
import type { AddressCreate } from '@/client/models/AddressCreate'
import type { AddressUpdate } from '@/client/models/AddressUpdate'
import type { AddressResponse } from '@/client/models/AddressResponse'

export const userService = {
    /**
     * Update current user profile
     */
    updateProfile: async (data: UserUpdate) => {
        return await __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/me',
            body: data,
            mediaType: 'application/json',
            errors: {
                422: 'Validation Error'
            }
        })
    },

    /**
     * Change password
     */
    changePassword: async (data: { current_password: string, new_password: string }) => {
        return await __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/me/change-password',
            body: data,
            mediaType: 'application/json',
            errors: {
                400: 'Bad Request - Current password is incorrect',
                422: 'Validation Error'
            }
        })
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
    }
}
