/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { app__schemas__chat__ChatMessageResponse } from './app__schemas__chat__ChatMessageResponse';
import type { ChatStatus } from './ChatStatus';
/**
 * Chat session response
 */
export type app__schemas__chat__ChatSessionResponse = {
    session_id: string;
    id: number;
    created_at: string;
    updated_at: string;
    user_id?: (number | null);
    username?: (string | null);
    vip_tier?: (string | null);
    status: ChatStatus;
    admin_id?: (number | null);
    messages?: Array<app__schemas__chat__ChatMessageResponse>;
};

