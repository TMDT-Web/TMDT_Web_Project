/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_upload_image_api_v1_upload_image_post } from '../models/Body_upload_image_api_v1_upload_image_post';
import type { Body_upload_multiple_images_api_v1_upload_images_post } from '../models/Body_upload_multiple_images_api_v1_upload_images_post';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UploadService {
    /**
     * Upload Image
     * Upload single image (admin only)
     *
     * Allowed subfolders: products, categories, banners
     * @param formData
     * @param subfolder
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadImageApiV1UploadImagePost(
        formData: Body_upload_image_api_v1_upload_image_post,
        subfolder: string = 'products',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/upload/image',
            query: {
                'subfolder': subfolder,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Image
     * Delete image file (admin only)
     *
     * Provide the URL path returned from upload (e.g., /static/images/products/abc.jpg)
     * @param filePath
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteImageApiV1UploadImageDelete(
        filePath: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/upload/image',
            query: {
                'file_path': filePath,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Multiple Images
     * Upload multiple images (admin only)
     *
     * Max 10 files per request
     * @param formData
     * @param subfolder
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadMultipleImagesApiV1UploadImagesPost(
        formData: Body_upload_multiple_images_api_v1_upload_images_post,
        subfolder: string = 'products',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/upload/images',
            query: {
                'subfolder': subfolder,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
