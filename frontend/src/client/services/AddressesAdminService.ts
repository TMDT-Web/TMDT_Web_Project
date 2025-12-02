/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddressResponse } from '../models/AddressResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AddressesAdminService {
    /**
     * Admin Get Addresses
     * @param userId
     * @returns AddressResponse Successful Response
     * @throws ApiError
     */
    public static adminGetAddressesApiV1AddressesAdminUserIdGet(
        userId: number,
    ): CancelablePromise<Array<AddressResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/addresses/admin/{user_id}',
            path: {
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
