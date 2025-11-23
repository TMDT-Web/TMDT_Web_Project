/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderItemResponse } from './OrderItemResponse';
import type { OrderStatus } from './OrderStatus';
import type { PaymentMethod } from './PaymentMethod';
/**
 * Order response schema
 */
export type OrderResponse = {
    full_name: string;
    phone_number: string;
    shipping_address: string;
    payment_method: PaymentMethod;
    note?: (string | null);
    id: number;
    created_at: string;
    updated_at: string;
    user_id: number;
    subtotal: number;
    shipping_fee: number;
    discount_amount: number;
    total_amount: number;
    deposit_amount: number;
    remaining_amount: number;
    is_paid: boolean;
    status: OrderStatus;
    cancellation_reason?: (string | null);
    items?: Array<OrderItemResponse>;
};

