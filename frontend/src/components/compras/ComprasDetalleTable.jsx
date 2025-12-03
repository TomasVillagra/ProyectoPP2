import React from "react";

export default function ComprasDetalleTable({
  detalle,
  total,
  toNumber,
  fmtMoney,
}) {
  return (
    <div className="table-wrap" style={{ marginTop: 10 }}>
      <table className="table-dark">
        <thead>
          <tr>
            <th>#</th>
            <th>Insumo</th>
            <th style={{ width: 140 }}>Cantidad</th>
            <th style={{ width: 160 }}>Precio unit.</th>
            <th style={{ width: 140 }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {detalle.map((r, i) => {
            const nombre =
              r.insumo_nombre ??
              r?.id_insumo?.ins_nombre ??
              r.id_insumo ??
              "-";
            const cant = toNumber(r.detcom_cantidad);
            const precio = toNumber(r.detcom_precio_uni);
            const sub = cant * precio;
            return (
              <tr key={r.id_detalle_compra ?? r.id ?? i}>
                <td>{i + 1}</td>
                <td>{nombre}</td>
                <td>{cant}</td>
                <td>{fmtMoney(precio)}</td>
                <td>{fmtMoney(sub)}</td>
              </tr>
            );
          })}
          {!detalle.length && (
            <tr>
              <td
                colSpan={5}
                style={{ textAlign: "center", opacity: 0.7 }}
              >
                Sin renglones de detalle.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ textAlign: "right" }}>
              <strong>Total (calculado)</strong>
            </td>
            <td>
              <strong>{fmtMoney(total)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
