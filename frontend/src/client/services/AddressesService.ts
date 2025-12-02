/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddressCreate } from '../models/AddressCreate';
import type { AddressResponse } from '../models/AddressResponse';
import type { AddressUpdate } from '../models/AddressUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AddressesService {
    /**
     * Get My Addresses
     * Get all addresses of current user
     * @returns AddressResponse Successful Response
     * @throws ApiError
     */
    public static getMyAddressesApiV1AddressesGet(): CancelablePromise<Array<AddressResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/addresses',
        });
    }
    /**
     * Create Address
     * Create new address
     * @returns AddressResponse Successful Response
     * @throws ApiError
     */
    public static createAddressApiV1AddressesPost({
        requestBody,
    }: {
        requestBody: AddressCreate,
    }): CancelablePromise<AddressResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/addresses',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Address
     * Get specific address
     * @returns AddressResponse Successful Response
     * @throws ApiError
     */
    public static getAddressApiV1AddressesAddressIdGet({
        addressId,
    }: {
        addressId: number,
    }): CancelablePromise<AddressResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/addresses/{address_id}',
            path: {
                'address_id': addressId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Address
     * Update address
     * @returns AddressResponse Successful Response
     * @throws ApiError
     */
    public static updateAddressApiV1AddressesAddressIdPut({
        addressId,
        requestBody,
    }: {
        addressId: number,
        requestBody: AddressUpdate,
    }): CancelablePromise<AddressResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/addresses/{address_id}',
            path: {
                'address_id': addressId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Address
     * Delete address
     * @returns void
     * @throws ApiError
     */
    public static deleteAddressApiV1AddressesAddressIdDelete({
        addressId,
    }: {
        addressId: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/addresses/{address_id}',
            path: {
                'address_id': addressId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Set Default Address
     * Set address as default
     * @returns AddressResponse Successful Response
     * @throws ApiError
     */
    public static setDefaultAddressApiV1AddressesAddressIdSetDefaultPost({
        addressId,
    }: {
        addressId: number,
    }): CancelablePromise<AddressResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/addresses/{address_id}/set-default',
            path: {
                'address_id': addressId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
