/* eslint-disable */

import type { VipTier } from "./VipTier";
import type { UserRole } from "./UserRole";

export type UserResponse = {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  loyalty_points: number;
  vip_tier: VipTier;
  default_address_id?: number;
  created_at: string;
  updated_at: string;
};
