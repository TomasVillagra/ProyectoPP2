import { api } from "./client";
export async function ventasHoy() { const { data } = await api.get("/ventas/hoy/"); return data; }
export async function crearMovimiento(payload) { const { data } = await api.post("/movimientos-caja/", payload); return data; }
export async function resumenTurno() { const { data } = await api.get("/movimientos-caja/turno/"); return data; }
