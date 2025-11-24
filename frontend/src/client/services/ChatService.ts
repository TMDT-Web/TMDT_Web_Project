/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatSessionListResponse } from '../models/ChatSessionListResponse';
import type { ChatSessionResponse } from '../models/ChatSessionResponse';
import type { ChatMessageResponse } from '../models/ChatMessageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChatService {
    /**
     * Get All Sessions
     * Get all chat sessions (admin only)
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
     * Create new chat session
     * @returns ChatSessionResponse Successful Response
     * @throws ApiError
     */
    public static createChatSessionApiV1ChatSessionsPost(): CancelablePromise<ChatSessionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/chat/sessions',
        });
    }
    /**
     * Get My Sessions
     * Get current user's chat sessions
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
     * Get Session Messages
     * Get all messages for a chat session
     * @param sessionId
     * @returns ChatMessageResponse Successful Response
     * @throws ApiError
     */
    public static getSessionMessagesApiV1ChatSessionsSessionIdMessagesGet(
        sessionId: string,
    ): CancelablePromise<Array<ChatMessageResponse>> {
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
     * Close Session
     * Close chat session (admin only)
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
