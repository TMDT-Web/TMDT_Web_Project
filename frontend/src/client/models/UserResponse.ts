/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserRole } from './UserRole';
import type { VipTier } from './VipTier';
/**
 * User response schema
 */
export type UserResponse = {
    email: string;
    full_name: string;
    phone?: (string | null);
    avatar_url?: (string | null);
    id: number;
    created_at: string;
    updated_at: string;
    role: UserRole;
    is_active: boolean;
    is_verified: boolean;
    loyalty_points: number;
    vip_tier: VipTier;
    last_login?: (string | null);
};

