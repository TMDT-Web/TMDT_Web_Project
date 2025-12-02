/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Password change schema
 */
export type PasswordChange = {
    current_password: string;
    /**
     * New password must be at least 8 characters
     */
    new_password: string;
};

