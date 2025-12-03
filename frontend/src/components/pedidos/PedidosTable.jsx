// src/components/pedidos/PedidosTable.jsx
import { Link } from "react-router-dom";

export default function PedidosTable({
  rows,
  fmtDate,
  isTerminal,
  isEntregado,
  marcarEntregado,
  marcarFinalizado,
  abrirCancelar,
}) {
  return (
    <div className="table-wrap">
      <table className="table-dark">
        <thead>
          <tr>
            <th>Inicio</th>
            <th>Mesa</th>
            <th>Tipo</th>
            <th>Estado</th>

            {/* ✅ ancho ampliado */}
            <th style={{ width: 350 }}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                Sin registros
              </td>
            </tr>
          )}

          {rows.map((r, idx) => {
            const id = r.id_pedido ?? r.id ?? idx;
            const inicio = r.ped_fecha_hora_ini;
            const mesa = r.mesa_numero ?? "-";
            const tipo = r.tipo_nombre ?? "-";
            const estado = r.estado_nombre ?? "-";

            const terminal = isTerminal(r);
            const entregado = isEntregado(r);

            return (
              <tr key={id}>
                <td>{fmtDate(inicio)}</td>
                <td>{mesa ? `Mesa ${mesa}` : "-"}</td>
                <td>{tipo}</td>
                <td>{estado}</td>

                <td>
                  <div className="acciones-cell">

                    {/* ✅ Editar ahora en blanco */}
                    {!terminal && (
                      <Link
                        to={`/pedidos/${id}/editar`}
                        className="btn btn-secondary"
                        style={{ color: "#fff" }}
                      >
                        ✎ Editar
                      </Link>
                    )}

                    {/* ✅ Entregar con texto */}
                    {!terminal && !entregado && (
                      <button
                        onClick={() => marcarEntregado(r)}
                        className="btn btn-info"
                      >
                        Entregar
                      </button>
                    )}

                    {/* ✅ Finalizar con texto */}
                    {!terminal && entregado && (
                      <button
                        onClick={() => marcarFinalizado(r)}
                        className="btn btn-primary"
                      >
                        Finalizar
                      </button>
                    )}

                    {/* ✅ Cancelar con texto */}
                    {!terminal && (
                      <button
                        onClick={() => abrirCancelar(r)}
                        className="btn btn-danger"
                      >
                        Cancelar
                      </button>
                    )}

                    {/* Ver */}
                    <Link
                      to={`/pedidos/${id}`}
                      className="btn btn-secondary"
                    >
                      Ver
                    </Link>

                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

