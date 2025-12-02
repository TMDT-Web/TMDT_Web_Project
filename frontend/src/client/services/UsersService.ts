/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PasswordChange } from '../models/PasswordChange';
import type { UserListResponse } from '../models/UserListResponse';
import type { UserResponse } from '../models/UserResponse';
import type { UserUpdate } from '../models/UserUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Get My Profile
     * Get current user profile
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static getMyProfileApiV1UsersMeGet(): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me',
        });
    }
    /**
     * Update My Profile
     * Update current user profile
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static updateMyProfileApiV1UsersMePut({
        requestBody,
    }: {
        requestBody: UserUpdate,
    }): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Change Password
     * Change current user password
     * @returns any Successful Response
     * @throws ApiError
     */
    public static changePasswordApiV1UsersMeChangePasswordPost({
        requestBody,
    }: {
        requestBody: PasswordChange,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/me/change-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Users
     * Get all users (admin only)
     * @returns UserListResponse Successful Response
     * @throws ApiError
     */
    public static getUsersApiV1UsersGet({
        skip,
        limit = 20,
    }: {
        skip?: number,
        limit?: number,
    }): CancelablePromise<UserListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users',
            query: {
                'skip': skip,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get User
     * Get user by ID (admin only)
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static getUserApiV1UsersUserIdGet({
        userId,
    }: {
        userId: number,
    }): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/{user_id}',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update User
     * Update user by ID (admin only)
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static updateUserApiV1UsersUserIdPut({
        userId,
        requestBody,
    }: {
        userId: number,
        requestBody: UserUpdate,
    }): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/{user_id}',
            path: {
                'user_id': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete User
     * Delete user (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteUserApiV1UsersUserIdDelete({
        userId,
    }: {
        userId: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/users/{user_id}',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update User Status
     * Update user active status (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateUserStatusApiV1UsersUserIdStatusPut({
        userId,
        isActive,
    }: {
        userId: number,
        isActive: boolean,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/{user_id}/status',
            path: {
                'user_id': userId,
            },
            query: {
                'is_active': isActive,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update User Role
     * Update user role (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateUserRoleApiV1UsersUserIdRolePut({
        userId,
        role,
    }: {
        userId: number,
        role: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/{user_id}/role',
            path: {
                'user_id': userId,
            },
            query: {
                'role': role,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upgrade User Vip
     * Upgrade user to VIP (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static upgradeUserVipApiV1UsersUserIdUpgradeVipPut({
        userId,
    }: {
        userId: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/{user_id}/upgrade-vip',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Reset User Password
     * Reset user password to default (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static resetUserPasswordApiV1UsersUserIdResetPasswordPost({
        userId,
    }: {
        userId: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{user_id}/reset-password',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

  /** ADMIN: downgrade VIP tier */
  public static downgradeVip(userId: number) {
    return __request(OpenAPI, {
      method: "PUT",
      url: `/api/v1/users/admin/${userId}/downgrade-vip`,
    });
  }
}
