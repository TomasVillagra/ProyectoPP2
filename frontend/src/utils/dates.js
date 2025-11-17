// utils/dates.js
export const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  // dd/mm/yyyy HH:MM
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
};

export const formatCurrencyAR = (n) => {
  if (n == null) return "$ 0,00";
  const num = Number(n);
  return num.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
};

// helper simple para paginación de arrays ya cargados
export const paginate = (items, page, perPage) => {
  const total = items.length;
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    data: items.slice(start, end),
  };
};
