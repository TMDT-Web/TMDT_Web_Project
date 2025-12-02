/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryCreate } from '../models/CategoryCreate';
import type { CategoryResponse } from '../models/CategoryResponse';
import type { CategoryUpdate } from '../models/CategoryUpdate';
import type { ProductCreate } from '../models/ProductCreate';
import type { ProductListResponse } from '../models/ProductListResponse';
import type { ProductResponse } from '../models/ProductResponse';
import type { ProductUpdate } from '../models/ProductUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductsService {
    /**
     * Get Products
     * Get all products with filters
     * @returns ProductListResponse Successful Response
     * @throws ApiError
     */
    public static getProductsApiV1ProductsGet({
        skip,
        limit = 20,
        categoryId,
        collectionId,
        search,
        isFeatured,
        minPrice,
        maxPrice,
    }: {
        skip?: number,
        limit?: number,
        categoryId?: (number | null),
        collectionId?: (number | null),
        search?: (string | null),
        isFeatured?: (boolean | null),
        minPrice?: (number | null),
        maxPrice?: (number | null),
    }): CancelablePromise<ProductListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products',
            query: {
                'skip': skip,
                'limit': limit,
                'category_id': categoryId,
                'collection_id': collectionId,
                'search': search,
                'is_featured': isFeatured,
                'min_price': minPrice,
                'max_price': maxPrice,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Product
     * Create new product (admin only)
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static createProductApiV1ProductsPost({
        requestBody,
    }: {
        requestBody: ProductCreate,
    }): CancelablePromise<ProductResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/products',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Product
     * Get product by ID
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static getProductApiV1ProductsProductIdGet({
        productId,
    }: {
        productId: number,
    }): CancelablePromise<ProductResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products/{product_id}',
            path: {
                'product_id': productId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Product
     * Update product (admin only)
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static updateProductApiV1ProductsProductIdPut({
        productId,
        requestBody,
    }: {
        productId: number,
        requestBody: ProductUpdate,
    }): CancelablePromise<ProductResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/products/{product_id}',
            path: {
                'product_id': productId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Product
     * Delete product (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteProductApiV1ProductsProductIdDelete({
        productId,
    }: {
        productId: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/products/{product_id}',
            path: {
                'product_id': productId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Product By Slug
     * Get product by slug
     * @returns ProductResponse Successful Response
     * @throws ApiError
     */
    public static getProductBySlugApiV1ProductsSlugSlugGet({
        slug,
    }: {
        slug: string,
    }): CancelablePromise<ProductResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products/slug/{slug}',
            path: {
                'slug': slug,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Categories
     * Get all categories
     * @returns CategoryResponse Successful Response
     * @throws ApiError
     */
    public static getCategoriesApiV1ProductsCategoriesGet(): CancelablePromise<Array<CategoryResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/products/categories/',
        });
    }
    /**
     * Create Category
     * Create new category (admin only)
     * @returns CategoryResponse Successful Response
     * @throws ApiError
     */
    public static createCategoryApiV1ProductsCategoriesPost({
        requestBody,
    }: {
        requestBody: CategoryCreate,
    }): CancelablePromise<CategoryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/products/categories/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Category
     * Update category (admin only)
     * @returns CategoryResponse Successful Response
     * @throws ApiError
     */
    public static updateCategoryApiV1ProductsCategoriesCategoryIdPut({
        categoryId,
        requestBody,
    }: {
        categoryId: number,
        requestBody: CategoryUpdate,
    }): CancelablePromise<CategoryResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/products/categories/{category_id}',
            path: {
                'category_id': categoryId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Category
     * Delete category (admin only)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteCategoryApiV1ProductsCategoriesCategoryIdDelete({
        categoryId,
    }: {
        categoryId: number,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/products/categories/{category_id}',
            path: {
                'category_id': categoryId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
