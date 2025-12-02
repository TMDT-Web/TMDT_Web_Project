/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StockReceiptResponse } from './StockReceiptResponse';
/**
 * Schema for paginated stock receipt list
 */
export type StockReceiptListResponse = {
    receipts: Array<StockReceiptResponse>;
    total: number;
    page: number;
    size: number;
    pages: number;
};

