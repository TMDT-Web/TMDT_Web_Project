// frontend/lib/types.ts
export type RoleName = "admin" | "manager" | "customer" | (string & {});

export type RoleRead = {
  id: number;
  name: RoleName;
  description?: string | null;
  is_system?: boolean;
};

export type UserRead = {
  id: number;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  is_active: boolean;
  roles: RoleRead[];
};

export type Permission = {
  id: number;
  code: string;
  name?: string | null;
  description?: string | null;
  is_system?: boolean;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export type LoginResponse = TokenPair & { user: UserRead };
