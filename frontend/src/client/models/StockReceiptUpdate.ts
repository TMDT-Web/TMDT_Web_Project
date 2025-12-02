/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StockReceiptItemCreate } from './StockReceiptItemCreate';
/**
 * Schema for updating stock receipt
 */
export type StockReceiptUpdate = {
    supplier_name?: (string | null);
    supplier_phone?: (string | null);
    supplier_address?: (string | null);
    notes?: (string | null);
    items?: (Array<StockReceiptItemCreate> | null);
};

