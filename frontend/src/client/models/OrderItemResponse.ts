/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Order item response
 */
export type OrderItemResponse = {
    id: number;
    created_at: string;
    updated_at: string;
    order_id: number;
    product_id: number;
    product_name: string;
    price_at_purchase: number;
    quantity: number;
    variant?: (string | null);
};

