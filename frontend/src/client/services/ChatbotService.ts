/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { app__api__api_v1__endpoints__chatbot__ChatSessionResponse } from '../models/app__api__api_v1__endpoints__chatbot__ChatSessionResponse';
import type { ChatHistoryResponse } from '../models/ChatHistoryResponse';
import type { ChatMessageCreate } from '../models/ChatMessageCreate';
import type { ChatSendResponse } from '../models/ChatSendResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChatbotService {
    /**
     * Start Chat Session
     * Start a new chat session or get existing one
     * Works for both authenticated and guest users
     * @returns app__api__api_v1__endpoints__chatbot__ChatSessionResponse Successful Response
     * @throws ApiError
     */
    public static startChatSessionApiV1ChatbotStartPost(): CancelablePromise<app__api__api_v1__endpoints__chatbot__ChatSessionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/chatbot/start',
        });
    }
    /**
     * Send Chat Message
     * Send a message and get automatic bot response
     * @param sessionId
     * @param requestBody
     * @returns ChatSendResponse Successful Response
     * @throws ApiError
     */
    public static sendChatMessageApiV1ChatbotSessionIdMessagesPost(
        sessionId: string,
        requestBody: ChatMessageCreate,
    ): CancelablePromise<ChatSendResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/chatbot/{session_id}/messages',
            path: {
                'session_id': sessionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Chat History
     * Get chat history for a session
     * @param sessionId
     * @returns ChatHistoryResponse Successful Response
     * @throws ApiError
     */
    public static getChatHistoryApiV1ChatbotSessionIdHistoryGet(
        sessionId: string,
    ): CancelablePromise<ChatHistoryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/chatbot/{session_id}/history',
            path: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
