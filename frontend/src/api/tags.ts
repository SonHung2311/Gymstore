import { apiClient } from "./client";
import type { Tag } from "../types";

export interface TagCreatePayload {
  name: string;
  color?: string;
  is_active?: boolean;
}

export interface TagUpdatePayload {
  name?: string;
  color?: string;
  is_active?: boolean;
}

export const tagsApi = {
  /** Public: active tags only */
  list: () => apiClient.get<Tag[]>("/api/tags"),

  /** Admin: all tags including inactive */
  listAdmin: () => apiClient.get<Tag[]>("/api/tags/admin"),

  create: (data: TagCreatePayload) => apiClient.post<Tag>("/api/tags", data),

  update: (id: number, data: TagUpdatePayload) =>
    apiClient.patch<Tag>(`/api/tags/${id}`, data),

  delete: (id: number) => apiClient.delete(`/api/tags/${id}`),
};
