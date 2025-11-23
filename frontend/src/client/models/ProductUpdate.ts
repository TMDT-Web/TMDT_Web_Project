/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Product update schema
 */
export type ProductUpdate = {
    name?: (string | null);
    slug?: (string | null);
    sku?: (string | null);
    price?: (number | null);
    sale_price?: (number | null);
    stock?: (number | null);
    description?: (string | null);
    short_description?: (string | null);
    thumbnail_url?: (string | null);
    images?: (Array<string> | null);
    dimensions?: (Record<string, any> | null);
    specs?: (Record<string, any> | null);
    weight?: (number | null);
    category_id?: (number | null);
    collection_id?: (number | null);
    is_active?: (boolean | null);
    is_featured?: (boolean | null);
};

