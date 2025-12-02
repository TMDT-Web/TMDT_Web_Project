/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserListResponse } from '../models/UserListResponse';
import type { UserResponse } from '../models/UserResponse';
import type { UserUpdate } from '../models/UserUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersAdminService {
    /**
     * Admin Get Users
     * @returns UserListResponse Successful Response
     * @throws ApiError
     */
    public static adminGetUsersApiV1UsersAdminGet(): CancelablePromise<UserListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/admin',
        });
    }
    /**
     * Admin Update User
     * @param userId
     * @param requestBody
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static adminUpdateUserApiV1UsersAdminUserIdPut(
        userId: number,
        requestBody: UserUpdate,
    ): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/admin/{user_id}',
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
     * Admin Upgrade Vip
     * @param userId
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static adminUpgradeVipApiV1UsersAdminUserIdUpgradeVipPut(
        userId: number,
    ): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/admin/{user_id}/upgrade-vip',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Downgrade Vip
     * @param userId
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static adminDowngradeVipApiV1UsersAdminUserIdDowngradeVipPut(
        userId: number,
    ): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/admin/{user_id}/downgrade-vip',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
