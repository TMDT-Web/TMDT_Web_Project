/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Notification response
 */
export type NotificationResponse = {
    event_type: string;
    title: string;
    message: string;
    data?: (Record<string, any> | null);
    id: number;
    user_id: number;
    read: boolean;
    created_at: string;
};

