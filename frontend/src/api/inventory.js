import { api } from "./client";
export async function listInsumos(params = {}) { const { data } = await api.get("/insumos/", { params }); return data; }
