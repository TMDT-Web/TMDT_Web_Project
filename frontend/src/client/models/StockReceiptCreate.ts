/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StockReceiptItemCreate } from './StockReceiptItemCreate';
/**
 * Schema for creating stock receipt
 */
export type StockReceiptCreate = {
    supplier_name: string;
    supplier_phone?: (string | null);
    supplier_address?: (string | null);
    notes?: (string | null);
    items: Array<StockReceiptItemCreate>;
};

