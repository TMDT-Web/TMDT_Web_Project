/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Product create schema
 */
export type ProductCreate = {
    name: string;
    slug: string;
    sku?: (string | null);
    price: number;
    sale_price?: (number | null);
    stock?: number;
    description?: (string | null);
    short_description?: (string | null);
    thumbnail_url?: (string | null);
    images?: Array<string>;
    dimensions?: (Record<string, any> | null);
    specs?: (Record<string, any> | null);
    weight?: (number | null);
    category_id: number;
    collection_id?: (number | null);
    is_active?: boolean;
    is_featured?: boolean;
};

