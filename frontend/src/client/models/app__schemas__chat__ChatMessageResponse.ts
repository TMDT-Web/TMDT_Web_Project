/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageSender } from './MessageSender';
/**
 * Chat message response
 */
export type app__schemas__chat__ChatMessageResponse = {
    message: string;
    id: number;
    created_at: string;
    updated_at: string;
    session_id: number;
    sender: MessageSender;
    sender_id?: (number | null);
    is_read: boolean;
};

