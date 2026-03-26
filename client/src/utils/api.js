import axios from "axios";

// Fallback to localhost:5000 for local development if env is missing
const APP_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API = axios.create({
  baseURL: `${APP_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const apiUrl = (path) => `${APP_BASE_URL}${path}`;
