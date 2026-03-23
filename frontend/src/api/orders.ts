import { apiClient } from "./client";
import type { AdminUser, AdminUserListResponse, BannerAdmin, Order, PostListResponse, RevenueEntry, TopProduct, Voucher } from "../types";

export interface CheckoutPayload {
  payment_method: "cod" | "bank_transfer";
  shipping_address: { name: string; phone: string; address: string; city: string };
  note?: string;
  coupon_code?: string;
}

export interface VoucherValidateResponse {
  valid: boolean;
  discount_amount: number;
  message: string;
}

export const ordersApi = {
  checkout: (data: CheckoutPayload) =>
    apiClient.post<Order>("/api/orders", data),

  list: () => apiClient.get<Order[]>("/api/orders"),

  get: (id: string) => apiClient.get<Order>(`/api/orders/${id}`),

  notifyPayment: (id: string) =>
    apiClient.post<Order>(`/api/orders/${id}/payment/notify`),

  validateVoucher: (code: string) =>
    apiClient.post<VoucherValidateResponse>("/api/vouchers/validate", { code }),
};

export const adminApi = {
  // Products
  listProducts: (params = {}) =>
    apiClient.get("/api/admin/products", { params }),
  createProduct: (data: unknown) =>
    apiClient.post("/api/admin/products", data),
  updateProduct: (id: string, data: unknown) =>
    apiClient.put(`/api/admin/products/${id}`, data),
  deleteProduct: (id: string) =>
    apiClient.delete(`/api/admin/products/${id}`),

  // Orders
  listOrders: (params: { status?: string; payment_status?: string } = {}) =>
    apiClient.get<Order[]>("/api/admin/orders", { params }),
  updateOrderStatus: (id: string, status: string) =>
    apiClient.put<Order>(`/api/admin/orders/${id}/status`, { status }),
  updatePaymentStatus: (id: string, payment_status: string) =>
    apiClient.put<Order>(`/api/admin/orders/${id}/payment-status`, { payment_status }),

  // Stats
  revenue: () => apiClient.get<RevenueEntry[]>("/api/admin/stats/revenue"),
  topProducts: () => apiClient.get<TopProduct[]>("/api/admin/stats/top-products"),

  // Users
  listUsers: (params: { search?: string; role?: string; page?: number; limit?: number } = {}) =>
    apiClient.get<AdminUserListResponse>("/api/admin/users", { params }),
  updateUser: (id: string, data: { role?: string; is_active?: boolean }) =>
    apiClient.patch<AdminUser>(`/api/admin/users/${id}`, data),

  // Posts
  listAdminPosts: (params: { tag?: string; search?: string; sort?: string; page?: number; limit?: number } = {}) =>
    apiClient.get<PostListResponse>("/api/admin/posts", { params }),
  deleteAdminPost: (id: string) =>
    apiClient.delete(`/api/admin/posts/${id}`),

  // User profile (admin edit any user)
  updateUserProfile: (id: string, data: { full_name?: string | null; phone?: string | null; avatar?: string | null; bio?: string | null }) =>
    apiClient.patch<AdminUser>(`/api/admin/users/${id}/profile`, data),

  // Banners
  listBanners: () => apiClient.get<BannerAdmin[]>("/api/admin/banners"),
  createBanner: (data: unknown) => apiClient.post<BannerAdmin>("/api/admin/banners", data),
  updateBanner: (id: number, data: unknown) => apiClient.put<BannerAdmin>(`/api/admin/banners/${id}`, data),
  deleteBanner: (id: number) => apiClient.delete(`/api/admin/banners/${id}`),

  // Vouchers
  listVouchers: () => apiClient.get<Voucher[]>("/api/admin/vouchers"),
  createVoucher: (data: unknown) => apiClient.post<Voucher>("/api/admin/vouchers", data),
  updateVoucher: (id: number, data: unknown) => apiClient.patch<Voucher>(`/api/admin/vouchers/${id}`, data),
  deleteVoucher: (id: number) => apiClient.delete(`/api/admin/vouchers/${id}`),
};
