import React from "react";

export default function ComprasListFilters({
  q,
  setQ,
  fProv,
  setFProv,
  fEstado,
  setFEstado,
  orderBy,
  setOrderBy,
  pageSize,
  setPageSize,
  estados,
  proveedores,
}) {
  return (
    <div className="filters">
      <input
        className="ctl"
        placeholder="Buscar (ID, desc., empleado, proveedor)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select
        className="ctl"
        value={fProv}
        onChange={(e) => setFProv(e.target.value)}
      >
        <option value="">Proveedor (todos)</option>
        {proveedores.map((p) => (
          <option key={p.id_proveedor} value={p.id_proveedor}>
            {p.prov_nombre}
          </option>
        ))}
      </select>
      <select
        className="ctl"
        value={fEstado}
        onChange={(e) => setFEstado(e.target.value)}
      >
        <option value="">Estado (todos)</option>
        {estados.map((e) => (
          <option
            key={e.id_estado_compra ?? e.id}
            value={e.estcom_nombre ?? e.nombre}
          >
            {e.estcom_nombre ?? e.nombre}
          </option>
        ))}
      </select>

      <select
        className="ctl"
        value={orderBy}
        onChange={(e) => setOrderBy(e.target.value)}
        title="Ordenar por"
      >
        <option value="fecha_desc">Fecha (más cerca → más lejos)</option>
        <option value="fecha_asc">Fecha (más lejos → más cerca)</option>
        <option value="monto_asc">Monto (menor → mayor)</option>
        <option value="monto_desc">Monto (mayor → menor)</option>
      </select>

      <div className="spacer" />
      <select
        className="ctl"
        value={pageSize}
        onChange={(e) => setPageSize(Number(e.target.value))}
        style={{ width: 90 }}
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
