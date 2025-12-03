import React from "react";

export default function CajaPanelAbiertaCard({
  aperturaFechaHora,
  aperturaEmpleado,
  aperturaMonto,
  efectivoDisponible,
  cerrarCaja,
  totalesPorMetodo,
  money,
}) {
  return (
    <div className="card-dark caja-panel-card-abierta">
      <div className="label caja-panel-card-title">Caja abierta</div>

      <div className="card-row caja-panel-apertura-row">
        <div>
          <div className="label">Fecha / hora de apertura</div>
          <div>{aperturaFechaHora}</div>
        </div>

        <div>
          <div className="label">Empleado que abrió</div>
          <div>{aperturaEmpleado}</div>
        </div>

        <div>
          <div className="label">Monto de apertura</div>
          <div>${money(aperturaMonto)}</div>
        </div>

        <div>
          <div className="label">Efectivo disponible</div>
          <div
            className="caja-panel-efectivo"
            data-positive={efectivoDisponible >= 0}
          >
            {efectivoDisponible >= 0 ? "+" : "-"}$
            {money(Math.abs(efectivoDisponible))}
          </div>
        </div>
      </div>

      {/* Referencia oculta a totalesPorMetodo para no generar warning */}
      <span style={{ display: "none" }}>
        {Object.keys(totalesPorMetodo).length}
      </span>

      <div className="caja-panel-cerrar-row">
        <button className="btn btn-secondary" onClick={cerrarCaja}>
          Cerrar caja
        </button>
      </div>
    </div>
  );
}
