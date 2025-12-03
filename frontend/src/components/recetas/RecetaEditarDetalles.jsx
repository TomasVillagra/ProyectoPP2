// src/components/recetas/RecetaEditarDetalles.jsx

export default function RecetaEditarDetalles({
  detalles,
  insumos,
  rowErrors,
  onChangeDetalle,
  removeDetalle,
  addDetalle,
  blockInvalidDecimal,
  esInsumoActivo,
}) {
  return (
    <>
      <h3 className="receta-sub">Insumos de la receta</h3>

      <div className="table-wrap">
        <table className="table-dark">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Insumo</th>
              <th style={{ width: "40%" }}>Cantidad</th>
              <th style={{ width: "20%" }}></th>
            </tr>
          </thead>

          <tbody>
            {detalles.map((row, idx) => {
              const e = rowErrors[idx] || {};

              const usadosEnOtras = new Set(
                detalles
                  .map((r, i2) => (i2 === idx ? null : String(r.id_insumo || "")))
                  .filter(Boolean)
              );

              const activos = insumos.filter(esInsumoActivo);

              const seleccionado = insumos.find(
                (i) => String(i.id_insumo ?? i.id) === String(row.id_insumo)
              );

              let opciones = activos.filter(
                (i) =>
                  !usadosEnOtras.has(String(i.id_insumo ?? i.id))
              );

              if (
                seleccionado &&
                !opciones.some(
                  (i) =>
                    String(i.id_insumo ?? i.id) === String(row.id_insumo)
                )
              ) {
                opciones = [...opciones, seleccionado];
              }

              return (
                <tr key={idx}>
                  <td>
                    <select
                      value={row.id_insumo}
                      onChange={(ev) =>
                        onChangeDetalle(idx, "id_insumo", ev.target.value)
                      }
                    >
                      <option value="">-- Seleccioná insumo --</option>
                      {opciones.map((i) => {
                        const idIns = i.id_insumo ?? i.id;
                        const nombre =
                          i.ins_nombre ?? i.nombre ?? `#${idIns}`;
                        const unidad = i.ins_unidad ?? i.unidad ?? "";
                        return (
                          <option key={idIns} value={idIns}>
                            {nombre}
                            {unidad ? ` (${unidad})` : ""}
                          </option>
                        );
                      })}
                    </select>
                    {e.id_insumo && (
                      <small className="err-inline">{e.id_insumo}</small>
                    )}
                  </td>

                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.detr_cant_unid}
                      onChange={(ev) =>
                        onChangeDetalle(idx, "detr_cant_unid", ev.target.value)
                      }
                      onKeyDown={blockInvalidDecimal}
                      placeholder="0.00"
                    />
                    {e.detr_cant_unid && (
                      <small className="err-inline">{e.detr_cant_unid}</small>
                    )}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => removeDetalle(idx)}
                      disabled={detalles.length === 1}
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

      <button
        type="button"
        className="btn btn-secondary"
        onClick={addDetalle}
        style={{ marginTop: 8 }}
      >
        Agregar insumo
      </button>
    </>
  );
}
