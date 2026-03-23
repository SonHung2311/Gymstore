import { apiClient } from "./client";
import type { ChatMessage, Conversation, UserMini } from "../types";

export const chatApi = {
  listConversations: () =>
    apiClient.get<Conversation[]>("/api/conversations"),

  createConversation: (participant_id: string) =>
    apiClient.post<Conversation>("/api/conversations", { participant_id }),

  getMessages: (id: string, before_id?: string) =>
    apiClient.get<ChatMessage[]>(`/api/conversations/${id}/messages`, {
      params: before_id ? { before_id } : undefined,
    }),

  markRead: (id: string) =>
    apiClient.put(`/api/conversations/${id}/read`),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>("/api/conversations/unread-count"),

  searchUsers: (q: string) =>
    apiClient.get<UserMini[]>("/api/auth/users/search", { params: { q } }),

  uploadMedia: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<{ url: string; type: "image" | "video" | "audio" }>(
      "/api/upload",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
};
