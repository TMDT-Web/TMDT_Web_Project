// Product API functions
import { api } from "./api";
import type {
  Category,
  Product,
  ProductListResponse,
  ProductSearchQuery,
} from "./types";

export async function getProducts(
  query?: ProductSearchQuery
): Promise<ProductListResponse> {
  const params = new URLSearchParams();

  if (query?.q) params.append("q", query.q);
  if (query?.category_id)
    params.append("category_id", query.category_id.toString());
  if (query?.min_price) params.append("min_price", query.min_price.toString());
  if (query?.max_price) params.append("max_price", query.max_price.toString());
  if (query?.page) params.append("page", query.page.toString());
  if (query?.size) params.append("size", query.size.toString());
  if (query?.tag_ids) {
    query.tag_ids.forEach((id) => params.append("tag_ids", id.toString()));
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/products?${queryString}` : "/products";

  return api.get<ProductListResponse>(endpoint);
}

export async function getProduct(id: number): Promise<Product> {
  return api.get<Product>(`/products/${id}`);
}

export async function getCategories(): Promise<Category[]> {
  return api.get<Category[]>("/categories");
}
