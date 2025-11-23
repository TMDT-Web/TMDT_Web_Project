/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Address create schema
 */
export type AddressCreate = {
    /**
     * Nickname (e.g., Home, Office)
     */
    name: string;
    receiver_name: string;
    receiver_phone: string;
    address_line: string;
    ward?: (string | null);
    district: string;
    city: string;
    postal_code?: (string | null);
    notes?: (string | null);
    is_default?: boolean;
};

