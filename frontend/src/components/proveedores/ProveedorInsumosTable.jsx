import { api } from "../../api/axios";

export default function ProveedorInsumosTable({
  relaciones,
  insumoById,
  getRelPk,
  editingRow,
  setEditingRow,
  editingPrice,
  setEditingPrice,
  isValidPrice,
  isPriceAtLeastMin,
  toPriceStr,
  refreshRel,
  refreshComprasBloqueos,
  handleQuitar,
  insumosUsadosEnCompras,
  insumosEnProceso,
  setMsg,
}) {
  return (
    <div className="prov-ins-table-container">
      <table className="prov-ins-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Insumo</th>
            <th>Unidad</th>
            <th>Capacidad</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(relaciones || []).map((r) => {
            const ins =
              insumoById.get(Number(r.id_insumo)) ||
              {};
            const pk = getRelPk(r);
            const isEditing = editingRow === pk;
            const insumoId = Number(
              ins.id_insumo ?? r.id_insumo
            );

            const bloqueaQuitar =
              insumosUsadosEnCompras.has(
                insumoId
              );
            const bloqueaEditar =
              insumosEnProceso.has(insumoId);

            return (
              <tr key={pk}>
                <td>
                  {ins.id_insumo ?? r.id_insumo}
                </td>
                <td>
                  {ins.ins_nombre ??
                    r.ins_nombre ??
                    "-"}
                </td>
                <td>
                  {ins.ins_unidad ?? "-"}
                </td>
                <td>
                  {ins.ins_capacidad
                    ? `${Number(
                        ins.ins_capacidad
                      ).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} ${""}`
                    : "-"}
                </td>

                <td>
                  {isEditing ? (
                    <div className="prov-ins-edit-price-wrap">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        className="prov-ins-price-input"
                        value={editingPrice}
                        onChange={(e) =>
                          setEditingPrice(
                            e.target.value
                          )
                        }
                        disabled={bloqueaEditar}
                        title={
                          bloqueaEditar
                            ? "No se puede editar: hay compras en proceso con este insumo."
                            : "Ingresá el nuevo precio"
                        }
                      />
                      <button
                        className="prov-ins-btn prov-ins-btn-primary prov-ins-btn-xs"
                        disabled={
                          !isValidPrice(
                            editingPrice
                          ) ||
                          !isPriceAtLeastMin(
                            editingPrice
                          ) ||
                          bloqueaEditar
                        }
                        onClick={async () => {
                          if (bloqueaEditar) {
                            setMsg(
                              "No se puede editar el precio: este insumo está en compras 'En proceso'."
                            );
                            return;
                          }
                          if (
                            !isPriceAtLeastMin(
                              editingPrice
                            )
                          ) {
                            setMsg(
                              "El precio debe ser mayor a 100."
                            );
                            return;
                          }
                          try {
                            await api.patch(
                              `/api/proveedores-insumos/${pk}/`,
                              {
                                precio_unitario:
                                  toPriceStr(
                                    editingPrice
                                  ),
                              }
                            );
                            await refreshRel();
                            await refreshComprasBloqueos();
                            setEditingRow(null);
                            setEditingPrice("");
                            setMsg(
                              "Precio actualizado ✅"
                            );
                          } catch (e) {
                            console.error(e);
                            setMsg(
                              "No se pudo actualizar el precio."
                            );
                          }
                        }}
                      >
                        Guardar
                      </button>
                      <button
                        className="prov-ins-btn prov-ins-btn-secondary prov-ins-btn-xs"
                        onClick={() => {
                          setEditingRow(null);
                          setEditingPrice("");
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (r.precio_unitario ?? null) !==
                    null ? (
                    `$ ${Number(
                      r.precio_unitario
                    ).toFixed(3)}`
                  ) : (
                    "-"
                  )}
                </td>

                <td className="prov-ins-actions-cell">
                  {!isEditing &&
                    !bloqueaEditar && (
                      <button
                        className="prov-ins-btn prov-ins-btn-secondary"
                        onClick={() => {
                          setEditingRow(pk);
                          setEditingPrice(
                            (r.precio_unitario ??
                              "") === "" ||
                              r.precio_unitario ===
                                null
                              ? ""
                              : Number(
                                  r.precio_unitario
                                ).toFixed(3)
                          );
                        }}
                        title="Editar precio"
                      >
                        Editar precio
                      </button>
                    )}

                  {!bloqueaQuitar && (
                    <button
                      className="prov-ins-btn prov-ins-btn-danger"
                      onClick={() =>
                        handleQuitar(r)
                      }
                      title="Quitar"
                    >
                      Quitar
                    </button>
                  )}
                </td>
              </tr>
            );
          })}

          {(!relaciones ||
            relaciones.length === 0) && (
            <tr>
              <td
                colSpan="6"
                className="prov-ins-empty-row"
              >
                Este proveedor aún no tiene
                insumos vinculados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
