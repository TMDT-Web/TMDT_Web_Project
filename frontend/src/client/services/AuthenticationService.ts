/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_login_api_v1_auth_login_post } from '../models/Body_login_api_v1_auth_login_post';
import type { RefreshTokenRequest } from '../models/RefreshTokenRequest';
import type { RegisterRequest } from '../models/RegisterRequest';
import type { Token } from '../models/Token';
import type { UserResponse } from '../models/UserResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Register
     * Register a new user
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static registerApiV1AuthRegisterPost({
        requestBody,
    }: {
        requestBody: RegisterRequest,
    }): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Login
     * Login with email and password
     * @returns Token Successful Response
     * @throws ApiError
     */
    public static loginApiV1AuthLoginPost({
        formData,
    }: {
        formData: Body_login_api_v1_auth_login_post,
    }): CancelablePromise<Token> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/login',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Current User Info
     * Get current user information
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static getCurrentUserInfoApiV1AuthMeGet(): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/me',
        });
    }
    /**
     * Logout
     * Logout (client-side token deletion)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static logoutApiV1AuthLogoutPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/logout',
        });
    }
    /**
     * Refresh Token
     * Refresh access token using refresh token
     *
     * Provide the refresh_token to get a new access_token and refresh_token.
     * @returns Token Successful Response
     * @throws ApiError
     */
    public static refreshTokenApiV1AuthRefreshTokenPost({
        requestBody,
    }: {
        requestBody: RefreshTokenRequest,
    }): CancelablePromise<Token> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/refresh-token',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
