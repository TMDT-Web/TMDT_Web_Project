/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating stock receipt item
 */
export type StockReceiptItemCreate = {
    product_id: number;
    quantity: number;
    unit_price: (number | string);
    notes?: (string | null);
};

