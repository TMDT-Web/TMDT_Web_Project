/**
 * User Service - Profile and password management
 */
import { apiClient } from './apiClient'

export interface UpdateProfileData {
    full_name?: string
    phone?: string
    avatar_url?: string
}

export interface ChangePasswordData {
    current_password: string
    new_password: string
    confirm_password: string
}

export const userService = {
    /**
     * Update current user profile
     */
    async updateProfile(data: UpdateProfileData): Promise<any> {
        const response = await apiClient.put('/api/v1/users/me', data)
        return response.data
    },

    /**
     * Change current user password
     */
    async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
        const response = await apiClient.post('/api/v1/auth/change-password', data)
        return response.data
    },
}
