/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PaymentsService {
    /**
     * Create Momo Payment
     * Create MoMo payment request
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createMomoPaymentApiV1PaymentsMomoCreatePost({
        orderId,
    }: {
        orderId: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payments/momo/create',
            query: {
                'order_id': orderId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Momo Payment Notify
     * MoMo payment IPN (Instant Payment Notification)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static momoPaymentNotifyApiV1PaymentsMomoNotifyPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payments/momo/notify',
        });
    }
    /**
     * Create Vnpay Payment
     * Create VNPAY payment URL
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createVnpayPaymentApiV1PaymentsVnpayCreatePost({
        orderId,
    }: {
        orderId: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payments/vnpay/create',
            query: {
                'order_id': orderId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Vnpay Payment Return
     * VNPAY payment return
     * @returns any Successful Response
     * @throws ApiError
     */
    public static vnpayPaymentReturnApiV1PaymentsVnpayReturnGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/payments/vnpay/return',
        });
    }
}
