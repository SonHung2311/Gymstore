import { apiClient } from "./client";
import type { Cart } from "../types";

export const cartApi = {
  get: () => apiClient.get<Cart>("/api/cart"),

  addItem: (product_id: string, quantity = 1, variant_id?: string) =>
    apiClient.post<Cart>("/api/cart/items", { product_id, quantity, variant_id }),

  updateItem: (itemId: number, quantity: number) =>
    apiClient.put<Cart>(`/api/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: number) =>
    apiClient.delete<Cart>(`/api/cart/items/${itemId}`),

  merge: (session_id: string) =>
    apiClient.post<Cart>("/api/cart/merge", { session_id }),
};
