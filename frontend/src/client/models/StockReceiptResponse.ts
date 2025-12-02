/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StockReceiptItemResponse } from './StockReceiptItemResponse';
/**
 * Schema for stock receipt response
 */
export type StockReceiptResponse = {
    id: number;
    receipt_code: string;
    supplier_name: string;
    supplier_phone?: (string | null);
    supplier_address?: (string | null);
    total_amount: string;
    notes?: (string | null);
    status: string;
    created_by: number;
    creator_name?: (string | null);
    created_at: string;
    updated_at: string;
    confirmed_at?: (string | null);
    items?: Array<StockReceiptItemResponse>;
};

