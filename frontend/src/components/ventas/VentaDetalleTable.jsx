// src/components/ventas/VentaDetalleTable.jsx

export default function VentaDetalleTable({
  detalles,
  platosCache,
  readPlatoNombre,
  money,
}) {
  return (
    <>
      <h3 style={{ marginTop: 18, color: "#fff" }}>Detalles de la venta</h3>

      <div className="table-wrap">
        <table className="table-dark">
          <thead>
            <tr>
              <th>Plato</th>
              <th style={{ width: 110, textAlign: "right" }}>Cant.</th>
              <th style={{ width: 160, textAlign: "right" }}>Precio unitario</th>
              <th style={{ width: 160, textAlign: "right" }}>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {detalles.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  Sin ítems
                </td>
              </tr>
            )}

            {detalles.map((d, idx) => {
              const pid = Number(d.id_plato ?? d.plato ?? d.id ?? 0);
              const plato = platosCache.get(pid);

              const nombre = plato
                ? readPlatoNombre(plato)
                : pid
                ? `Plato #${pid}`
                : "-";

              const cantidad = Number(d.detven_cantidad ?? d.cantidad ?? 0);
              const unit = Number(d.detven_precio_uni ?? d.precio_unitario ?? 0);
              const sub = Number(d.detven_subtotal ?? d.subtotal ?? unit * cantidad);

              return (
                <tr key={idx}>
                  <td>{nombre}</td>
                  <td style={{ textAlign: "right" }}>{cantidad}</td>
                  <td style={{ textAlign: "right" }}>${money(unit)}</td>
                  <td style={{ textAlign: "right" }}>${money(sub)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
