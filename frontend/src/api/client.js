import axios from "axios";
const baseURL = process.env.REACT_APP_API_BASE || "http://localhost:8000";
export const api = axios.create({ baseURL: baseURL + "/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

