/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { app__schemas__chat__ChatMessageResponse } from '../models/app__schemas__chat__ChatMessageResponse';
import type { app__schemas__chat__ChatSessionResponse } from '../models/app__schemas__chat__ChatSessionResponse';
import type { ChatSessionListResponse } from '../models/ChatSessionListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChatService {
    /**
     * Get All Sessions
     * @returns ChatSessionListResponse Successful Response
     * @throws ApiError
     */
    public static getAllSessionsApiV1ChatSessionsGet(): CancelablePromise<ChatSessionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/chat/sessions',
        });
    }
    /**
     * Create Chat Session
     * FIXED:
     * - Mỗi user chỉ có 1 session
     * - Guest không thể tạo session
     * @returns app__schemas__chat__ChatSessionResponse Successful Response
     * @throws ApiError
     */
    public static createChatSessionApiV1ChatSessionsPost(): CancelablePromise<app__schemas__chat__ChatSessionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/chat/sessions',
        });
    }
    /**
     * Get Session Messages
     * Fetch messages for a session
     * @param sessionId
     * @returns app__schemas__chat__ChatMessageResponse Successful Response
     * @throws ApiError
     */
    public static getSessionMessagesApiV1ChatSessionsSessionIdMessagesGet(
        sessionId: string,
    ): CancelablePromise<Array<app__schemas__chat__ChatMessageResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/chat/sessions/{session_id}/messages',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get My Sessions
     * @returns ChatSessionListResponse Successful Response
     * @throws ApiError
     */
    public static getMySessionsApiV1ChatSessionsMyGet(): CancelablePromise<ChatSessionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/chat/sessions/my',
        });
    }
    /**
     * Close Session
     * @param sessionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static closeSessionApiV1ChatSessionsSessionIdClosePost(
        sessionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/chat/sessions/{session_id}/close',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
