import React from "react";

export default function CajaHistDetalleMetodosCard({
  resumenMetodos,
  totalIngresosMetodos,
  totalEgresosMetodos,
  totalNetoMetodos,
  money,
}) {
  return (
    <div className="card-dark" style={{ marginTop: 16 }}>
      <h3 className="caja-hist-subtitle">
        Resumen por método de pago
      </h3>
      <div className="table-wrap">
        <table className="table-dark">
          <thead>
            <tr>
              <th>Método</th>
              <th style={{ textAlign: "right" }}>Ingresos</th>
              <th style={{ textAlign: "right" }}>Egresos</th>
              <th style={{ textAlign: "right" }}>Neto</th>
            </tr>
          </thead>
          <tbody>
            {resumenMetodos.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  Sin movimientos por método en este ciclo.
                </td>
              </tr>
            )}
            {resumenMetodos.map((r, i) => (
              <tr key={i}>
                <td>{r.metodo}</td>
                <td style={{ textAlign: "right" }}>
                  ${money(r.ingresos)}
                </td>
                <td style={{ textAlign: "right" }}>
                  ${money(r.egresos)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    color: r.neto >= 0 ? "#22c55e" : "#f97316",
                  }}
                >
                  {r.neto >= 0 ? "+" : "-"}$
                  {money(Math.abs(r.neto))}
                </td>
              </tr>
            ))}
          </tbody>
          {resumenMetodos.length > 0 && (
            <tfoot>
              <tr>
                <th>Total</th>
                <th style={{ textAlign: "right" }}>
                  ${money(totalIngresosMetodos)}
                </th>
                <th style={{ textAlign: "right" }}>
                  ${money(totalEgresosMetodos)}
                </th>
                <th
                  style={{
                    textAlign: "right",
                    color:
                      totalNetoMetodos >= 0
                        ? "#22c55e"
                        : "#f97316",
                  }}
                >
                  {totalNetoMetodos >= 0 ? "+" : "-"}$
                  {money(Math.abs(totalNetoMetodos))}
                </th>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
