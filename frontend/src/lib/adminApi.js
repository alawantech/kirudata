import axios from "axios";
import { invalidateAll } from "./cache";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v2";

/**
 * Admin-specific Axios instance.
 * Automatically attempts a token refresh on 401 responses, then retries
 * the original request once. If the refresh also fails, the error is
 * re-thrown so callers can handle it (e.g. redirect to login).
 *
 * After any successful mutation (POST/PUT/DELETE/PATCH), the public-facing
 * cache is cleared so user-facing screens pick up admin changes immediately.
 */
const adminApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error) {
  refreshQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve()));
  refreshQueue = [];
}

adminApi.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    if (method && ["post", "put", "delete", "patch"].includes(method)) {
      invalidateAll();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once per request
    if (
      error.response?.status === 401 &&
      !originalRequest._retried &&
      // Never retry the refresh endpoint itself (prevent infinite loop)
      !originalRequest.url?.includes("/admin/auth/refresh") &&
      // Never retry the login / OTP endpoints
      !originalRequest.url?.includes("/admin/auth/login") &&
      !originalRequest.url?.includes("/admin/auth/verify-otp")
    ) {
      originalRequest._retried = true;

      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then(() => adminApi(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        await adminApi.post("/admin/auth/refresh");
        processQueue(null);
        // Retry the original request with the new access-token cookie
        return adminApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;
