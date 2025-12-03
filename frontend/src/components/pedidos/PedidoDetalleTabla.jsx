// src/components/pedidos/PedidoDetalleTabla.jsx

export default function PedidoDetalleTabla({ detalles }) {
  return (
    <>
      <h3 style={{ marginTop: 18, color: "#fff" }}>Detalle de Platos</h3>

      <div className="table-wrap">
        <table className="table-dark">
          <thead>
            <tr>
              <th>Plato</th>
              <th style={{ width: 120, textAlign: "right" }}>Cantidad</th>
            </tr>
          </thead>

          <tbody>
            {detalles.length ? (
              detalles.map((d, i) => {
                const nombre =
                  d.plato_nombre ??
                  d.plato?.plt_nombre ??
                  d.nombre ??
                  "(Sin nombre)";
                const cantidad = d.detped_cantidad ?? d.cantidad ?? 0;

                return (
                  <tr key={i}>
                    <td>{nombre}</td>
                    <td style={{ textAlign: "right" }}>{cantidad}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: "center" }}>
                  Sin platos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
