// src/utils/dashboardUtils.js

/* ============================
   Utilidades compartidas
   ============================ */

export const toNum = (v) => {
  if (v === null || v === undefined || v === "") return NaN;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).trim().replace(",", "."));
  return Number.isNaN(n) ? NaN : n;
};

export const money = (v) => {
  const n = toNum(v);
  if (Number.isNaN(n)) return "$ 0";
  return `$ ${n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const isActive = (val) => {
  if (val === null || val === undefined || val === "") return true;
  return Number(val) === 1;
};

export const esCritico = (item) => {
  if (!isActive(item?.id_estado_insumo)) return false; // Solo activos
  const actual = toNum(item?.ins_stock_actual);
  const repo = toNum(item?.ins_punto_reposicion);
  return !Number.isNaN(actual) && !Number.isNaN(repo) && actual < repo;
};

// 🔹 Estrategia simple: pedir muchos en una sola página
export async function fetchAllInsumos(apiInstance) {
  const url = "/api/insumos/?page_size=1000&format=json";
  const res = await apiInstance.get(url);
  const data = res.data;
  const items = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];
  return items;
}

/* ============================
   Helpers para pedidos
   ============================ */

export const normalizeList = (raw) => {
  if (!raw) return [];
  const data = raw.data ?? raw;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

export const lower = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const clean = (s) => lower(s).trim();

export const estadoNombreDe = (r) =>
  clean(
    r.estado_nombre ?? r.estped_nombre ?? r.estado ?? r.id_estado_pedido
  );

export const esEnProceso = (r) => estadoNombreDe(r) === "en proceso";
