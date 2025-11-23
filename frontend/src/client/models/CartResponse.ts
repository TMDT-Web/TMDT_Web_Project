/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CartItemResponse } from './CartItemResponse';
/**
 * Cart response schema
 */
export type CartResponse = {
    id: number;
    user_id: number;
    items: Array<CartItemResponse>;
    created_at: string;
    updated_at: string;
};

