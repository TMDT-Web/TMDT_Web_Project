/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_login_api_v1_auth_login_post } from '../models/Body_login_api_v1_auth_login_post';
import type { GoogleAuthURL } from '../models/GoogleAuthURL';
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
     * @param requestBody
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    public static registerApiV1AuthRegisterPost(
        requestBody: RegisterRequest,
    ): CancelablePromise<UserResponse> {
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
     * @param formData
     * @returns Token Successful Response
     * @throws ApiError
     */
    public static loginApiV1AuthLoginPost(
        formData: Body_login_api_v1_auth_login_post,
    ): CancelablePromise<Token> {
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
     * @param requestBody
     * @returns Token Successful Response
     * @throws ApiError
     */
    public static refreshTokenApiV1AuthRefreshTokenPost(
        requestBody: RefreshTokenRequest,
    ): CancelablePromise<Token> {
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
    /**
     * Google Login
     * Initiate Google OAuth login flow
     *
     * Returns the Google authorization URL and state for CSRF protection.
     * Frontend should redirect user to this URL.
     * @returns GoogleAuthURL Successful Response
     * @throws ApiError
     */
    public static googleLoginApiV1AuthGoogleLoginGet(): CancelablePromise<GoogleAuthURL> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/google/login',
        });
    }
    /**
     * Google Callback
     * Handle Google OAuth callback
     *
     * Exchanges authorization code for tokens, verifies user, and issues JWT.
     * Redirects to frontend with tokens.
     * @param code Authorization code from Google
     * @param state CSRF state token
     * @returns any Successful Response
     * @throws ApiError
     */
    public static googleCallbackApiV1AuthGoogleCallbackGet(
        code: string,
        state: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/auth/google/callback',
            query: {
                'code': code,
                'state': state,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
