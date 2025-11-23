/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CartItemCreate } from '../models/CartItemCreate';
import type { CartItemUpdate } from '../models/CartItemUpdate';
import type { CartResponse } from '../models/CartResponse';
import type { CartSummary } from '../models/CartSummary';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CartService {
    /**
     * Get Cart
     * Get current user's cart
     * @returns CartResponse Successful Response
     * @throws ApiError
     */
    public static getCartApiV1CartGet(): CancelablePromise<CartResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cart',
        });
    }
    /**
     * Clear Cart
     * Clear all items from cart
     * @returns any Successful Response
     * @throws ApiError
     */
    public static clearCartApiV1CartDelete(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cart',
        });
    }
    /**
     * Get Cart Summary
     * Get cart with calculated totals
     * @returns CartSummary Successful Response
     * @throws ApiError
     */
    public static getCartSummaryApiV1CartSummaryGet(): CancelablePromise<CartSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cart/summary',
        });
    }
    /**
     * Add To Cart
     * Add product to cart (or update quantity if exists)
     * @param requestBody
     * @returns CartResponse Successful Response
     * @throws ApiError
     */
    public static addToCartApiV1CartAddPost(
        requestBody: CartItemCreate,
    ): CancelablePromise<CartResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/cart/add',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Cart Item
     * Update cart item quantity
     * @param itemId
     * @param requestBody
     * @returns CartResponse Successful Response
     * @throws ApiError
     */
    public static updateCartItemApiV1CartItemIdPut(
        itemId: number,
        requestBody: CartItemUpdate,
    ): CancelablePromise<CartResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/cart/{item_id}',
            path: {
                'item_id': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove From Cart
     * Remove item from cart
     * @param itemId
     * @returns CartResponse Successful Response
     * @throws ApiError
     */
    public static removeFromCartApiV1CartItemIdDelete(
        itemId: number,
    ): CancelablePromise<CartResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cart/{item_id}',
            path: {
                'item_id': itemId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
