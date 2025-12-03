export default function RecetaVerTable({ detalles, insumoMap }) {
  return (
    <>
      <h3 className="receta-ver-subtitle">Insumos de la receta</h3>

      <div className="receta-ver-table-wrap">
        <table className="receta-ver-table">
          <thead>
            <tr>
              <th>ID insumo</th>
              <th>Insumo</th>
              <th>Cantidad</th>
            </tr>
          </thead>

          <tbody>
            {detalles.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center" }}>
                  Esta receta aún no tiene insumos cargados.
                </td>
              </tr>
            )}

            {detalles.map((d, idx) => {
              const idIns = Number(
                d.id_insumo ?? d.insumo ?? d.id ?? d.insumo_id ?? 0
              );

              const info = insumoMap[idIns] || {};

              const nombre =
                info.ins_nombre ??
                info.nombre ??
                d.insumo_nombre ??
                (idIns ? `Insumo #${idIns}` : "-");

              const unidad = info.ins_unidad ?? info.unidad ?? "";
              const cant =
                d.detr_cant_unid ?? d.cantidad ?? d.cant ?? "-";

              return (
                <tr key={idx}>
                  <td>{idIns || "-"}</td>
                  <td>
                    {nombre}
                    {unidad ? ` (${unidad})` : ""}
                  </td>
                  <td>{cant}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
