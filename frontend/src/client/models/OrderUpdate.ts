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
    full_name?: (string | null);
    phone_number?: (string | null);
    shipping_address?: (string | null);
    note?: (string | null);
    subtotal?: (number | null);
    discount_amount?: (number | null);
    payment_method?: (string | null);
};

