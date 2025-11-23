/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderStatus } from './OrderStatus';
/**
 * Order update schema (admin)
 */
export type OrderUpdate = {
    status?: (OrderStatus | null);
    cancellation_reason?: (string | null);
    is_paid?: (boolean | null);
    shipping_fee?: (number | null);
};

