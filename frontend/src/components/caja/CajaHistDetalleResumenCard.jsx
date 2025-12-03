import React from "react";

export default function CajaHistDetalleResumenCard({
  detalle,
  empApertura,
  empCierre,
  money,
  fmtDateTime,
}) {
  return (
    <div className="card-dark">
      <div className="caja-hist-resumen-grid">
        <div>
          <div className="label">Apertura</div>
          <div>{fmtDateTime(detalle.apertura_fecha)}</div>
        </div>
        <div>
          <div className="label">Empleado apertura</div>
          <div>{empApertura}</div>
        </div>
        <div>
          <div className="label">Cierre</div>
          <div>{fmtDateTime(detalle.cierre_fecha)}</div>
        </div>
        <div>
          <div className="label">Empleado cierre</div>
          <div>{empCierre}</div>
        </div>
        <div>
          <div className="label">Monto apertura</div>
          <div>${money(detalle.monto_apertura)}</div>
        </div>
        <div>
          <div className="label">Ingresos</div>
          <div className="res-num ok">
            ${money(detalle.ingresos)}
          </div>
        </div>
        <div>
          <div className="label">Egresos</div>
          <div className="res-num err">
            ${money(detalle.egresos)}
          </div>
        </div>
        <div>
          <div className="label">Total final</div>
          <div
            className="res-num"
            style={{
              color:
                Number(detalle.total_final) >= 0
                  ? "#22c55e"
                  : "#f97316",
            }}
          >
            {Number(detalle.total_final) >= 0 ? "+" : "-"}$
            {money(Math.abs(Number(detalle.total_final) || 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
