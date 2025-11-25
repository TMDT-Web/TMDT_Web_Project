/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BannerCreate } from '../models/BannerCreate';
import type { BannerListResponse } from '../models/BannerListResponse';
import type { BannerResponse } from '../models/BannerResponse';
import type { BannerUpdate } from '../models/BannerUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BannersService {
    /**
     * Get Active Banners
     * Get all active banners for homepage display (public endpoint)
     * @returns BannerResponse Successful Response
     * @throws ApiError
     */
    public static getActiveBannersApiV1BannersActiveGet(): CancelablePromise<Array<BannerResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/banners/active',
        });
    }
    /**
     * Get Banners
     * Get all banners with pagination (admin only)
     * @param skip
     * @param limit
     * @returns BannerListResponse Successful Response
     * @throws ApiError
     */
    public static getBannersApiV1BannersGet(
        skip?: number,
        limit: number = 100,
    ): CancelablePromise<BannerListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/banners',
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
     * Create Banner
     * Create new banner (admin only)
     * @param requestBody
     * @returns BannerResponse Successful Response
     * @throws ApiError
     */
    public static createBannerApiV1BannersPost(
        requestBody: BannerCreate,
    ): CancelablePromise<BannerResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/banners',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Banner
     * Get banner by ID (admin only)
     * @param bannerId
     * @returns BannerResponse Successful Response
     * @throws ApiError
     */
    public static getBannerApiV1BannersBannerIdGet(
        bannerId: number,
    ): CancelablePromise<BannerResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/banners/{banner_id}',
            path: {
                'banner_id': bannerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Banner
     * Update banner (admin only)
     * @param bannerId
     * @param requestBody
     * @returns BannerResponse Successful Response
     * @throws ApiError
     */
    public static updateBannerApiV1BannersBannerIdPut(
        bannerId: number,
        requestBody: BannerUpdate,
    ): CancelablePromise<BannerResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/banners/{banner_id}',
            path: {
                'banner_id': bannerId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Banner
     * Delete banner (admin only)
     * @param bannerId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteBannerApiV1BannersBannerIdDelete(
        bannerId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/banners/{banner_id}',
            path: {
                'banner_id': bannerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
