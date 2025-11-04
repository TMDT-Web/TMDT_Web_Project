// TypeScript types matching backend schemas

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface ProductImage {
  id: number;
  file_path: string;
  alt_text: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  specifications: Record<string, any> | null;
  main_image: string | null;
  is_active: boolean;
  category: Category | null;
  tags: Tag[];
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductListItem {
  id: number;
  name: string;
  price: number;
  main_image: string | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface ProductListResponse {
  items: ProductListItem[];
  total: number;
  page: number;
  size: number;
}

export interface ProductSearchQuery {
  q?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  tag_ids?: number[];
  page?: number;
  size?: number;
}
