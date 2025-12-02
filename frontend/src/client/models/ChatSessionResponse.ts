/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageResponse } from './ChatMessageResponse';
import type { ChatStatus } from './ChatStatus';
/**
 * Chat session response
 */
export type ChatSessionResponse = {
    session_id: string;
    id: number;
    created_at: string;
    updated_at: string;
    user_id?: (number | null);
    username?: (string | null);
    status: ChatStatus;
    admin_id?: (number | null);
    messages?: Array<ChatMessageResponse>;
};

