/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StockReceiptCreate } from '../models/StockReceiptCreate';
import type { StockReceiptListResponse } from '../models/StockReceiptListResponse';
import type { StockReceiptResponse } from '../models/StockReceiptResponse';
import type { StockReceiptUpdate } from '../models/StockReceiptUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StockReceiptsService {
    /**
     * Create Stock Receipt
     * Create new stock receipt (Admin/Staff only)
     * @param requestBody
     * @returns StockReceiptResponse Successful Response
     * @throws ApiError
     */
    public static createStockReceiptApiV1StockReceiptsPost(
        requestBody: StockReceiptCreate,
    ): CancelablePromise<StockReceiptResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stock-receipts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Stock Receipts
     * Get list of stock receipts with pagination (Admin/Staff only)
     * @param page
     * @param size
     * @param status
     * @param search
     * @returns StockReceiptListResponse Successful Response
     * @throws ApiError
     */
    public static getStockReceiptsApiV1StockReceiptsGet(
        page: number = 1,
        size: number = 50,
        status?: (string | null),
        search?: (string | null),
    ): CancelablePromise<StockReceiptListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/stock-receipts',
            query: {
                'page': page,
                'size': size,
                'status': status,
                'search': search,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Stock Receipt
     * Get stock receipt by ID (Admin/Staff only)
     * @param receiptId
     * @returns StockReceiptResponse Successful Response
     * @throws ApiError
     */
    public static getStockReceiptApiV1StockReceiptsReceiptIdGet(
        receiptId: number,
    ): CancelablePromise<StockReceiptResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/stock-receipts/{receipt_id}',
            path: {
                'receipt_id': receiptId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Stock Receipt
     * Update stock receipt (Admin/Staff only, only DRAFT status)
     * @param receiptId
     * @param requestBody
     * @returns StockReceiptResponse Successful Response
     * @throws ApiError
     */
    public static updateStockReceiptApiV1StockReceiptsReceiptIdPut(
        receiptId: number,
        requestBody: StockReceiptUpdate,
    ): CancelablePromise<StockReceiptResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/stock-receipts/{receipt_id}',
            path: {
                'receipt_id': receiptId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Stock Receipt
     * Delete stock receipt (Admin only, only DRAFT status)
     * @param receiptId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteStockReceiptApiV1StockReceiptsReceiptIdDelete(
        receiptId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/stock-receipts/{receipt_id}',
            path: {
                'receipt_id': receiptId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Confirm Stock Receipt
     * Confirm stock receipt and update product stock (Admin/Staff only)
     * @param receiptId
     * @returns StockReceiptResponse Successful Response
     * @throws ApiError
     */
    public static confirmStockReceiptApiV1StockReceiptsReceiptIdConfirmPost(
        receiptId: number,
    ): CancelablePromise<StockReceiptResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stock-receipts/{receipt_id}/confirm',
            path: {
                'receipt_id': receiptId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Stock Receipt
     * Cancel stock receipt (Admin only)
     * @param receiptId
     * @returns StockReceiptResponse Successful Response
     * @throws ApiError
     */
    public static cancelStockReceiptApiV1StockReceiptsReceiptIdCancelPost(
        receiptId: number,
    ): CancelablePromise<StockReceiptResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/stock-receipts/{receipt_id}/cancel',
            path: {
                'receipt_id': receiptId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
