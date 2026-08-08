import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

export { API_URL };

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_ENDPOINTS = [
  "/auth/login/",
  "/auth/register/",
  "/auth/refresh/",
  "/auth/logout/",
  "/auth/verify-email/",
  "/auth/verify-email/confirm/",
];

const isAuthEndpoint = (url?: string) =>
  !!url && AUTH_ENDPOINTS.some((ep) => url.includes(ep));

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token && !isAuthEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const redirectToLogin = () => {
      if (typeof window !== "undefined") {
        const parts = window.location.pathname.split("/").filter(Boolean);
        const locale = parts[0] || "en";
        const section = parts[1] || "";
        const path = window.location.pathname;
        const isProtected = path.includes("/dashboard") || path.includes("/admin") || path.includes("/profile") || path.includes("/settings");
        
        if (isProtected && !path.endsWith("/login")) {
          // If in a protected section, redirect to login
          window.location.href = `/${locale}/login`;
        } else if (!isProtected && !path.endsWith("/login")) {
          // If in a specific landing/service section (e.g. academy, school, curriculum, ebooks), stay or redirect to that section's root
          const landingSections = ["academy", "school", "curriculum", "ebooks", "marketplace", "blog"];
          if (landingSections.includes(section)) {
            window.location.href = `/${locale}/${section}`;
          } else {
            window.location.href = `/${locale}`;
          }
        }
      }
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem("accessToken", data.access);
        if (data.refresh) {
          localStorage.setItem("refreshToken", data.refresh);
        }
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        isRefreshing = false;
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        redirectToLogin();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);
