/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_add_products_to_collection_api_v1_collections__collection_id__products_post } from '../models/Body_add_products_to_collection_api_v1_collections__collection_id__products_post';
import type { Body_remove_products_from_collection_api_v1_collections__collection_id__products_delete } from '../models/Body_remove_products_from_collection_api_v1_collections__collection_id__products_delete';
import type { CollectionCreate } from '../models/CollectionCreate';
import type { CollectionListResponse } from '../models/CollectionListResponse';
import type { CollectionResponse } from '../models/CollectionResponse';
import type { CollectionUpdate } from '../models/CollectionUpdate';
import type { CollectionWithProductsResponse } from '../models/CollectionWithProductsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CollectionsService {
    /**
     * Get Collections
     * Get all collections
     * @param skip
     * @param limit
     * @param isActive
     * @returns CollectionListResponse Successful Response
     * @throws ApiError
     */
    public static getCollectionsApiV1CollectionsGet(
        skip?: number,
        limit: number = 100,
        isActive?: (boolean | null),
    ): CancelablePromise<CollectionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/collections',
            query: {
                'skip': skip,
                'limit': limit,
                'is_active': isActive,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Collection
     * Create new collection (admin only)
     *
     * If product_ids are provided, those products will be assigned to this collection.
     * @param requestBody
     * @returns CollectionResponse Successful Response
     * @throws ApiError
     */
    public static createCollectionApiV1CollectionsPost(
        requestBody: CollectionCreate,
    ): CancelablePromise<CollectionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/collections',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Collection
     * Get collection by ID with products
     * @param collectionId
     * @returns CollectionWithProductsResponse Successful Response
     * @throws ApiError
     */
    public static getCollectionApiV1CollectionsCollectionIdGet(
        collectionId: number,
    ): CancelablePromise<CollectionWithProductsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/collections/{collection_id}',
            path: {
                'collection_id': collectionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Collection
     * Update collection (admin only)
     *
     * If product_ids are provided, the collection's products will be replaced with these products.
     * Existing products will be removed from the collection.
     * @param collectionId
     * @param requestBody
     * @returns CollectionResponse Successful Response
     * @throws ApiError
     */
    public static updateCollectionApiV1CollectionsCollectionIdPut(
        collectionId: number,
        requestBody: CollectionUpdate,
    ): CancelablePromise<CollectionResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/collections/{collection_id}',
            path: {
                'collection_id': collectionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Collection
     * Delete collection (admin only)
     * @param collectionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteCollectionApiV1CollectionsCollectionIdDelete(
        collectionId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/collections/{collection_id}',
            path: {
                'collection_id': collectionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Collection By Slug
     * Get collection by slug with products
     * @param slug
     * @returns CollectionWithProductsResponse Successful Response
     * @throws ApiError
     */
    public static getCollectionBySlugApiV1CollectionsSlugSlugGet(
        slug: string,
    ): CancelablePromise<CollectionWithProductsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/collections/slug/{slug}',
            path: {
                'slug': slug,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Products To Collection
     * Add products to collection (admin only)
     *
     * This adds products without removing existing ones.
     * @param collectionId
     * @param requestBody
     * @returns CollectionResponse Successful Response
     * @throws ApiError
     */
    public static addProductsToCollectionApiV1CollectionsCollectionIdProductsPost(
        collectionId: number,
        requestBody: Body_add_products_to_collection_api_v1_collections__collection_id__products_post,
    ): CancelablePromise<CollectionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/collections/{collection_id}/products',
            path: {
                'collection_id': collectionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Products From Collection
     * Remove products from collection (admin only)
     * @param collectionId
     * @param requestBody
     * @returns CollectionResponse Successful Response
     * @throws ApiError
     */
    public static removeProductsFromCollectionApiV1CollectionsCollectionIdProductsDelete(
        collectionId: number,
        requestBody: Body_remove_products_from_collection_api_v1_collections__collection_id__products_delete,
    ): CancelablePromise<CollectionResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/collections/{collection_id}/products',
            path: {
                'collection_id': collectionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
