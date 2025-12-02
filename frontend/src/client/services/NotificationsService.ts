/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationPreferenceResponse } from '../models/NotificationPreferenceResponse';
import type { NotificationPreferenceUpdate } from '../models/NotificationPreferenceUpdate';
import type { NotificationResponse } from '../models/NotificationResponse';
import type { PushSubscriptionCreate } from '../models/PushSubscriptionCreate';
import type { PushSubscriptionResponse } from '../models/PushSubscriptionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotificationsService {
    /**
     * Get Notification Preferences
     * Get current user's notification preferences
     * @returns NotificationPreferenceResponse Successful Response
     * @throws ApiError
     */
    public static getNotificationPreferencesApiV1NotificationsPreferencesGet(): CancelablePromise<NotificationPreferenceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/notifications/preferences',
        });
    }
    /**
     * Update Notification Preferences
     * Update notification preferences
     * @param requestBody
     * @returns NotificationPreferenceResponse Successful Response
     * @throws ApiError
     */
    public static updateNotificationPreferencesApiV1NotificationsPreferencesPut(
        requestBody: NotificationPreferenceUpdate,
    ): CancelablePromise<NotificationPreferenceResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/notifications/preferences',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Notifications
     * Get user notifications
     * @param limit
     * @param unreadOnly
     * @returns NotificationResponse Successful Response
     * @throws ApiError
     */
    public static getNotificationsApiV1NotificationsGet(
        limit: number = 50,
        unreadOnly: boolean = false,
    ): CancelablePromise<Array<NotificationResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/notifications/',
            query: {
                'limit': limit,
                'unread_only': unreadOnly,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Mark Notification Read
     * Mark notification as read
     * @param notificationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static markNotificationReadApiV1NotificationsNotificationIdReadPost(
        notificationId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/notifications/{notification_id}/read',
            path: {
                'notification_id': notificationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Subscribe Push
     * Subscribe to push notifications
     * @param requestBody
     * @returns PushSubscriptionResponse Successful Response
     * @throws ApiError
     */
    public static subscribePushApiV1NotificationsPushSubscribePost(
        requestBody: PushSubscriptionCreate,
    ): CancelablePromise<PushSubscriptionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/notifications/push/subscribe',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Send Test Email
     * Send a test notification email to current user
     * @returns any Successful Response
     * @throws ApiError
     */
    public static sendTestEmailApiV1NotificationsTestEmailPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/notifications/test-email',
        });
    }
}
