/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Notification preference response
 */
export type NotificationPreferenceResponse = {
    email_enabled?: boolean;
    sms_enabled?: boolean;
    push_enabled?: boolean;
    order_updates?: boolean;
    promotions?: boolean;
    id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
};

