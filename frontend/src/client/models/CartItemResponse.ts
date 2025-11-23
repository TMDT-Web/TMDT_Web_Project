/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CartItemProductInfo } from './CartItemProductInfo';
/**
 * Cart item response schema
 */
export type CartItemResponse = {
    id: number;
    cart_id: number;
    product_id: number;
    quantity: number;
    product: CartItemProductInfo;
    created_at: string;
    updated_at: string;
};

