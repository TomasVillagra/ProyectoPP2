import React from "react";

export default function MovCajaListTable({ rows, money, fmtDate }) {
  return (
    <div className="table-wrap">
      <table className="table-dark">
        <thead>
          <tr>
            {/* ❌ ID eliminado */}
            <th>Fecha/Hora</th>
            <th>Tipo</th>
            <th>Venta</th>
            <th>Compra</th> {/* ✅ nueva columna */}
            <th>Método pago</th>
            <th>Monto</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              {/* seguimos teniendo 7 columnas */}
              <td colSpan={7} style={{ textAlign: "center" }}>
                Sin registros
              </td>
            </tr>
          )}

          {rows.map((m) => {
            const fecha =
              m.mv_fecha_hora ??
              m.mov_fecha_hora ??
              m.fecha ??
              m.created_at;
            const tipo =
              m.tipo_nombre ?? m.tipmov_nombre ?? m.id_tipo_movimiento_caja;
            const venta = m.id_venta ?? m.venta_id ?? "-";
            const compra = m.id_compra ?? m.compra_id ?? "-"; // ✅ nueva info
            const metodo =
              m.metodo_pago_nombre ??
              m.metpag_nombre ??
              m.id_metodo_pago ??
              "-";
            const monto =
              m.mv_monto ?? m.mov_monto ?? m.monto ?? 0;
            const desc =
              m.mv_descripcion ?? m.mov_descripcion ?? "-";

            const key =
              m.id_movimiento_caja ?? m.id_movimiento ?? m.id;

            return (
              <tr key={key}>
                <td>{fmtDate(fecha)}</td>
                <td>{tipo}</td>
                <td>{venta}</td>
                <td>{compra}</td>
                <td>{metodo}</td>
                <td>${money(monto)}</td>
                <td>{desc}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
