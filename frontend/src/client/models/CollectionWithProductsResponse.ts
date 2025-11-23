/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductResponse } from './ProductResponse';
/**
 * Collection response with products included
 */
export type CollectionWithProductsResponse = {
    name: string;
    slug: string;
    banner_url?: (string | null);
    description?: (string | null);
    is_active?: boolean;
    id: number;
    products?: Array<ProductResponse>;
};

