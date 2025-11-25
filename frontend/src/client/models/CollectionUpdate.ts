/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CollectionItemCreate } from './CollectionItemCreate';
/**
 * Collection update schema
 */
export type CollectionUpdate = {
    name?: (string | null);
    slug?: (string | null);
    banner_url?: (string | null);
    description?: (string | null);
    is_active?: (boolean | null);
    items?: (Array<CollectionItemCreate> | null);
    sale_price?: (number | null);
};

