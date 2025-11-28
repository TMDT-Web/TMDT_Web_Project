import type { UserResponse } from "./UserResponse";

export type UserListResponse = {
    users: UserResponse[];
    total: number;

    /** NOTHING ELSE HERE */
};
