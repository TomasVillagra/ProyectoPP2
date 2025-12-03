// src/components/ventas/VentasFilters.jsx
export default function VentasFilters({
  fEstado,
  setFEstado,
  pageSize,
  setPageSize,
}) {
  return (
    <div className="ventas-filtros">
      <select
        value={fEstado}
        onChange={(e) => setFEstado(e.target.value)}
        className="ctl"
      >
        <option value="">Estado (todos)</option>
        <option value="pendiente">Pendiente</option>
        <option value="cobrado">Cobrado</option>
      </select>

      <select
        value={pageSize}
        onChange={(e) => setPageSize(Number(e.target.value))}
        className="ctl"
      >
        {[5, 10, 20, 50].map((n) => (
          <option key={n} value={n}>
            {n}/pág
          </option>
        ))}
      </select>
    </div>
  );
}
