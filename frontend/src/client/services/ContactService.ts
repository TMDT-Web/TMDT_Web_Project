/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContactRequest } from '../models/ContactRequest';
import type { ContactResponse } from '../models/ContactResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ContactService {
    /**
     * Submit Contact Form
     * Submit contact form and send email to admin
     *
     * Public endpoint - no authentication required
     * @param requestBody
     * @returns ContactResponse Successful Response
     * @throws ApiError
     */
    public static submitContactFormApiV1ContactPost(
        requestBody: ContactRequest,
    ): CancelablePromise<ContactResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/contact',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
