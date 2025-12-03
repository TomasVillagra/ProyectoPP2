// src/components/ventas/VentaDetalleInfo.jsx

export default function VentaDetalleInfo({
  venta,
  fmtDate,
  clienteStr,
  empleadoStr,
  estadoStr,
  totalOK,
  money,
  totalCalculado,
}) {
  return (
    <div className="card">
      <div className="grid">
        <div>
          <div className="muted">Fecha/Hora</div>
          <div>{fmtDate(venta.ven_fecha_hora ?? venta.fecha ?? venta.created_at)}</div>
        </div>

        <div>
          <div className="muted">Cliente</div>
          <div>{clienteStr}</div>
        </div>

        <div>
          <div className="muted">Empleado</div>
          <div>{empleadoStr}</div>
        </div>

        <div>
          <div className="muted">Estado</div>
          <div>{String(estadoStr)}</div>
        </div>

        <div>
          <div className="muted">Descripción</div>
          <div>{venta.ven_descripcion ?? venta.descripcion ?? "-"}</div>
        </div>

        <div>
          <div className="muted">Total registrado</div>
          <div style={{ fontWeight: 700 }}>${money(venta.ven_monto ?? venta.monto)}</div>
        </div>

        <div>
          <div className="muted">Total calculado</div>
          <div
            style={{
              fontWeight: 700,
              color: totalOK ? "#22c55e" : "#f97316",
            }}
          >
            ${money(totalCalculado)} {!totalOK && "(≠ registrado)"}
          </div>
        </div>
      </div>
    </div>
  );
}
