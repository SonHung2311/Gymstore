import { apiClient } from "./client";
import type { Comment, HomeData, Post, PostListResponse, User, UserPublicProfile } from "../types";

export interface PostFilters {
  tag?: string;
  sort?: "new" | "hot";
  page?: number;
  limit?: number;
  user_id?: string;
}

export interface UserProfileUpdatePayload {
  full_name?: string | null;
  phone?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

export interface OgPreviewData {
  title: string | null;
  image: string | null;
  description: string | null;
  site_name: string | null;
  url: string;
  favicon: string | null;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  image_url?: string;
  tags: string[];
}

export const communityApi = {
  posts: (params: PostFilters = {}) =>
    apiClient.get<PostListResponse>("/api/community/posts", { params }),

  getPost: (id: string) => apiClient.get<Post>(`/api/community/posts/${id}`),

  createPost: (data: CreatePostPayload) =>
    apiClient.post<Post>("/api/community/posts", data),

  updatePost: (id: string, data: Partial<CreatePostPayload>) =>
    apiClient.put<Post>(`/api/community/posts/${id}`, data),

  deletePost: (id: string) => apiClient.delete(`/api/community/posts/${id}`),

  toggleLike: (id: string) =>
    apiClient.post<{ liked: boolean }>(`/api/community/posts/${id}/like`),

  getComments: (id: string) =>
    apiClient.get<Comment[]>(`/api/community/posts/${id}/comments`),

  addComment: (id: string, content: string) =>
    apiClient.post<Comment>(`/api/community/posts/${id}/comments`, { content }),

  deleteComment: (commentId: string) =>
    apiClient.delete(`/api/community/comments/${commentId}`),

  getUserProfile: (userId: string) =>
    apiClient.get<UserPublicProfile>(`/api/community/users/${userId}`),

  updateProfile: (data: UserProfileUpdatePayload) =>
    apiClient.patch<User>("/api/community/profile", data),

  getOgPreview: (url: string) =>
    apiClient.get<OgPreviewData>("/api/og-preview", { params: { url } }),
};

export const uploadApi = {
  uploadMedia: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<{ url: string; type: "image" | "video" }>("/api/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
};

export const homeApi = {
  getData: () => apiClient.get<HomeData>("/api/home"),
};
