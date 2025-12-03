import React from "react";

export default function CompraDatosGenerales({
  empleadoDisplay,
  proveedores,
  form,
  onChange,
  estadoNombre,
  cajaAbierta,
}) {
  return (
    <>
      {/* Empleado */}
      <div className="row">
        <label>Empleado =</label>
        <input value={empleadoDisplay} disabled />
      </div>

      {/* Proveedor (solo activos) */}
      <div className="row">
        <label>Proveedor =</label>
        <select
          name="id_proveedor"
          value={form.id_proveedor}
          onChange={onChange}
          required
          disabled={!cajaAbierta}
        >
          <option value="">-- Seleccioná --</option>
          {proveedores.map((p) => (
            <option key={p.id_proveedor} value={p.id_proveedor}>
              {p.prov_nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Estado */}
      <div className="row">
        <label>Estado =</label>
        <input value={estadoNombre || "En Proceso"} disabled />
      </div>

      {/* Fecha/hora */}
      <div className="row">
        <label>Fecha y hora =</label>
        <input
          value="Se tomará la del momento de registro"
          disabled
        />
      </div>

      {/* Descripción */}
      <div className="row">
        <label>Descripción =</label>
        <input
          name="com_descripcion"
          value={form.com_descripcion}
          onChange={onChange}
          placeholder="Opcional"
          disabled={!cajaAbierta}
        />
      </div>

      {/* Pagado */}
      <div className="row">
        <label>Pagado =</label>
        <select
          name="com_pagado"
          value={form.com_pagado}
          onChange={onChange}
          disabled={!cajaAbierta}
        >
          <option value="2">No</option>
        </select>
      </div>
    </>
  );
}
