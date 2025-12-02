/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Create push subscription
 */
export type PushSubscriptionCreate = {
    endpoint: string;
    /**
     * Encryption key
     */
    p256dh: string;
    /**
     * Auth secret
     */
    auth: string;
    user_agent?: (string | null);
};

