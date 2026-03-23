import { apiClient } from "./client";
import type { AttributeType, Category, Product, ProductAttribute, ProductListResponse, ProductReview, ProductVariant } from "../types";

export interface ProductFilters {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export const productsApi = {
  list: (params: ProductFilters = {}) =>
    apiClient.get<ProductListResponse>("/api/products", { params }),

  get: (slug: string) => apiClient.get<Product>(`/api/products/${slug}`),

  categories: () => apiClient.get<Category[]>("/api/products/categories"),

  getReviews: (slug: string) =>
    apiClient.get<ProductReview[]>(`/api/products/${slug}/reviews`),

  submitReview: (slug: string, data: { rating: number; comment?: string | null }) =>
    apiClient.post<ProductReview>(`/api/products/${slug}/reviews`, data),

  deleteReview: (slug: string, reviewId: string) =>
    apiClient.delete(`/api/products/${slug}/reviews/${reviewId}`),

  // Admin category CRUD
  adminListCategories: () =>
    apiClient.get<Category[]>("/api/admin/categories"),
  createCategory: (name: string) =>
    apiClient.post<Category>("/api/admin/categories", { name }),
  updateCategory: (id: number, name: string) =>
    apiClient.patch<Category>(`/api/admin/categories/${id}`, { name }),
  deleteCategory: (id: number) =>
    apiClient.delete(`/api/admin/categories/${id}`),

  // Admin attribute types CRUD
  listAttributeTypes: () =>
    apiClient.get<AttributeType[]>("/api/admin/attribute-types"),
  createAttributeType: (data: { name: string; values: string[]; display_order?: number }) =>
    apiClient.post<AttributeType>("/api/admin/attribute-types", data),
  updateAttributeType: (id: number, data: { name?: string; values?: string[]; display_order?: number }) =>
    apiClient.patch<AttributeType>(`/api/admin/attribute-types/${id}`, data),
  deleteAttributeType: (id: number) =>
    apiClient.delete(`/api/admin/attribute-types/${id}`),

  // Per-product attributes CRUD
  listProductAttributes: (productId: string) =>
    apiClient.get<ProductAttribute[]>(`/api/admin/products/${productId}/attributes`),
  createProductAttribute: (productId: string, data: { name: string; values: string[]; display_order?: number }) =>
    apiClient.post<ProductAttribute>(`/api/admin/products/${productId}/attributes`, data),
  updateProductAttribute: (productId: string, attrId: number, data: { name: string; values: string[]; display_order?: number }) =>
    apiClient.put<ProductAttribute>(`/api/admin/products/${productId}/attributes/${attrId}`, data),
  deleteProductAttribute: (productId: string, attrId: number) =>
    apiClient.delete(`/api/admin/products/${productId}/attributes/${attrId}`),

  // Per-product variants CRUD
  listProductVariants: (productId: string) =>
    apiClient.get<ProductVariant[]>(`/api/admin/products/${productId}/variants`),
  createProductVariant: (productId: string, data: { sku?: string | null; attributes: Record<string, string>; price?: number | null; stock_quantity?: number; is_active?: boolean }) =>
    apiClient.post<ProductVariant>(`/api/admin/products/${productId}/variants`, data),
  updateProductVariant: (productId: string, variantId: string, data: { sku?: string | null; attributes: Record<string, string>; price?: number | null; stock_quantity?: number; is_active?: boolean }) =>
    apiClient.put<ProductVariant>(`/api/admin/products/${productId}/variants/${variantId}`, data),
  deleteProductVariant: (productId: string, variantId: string) =>
    apiClient.delete(`/api/admin/products/${productId}/variants/${variantId}`),
};
