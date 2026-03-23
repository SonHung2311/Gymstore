import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Attach guest session id for cart operations
  const sessionId = localStorage.getItem("session_id");
  if (sessionId) config.headers["X-Session-Id"] = sessionId;

  return config;
});

// On 401 remove stale token and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);
