import React from "react";

export default function CompraEditarDetalleTable({
  rows,
  setRow,
  removeRow,
  opcionesInsumosPorFila,
  blockInvalidDecimal,
  calcSubtotal,
}) {
  return (
    <div className="table-wrap">
      <table className="table-dark">
        <thead>
          <tr>
            <th>Insumo</th>
            <th style={{ width: 140 }}>Cantidad</th>
            <th style={{ width: 160 }}>Precio unit.</th>
            <th style={{ width: 140 }}>Subtotal</th>
            <th style={{ width: 100 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const opciones = opcionesInsumosPorFila(i);
            return (
              <tr key={i}>
                <td>
                  <select
                    value={r.id_insumo}
                    onChange={(e) =>
                      setRow(i, "id_insumo", e.target.value)
                    }
                  >
                    <option value="">-- Seleccioná --</option>
                    {opciones.map((ins) => (
                      <option
                        key={ins.id_insumo ?? ins.id}
                        value={ins.id_insumo ?? ins.id}
                      >
                        {ins.ins_nombre ?? ins.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={r.detcom_cantidad}
                    onChange={(e) =>
                      setRow(i, "detcom_cantidad", e.target.value)
                    }
                    onKeyDown={blockInvalidDecimal}
                    placeholder="0.000"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={r.detcom_precio_uni}
                    readOnly
                    placeholder="0.000"
                    style={{ opacity: 0.75, cursor: "not-allowed" }}
                    title="El precio unitario de la compra no se puede modificar."
                  />
                </td>
                <td>${calcSubtotal(r).toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
