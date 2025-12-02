/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderCreate } from '../models/OrderCreate';
import type { OrderListResponse } from '../models/OrderListResponse';
import type { OrderResponse } from '../models/OrderResponse';
import type { OrderUpdate } from '../models/OrderUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrdersService {
    /**
     * Create Order
     * Create new order
     * @returns OrderResponse Successful Response
     * @throws ApiError
     */
    public static createOrderApiV1OrdersPost({
        requestBody,
    }: {
        requestBody: OrderCreate,
    }): CancelablePromise<OrderResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orders',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get All Orders
     * Get all orders (admin only)
     * @returns OrderListResponse Successful Response
     * @throws ApiError
     */
    public static getAllOrdersApiV1OrdersGet({
        skip,
        limit = 20,
    }: {
        skip?: number,
        limit?: number,
    }): CancelablePromise<OrderListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orders',
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
     * Get My Orders
     * Get current user's orders
     * @returns OrderListResponse Successful Response
     * @throws ApiError
     */
    public static getMyOrdersApiV1OrdersMyOrdersGet({
        skip,
        limit = 20,
    }: {
        skip?: number,
        limit?: number,
    }): CancelablePromise<OrderListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orders/my-orders',
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
     * Get Order
     * Get order by ID
     * @returns OrderResponse Successful Response
     * @throws ApiError
     */
    public static getOrderApiV1OrdersOrderIdGet({
        orderId,
    }: {
        orderId: number,
    }): CancelablePromise<OrderResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orders/{order_id}',
            path: {
                'order_id': orderId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Order
     * Update order status (admin only)
     * @returns OrderResponse Successful Response
     * @throws ApiError
     */
    public static updateOrderApiV1OrdersOrderIdPut({
        orderId,
        requestBody,
    }: {
        orderId: number,
        requestBody: OrderUpdate,
    }): CancelablePromise<OrderResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/orders/{order_id}',
            path: {
                'order_id': orderId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Order
     * Cancel order (user can only cancel their own pending orders)
     * @param orderId
     * @returns OrderResponse Successful Response
     * @throws ApiError
     */
    public static cancelOrderApiV1OrdersOrderIdCancelPost(
        orderId: number,
    ): CancelablePromise<OrderResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orders/{order_id}/cancel',
            path: {
                'order_id': orderId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
