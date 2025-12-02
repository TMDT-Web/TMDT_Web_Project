/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for stock receipt item response
 */
export type StockReceiptItemResponse = {
    id: number;
    receipt_id: number;
    product_id: number;
    product_name?: (string | null);
    product_sku?: (string | null);
    quantity: number;
    unit_price: string;
    subtotal: string;
    notes?: (string | null);
    created_at: string;
};

