// src/api/axios.js
import axios from "axios";

// Detecta el backend (usa tu .env o el host local)
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  `http://${window.location.hostname}:8000`;

// Instancia principal de axios
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Necesario para enviar cookies (sessionid, csrftoken)
});

// 🧩 Interceptor: agrega automáticamente el CSRF token en POST/PUT/DELETE
api.interceptors.request.use((config) => {
  const method = config.method && config.method.toUpperCase();

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    // Buscar cookie csrftoken en el navegador
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    const token = match ? match[1] : null;

    if (token) {
      config.headers["X-CSRFToken"] = token; // Django espera este header
    }
  }

  return config;
});

// ✅ Export default (por compatibilidad)
export default api;