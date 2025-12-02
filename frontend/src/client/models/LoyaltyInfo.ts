/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VipTier } from './VipTier';
/**
 * Loyalty program information
 */
export type LoyaltyInfo = {
    current_points: number;
    current_tier: VipTier;
    next_tier?: (VipTier | null);
    points_to_next_tier?: (number | null);
    tier_discount: number;
};

