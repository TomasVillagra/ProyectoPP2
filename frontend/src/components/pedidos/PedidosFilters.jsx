// src/components/pedidos/PedidosFilters.jsx

export default function PedidosFilters({
  q,
  setQ,
  fMesa,
  setFMesa,
  fEmp,
  setFEmp,
  fTipo,
  setFTipo,
  fEstado,
  setFEstado,
  opcionesMesa,
  opcionesEmpleado,
  opcionesTipo,
  opcionesEstado,
  orderBy,
  setOrderBy,
  pageSize,
  setPageSize,
}) {
  return (
    <div className="filters">
      <input
        className="ctl"
        placeholder="Buscar (ID, mesa, empleado, tipo, estado)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <select
        className="ctl"
        value={fMesa}
        onChange={(e) => setFMesa(e.target.value)}
      >
        <option value="">Mesa (todas)</option>
        {opcionesMesa.map((m) => (
          <option key={m} value={m}>
            Mesa {m}
          </option>
        ))}
      </select>

      <select
        className="ctl"
        value={fEmp}
        onChange={(e) => setFEmp(e.target.value)}
      >
        <option value="">Empleado (todos)</option>
        {opcionesEmpleado.map((emp) => (
          <option key={emp} value={emp}>
            {emp}
          </option>
        ))}
      </select>

      <select
        className="ctl"
        value={fTipo}
        onChange={(e) => setFTipo(e.target.value)}
      >
        <option value="">Tipo (todos)</option>
        {opcionesTipo.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        className="ctl"
        value={fEstado}
        onChange={(e) => setFEstado(e.target.value)}
      >
        <option value="">Estado (todos)</option>
        {opcionesEstado.map((est) => (
          <option key={est} value={est}>
            {est}
          </option>
        ))}
      </select>

      <select
        className="ctl"
        value={orderBy}
        onChange={(e) => setOrderBy(e.target.value)}
        title="Orden por fecha de inicio"
      >
        <option value="fecha_desc">Fecha (más cerca → más lejos)</option>
        <option value="fecha_asc">Fecha (más lejos → más cerca)</option>
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
