// src/api/empleados.js
import { api } from "../api/axios";

export const listEmpleados = (params) => api.get("/api/empleados/", { params });
export const createEmpleado = (payload) => api.post("/api/empleados/", payload);

