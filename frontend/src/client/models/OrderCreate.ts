/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderItemCreate } from './OrderItemCreate';
import type { PaymentMethod } from './PaymentMethod';
/**
 * Order create schema
 */
export type OrderCreate = {
    full_name: string;
    phone_number: string;
    shipping_address: string;
    payment_method: PaymentMethod;
    note?: (string | null);
    items: Array<OrderItemCreate>;
    deposit_amount?: (number | null);
};

