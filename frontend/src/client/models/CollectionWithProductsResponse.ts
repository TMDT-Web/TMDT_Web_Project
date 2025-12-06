/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CollectionItemResponse } from './CollectionItemResponse';
import type { ProductResponse } from './ProductResponse';
/**
 * Collection response with bundle items and pricing details
 */
export type CollectionWithProductsResponse = {
    name: string;
    slug: string;
    banner_url?: (string | null);
    description?: (string | null);
    is_active?: boolean;
    sale_price?: (number | null);
    id: number;
    sale_price?: (number | null);
    total_original_price?: number;
    discount_amount?: number;
    discount_percentage?: number;
    items?: Array<CollectionItemResponse>;
    products?: Array<ProductResponse>;
};

