import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://realtimechat-2-3fp5.onrender.com"
).replace(/\/$/, "");

export const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(async (config) => {
  try {
    if (typeof window !== "undefined" && window.Clerk?.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error("Error attaching Clerk token:", error);
  }
  return config;
});