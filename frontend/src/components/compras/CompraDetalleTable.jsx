import React from "react";

export default function CompraDetalleTable({
  rows,
  setRow,
  removeRow,
  insumosDisponibles,
  cajaAbierta,
  form,
  precioByInsumo,
  blockInvalidDecimal,
  calcSubtotal,
}) {
  return (
    <div className="table-wrap">
      <table className="table-dark">
        <thead>
          <tr>
            <th>Insumo (vinculado al proveedor)</th>
            <th style={{ width: 140 }}>Cantidad</th>
            <th style={{ width: 160 }}>Precio unit. (fijado)</th>
            <th style={{ width: 140 }}>Subtotal</th>
            <th style={{ width: 100 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const selectedId = Number(r.id_insumo || 0);
            const usedIds = new Set(
              rows
                .filter((_, idx) => idx !== i)
                .map((rr) => Number(rr.id_insumo || 0))
            );

            const opcionesInsumos = insumosDisponibles.filter((ins) => {
              const idIns = Number(ins.id_insumo || 0);
              if (!idIns) return false;
              if (idIns === selectedId) return true;
              return !usedIds.has(idIns);
            });

            return (
              <tr key={i}>
                <td>
                  <select
                    value={r.id_insumo}
                    onChange={(e) =>
                      setRow(i, "id_insumo", e.target.value)
                    }
                    disabled={
                      !cajaAbierta ||
                      !form.id_proveedor ||
                      !insumosDisponibles.length
                    }
                  >
                    <option value="">-- Seleccioná --</option>
                    {opcionesInsumos.map((ins) => (
                      <option
                        key={ins.id_insumo}
                        value={ins.id_insumo}
                      >
                        {ins.ins_nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={r.detcom_cantidad}
                    onChange={(e) =>
                      setRow(
                        i,
                        "detcom_cantidad",
                        e.target.value
                      )
                    }
                    onKeyDown={blockInvalidDecimal}
                    placeholder="0"
                    disabled={!cajaAbierta}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      r.id_insumo
                        ? String(
                            precioByInsumo.get(
                              Number(r.id_insumo)
                            ) ?? ""
                          )
                        : ""
                    }
                    readOnly
                    placeholder="—"
                    style={{ opacity: 0.75 }}
                    title="Precio desde proveedor-insumo"
                  />
                </td>
                <td>
                  $
                  {calcSubtotal({
                    ...r,
                    detcom_precio_uni:
                      precioByInsumo.get(
                        Number(r.id_insumo)
                      ) ?? 0,
                  }).toFixed(2)}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1 || !cajaAbierta}
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
