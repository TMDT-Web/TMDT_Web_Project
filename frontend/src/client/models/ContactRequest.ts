/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Contact form submission request
 */
export type ContactRequest = {
    /**
     * Full name
     */
    name: string;
    /**
     * Email address
     */
    email: string;
    /**
     * Phone number (optional)
     */
    phone?: string;
    /**
     * Contact subject category
     */
    subject: ContactRequest.subject;
    /**
     * Message content
     */
    message: string;
};
export namespace ContactRequest {
    /**
     * Contact subject category
     */
    export enum subject {
        PRODUCT_INQUIRY = 'product_inquiry',
        ORDER_SUPPORT = 'order_support',
        DELIVERY = 'delivery',
        WARRANTY_RETURN = 'warranty_return',
        PARTNERSHIP = 'partnership',
        OTHER = 'other',
    }
}

