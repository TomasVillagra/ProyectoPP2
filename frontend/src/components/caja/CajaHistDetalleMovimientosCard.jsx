import React from "react";

export default function CajaHistDetalleMovimientosCard({
  movimientos,
  fmtDateTime,
  money,
}) {
  return (
    <div className="card-dark" style={{ marginTop: 16 }}>
      <h3 className="caja-hist-subtitle">Movimientos de caja</h3>
      <div className="table-wrap">
        <table className="table-dark">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Método</th>
              <th style={{ textAlign: "right" }}>Monto</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  Sin movimientos registrados.
                </td>
              </tr>
            )}
            {movimientos.map((m, i) => {
              const dt = fmtDateTime(
                m.fecha || m.created_at || m.fecha_movimiento
              );
              const [fecha, hora] = String(dt).split(" ");
              const tipo =
                m.tipo ||
                m.tipo_movimiento ||
                (m.es_ingreso ? "Ingreso" : "Egreso") ||
                "-";
              const metodo =
                m.metodo ||
                m.metodo_pago ||
                m.metpag_nombre ||
                m.metpago_nombre ||
                "-";
              const obs =
                m.observacion ||
                m.descripcion ||
                m.detalle ||
                "";

              return (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{fecha}</td>
                  <td>{hora}</td>
                  <td>{tipo}</td>
                  <td>{metodo}</td>
                  <td style={{ textAlign: "right" }}>
                    ${money(m.monto)}
                  </td>
                  <td>{obs}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
