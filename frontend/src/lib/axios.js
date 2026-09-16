import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://realtimechat-2-3fp5.onrender.com/api" : "/api",
  withCredentials: true,
});