/* eslint-disable */
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { UserListResponse } from "../models/UserListResponse";
import type { UserUpdate } from "../models/UserUpdate";

export class UsersService {
  /** ADMIN: get all users */
  public static async getAll(): Promise<UserListResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/admin",
    }) as Promise<UserListResponse>;
  }

  /** ADMIN: update user */
  public static updateUser(userId: number, data: UserUpdate) {
    return __request(OpenAPI, {
      method: "PUT",
      url: `/api/v1/users/admin/${userId}`,
      body: data,
      mediaType: "application/json",
    });
  }

  /** ADMIN: update active status */
  public static updateStatus(userId: number, is_active: boolean) {
    return __request(OpenAPI, {
      method: "PUT",
      url: `/api/v1/users/admin/${userId}/status`,
      query: { is_active },
    });
  }

  /** ADMIN: upgrade VIP tier */
  public static upgradeVip(userId: number) {
    return __request(OpenAPI, {
      method: "PUT",
      // backend endpoint is defined as PUT /api/v1/users/admin/{user_id}/upgrade-vip
      url: `/api/v1/users/admin/${userId}/upgrade-vip`,
    });
  }
}
  