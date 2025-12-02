/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * Get Dashboard Stats
     * Get admin dashboard statistics (admin only)
     *
     * Returns:
     * - total_revenue: Sum of total_amount where status != cancelled/refunded
     * - total_orders: Count of all orders
     * - pending_orders: Count of orders with status='pending' or 'awaiting_payment'
     * - low_stock_products: Count of products with stock < 5 and is_active=true
     * - total_users: Count of all users
     * - active_products: Count of active products
     * - completed_orders: Count of completed orders
     * - cancelled_orders: Count of cancelled orders
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getDashboardStatsApiV1DashboardStatsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dashboard/stats',
        });
    }
    /**
     * Get Recent Orders
     * Get recent orders (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getRecentOrdersApiV1DashboardRecentOrdersGet({
        limit = 10,
    }: {
        limit?: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dashboard/recent-orders',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Top Products
     * Get top selling products (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getTopProductsApiV1DashboardTopProductsGet({
        limit = 10,
    }: {
        limit?: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/dashboard/top-products',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
