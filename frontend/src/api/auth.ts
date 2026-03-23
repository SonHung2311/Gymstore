import { apiClient } from "./client";
import type { User } from "../types";

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { email: string; password: string; full_name?: string; phone?: string }

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<{ access_token: string }>("/api/auth/login", data),

  register: (data: RegisterPayload) =>
    apiClient.post<{ access_token: string }>("/api/auth/register", data),

  forgotPassword: (email: string) =>
    apiClient.post("/api/auth/forgot-password", { email }),

  resetPassword: (token: string, new_password: string) =>
    apiClient.post("/api/auth/reset-password", { token, new_password }),

  me: () => apiClient.get<User>("/api/auth/me"),
};
