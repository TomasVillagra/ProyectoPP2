import { api } from "./client";
export async function listOrders(params = {}) { const { data } = await api.get("/pedidos/", { params }); return data; }
export async function getOrder(id) { const { data } = await api.get(`/pedidos/${id}/`); return data; }
export async function createOrder(payload) { const { data } = await api.post("/pedidos/", payload); return data; }
export async function updateOrder(id, payload) { const { data } = await api.put(`/pedidos/${id}/`, payload); return data; }
export async function deleteOrder(id) { await api.delete(`/pedidos/${id}/`); }

