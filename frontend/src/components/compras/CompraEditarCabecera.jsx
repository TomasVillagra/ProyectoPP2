import React from "react";

export default function CompraEditarCabecera({
  form,
  empleados,
  estados,
  proveedores,
}) {
  return (
    <>
      {/* Empleado (solo lectura) */}
      <div className="row">
        <label>Empleado =</label>
        <select
          name="id_empleado"
          value={form.id_empleado}
          disabled
        >
          <option value="">-- Seleccioná --</option>
          {empleados.map((e) => (
            <option
              key={e.id_empleado ?? e.id}
              value={e.id_empleado ?? e.id}
            >
              {(e.emp_nombre ?? e.nombre ?? "") +
                " " +
                (e.emp_apellido ?? e.apellido ?? "")}
            </option>
          ))}
        </select>
      </div>

      {/* Proveedor (solo lectura) */}
      <div className="row">
        <label>Proveedor =</label>
        <select
          name="id_proveedor"
          value={form.id_proveedor}
          disabled
        >
          <option value="">-- Seleccioná --</option>
          {proveedores
            .filter((p) => {
              const est = String(
                p.estado_nombre ?? p.prov_estado ?? ""
              ).toLowerCase();
              const idEst = Number(p.id_estado_proveedor ?? p.estado ?? 0);
              const isActivo = est === "activo" || idEst === 1;
              const idProv = String(p.id_proveedor ?? p.id ?? "");
              return isActivo || idProv === String(form.id_proveedor);
            })
            .map((p) => (
              <option
                key={p.id_proveedor ?? p.id}
                value={p.id_proveedor ?? p.id}
              >
                {p.prov_nombre ?? p.nombre}
              </option>
            ))}
        </select>
      </div>

      {/* Estado (solo lectura) */}
      <div className="row">
        <label>Estado =</label>
        <select
          name="id_estado_compra"
          value={form.id_estado_compra}
          disabled
        >
          <option value="">-- Seleccioná --</option>
          {estados.map((s) => (
            <option
              key={s.id_estado_compra ?? s.id}
              value={s.id_estado_compra ?? s.id}
            >
              {s.estcom_nombre ?? s.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Descripción (solo lectura) */}
      <div className="row">
        <label>Descripción =</label>
        <input
          name="com_descripcion"
          value={form.com_descripcion}
          readOnly
        />
      </div>

      {/* Fecha / Hora (solo lectura) */}
      <div className="row">
        <label>Fecha/Hora =</label>
        <input
          name="com_fecha_hora"
          value={form.com_fecha_hora}
          readOnly
        />
      </div>

      {/* Pagado (solo lectura) */}
      <div className="row">
        <label>Pagado =</label>
        <select
          name="com_pagado"
          value={form.com_pagado}
          disabled
        >
          <option value="2">No</option>
          <option value="1">Sí</option>
        </select>
      </div>
    </>
  );
}
