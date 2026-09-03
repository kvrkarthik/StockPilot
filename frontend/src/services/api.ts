import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "/api/v1", timeout: 15000 });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === "string" && response.data.trim().startsWith("<!")) {
      return Promise.reject(new Error("API server not reachable. Please configure VITE_API_URL or check your backend server."));
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status !== 401 || !original || original._retried || original.url?.includes("/auth/")) {
      return Promise.reject(error);
    }
    original._retried = true;
    refreshPromise ??= axios
      .post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: localStorage.getItem("refresh_token") })
      .then(({ data }) => {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        return data.access_token as string;
      })
      .finally(() => { refreshPromise = null; });
    try {
      original.headers.Authorization = `Bearer ${await refreshPromise}`;
      return api(original);
    } catch {
      localStorage.clear();
      window.location.assign("/login");
      return Promise.reject(error);
    }
  },
);

export function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (axios.isAxiosError(error)) return error.response?.data?.detail ?? error.message;
  if (typeof error === "object" && error !== null) {
    if ("detail" in error && typeof (error as any).detail === "string") return (error as any).detail;
    if ("message" in error && typeof (error as any).message === "string") return (error as any).message;
  }
  return error instanceof Error ? error.message : "An unexpected error occurred";
}
export default api;

