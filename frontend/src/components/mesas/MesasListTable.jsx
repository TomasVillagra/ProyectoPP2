import { Link } from "react-router-dom";

export default function MesasListTable({
  rows,
  estNombre,
  bloqueadas,
  toggleOcupadaDisponible,
  toggleInactiva,
}) {
  return (
    <div className="mesas-table-wrap">
      <table className="mesas-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Número</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan="4"
                className="mesas-empty"
              >
                Sin registros
              </td>
            </tr>
          )}

          {rows.map((r) => {
            const id = r.id_mesa ?? r.id;
            const estado = estNombre(r);
            const bloqueada = bloqueadas.has(
              Number(id)
            );

            return (
              <tr key={id}>
                <td>{id}</td>
                <td>{r.ms_numero ?? "-"}</td>
                <td className="mesas-estado">
                  {estado}
                </td>
                <td className="mesas-actions">
                  {/* EDITAR */}
                  {bloqueada ? (
                    <span
                      className="mesas-btn mesas-btn-disabled"
                      title="No se puede editar: la mesa tiene un pedido activo"
                    >
                      Editar
                    </span>
                  ) : (
                    <Link
                      to={`/mesas/${id}/editar`}
                      className="mesas-btn mesas-btn-secondary"
                    >
                      Editar
                    </Link>
                  )}

                  {!bloqueada && (
                    <>
                      <button
                        className="mesas-btn mesas-btn-danger"
                        onClick={() =>
                          toggleOcupadaDisponible(r)
                        }
                      >
                        Marcar{" "}
                        {String(estado).toLowerCase() ===
                        "disponible"
                          ? "ocupada"
                          : "disponible"}
                      </button>

                      <button
                        className="mesas-btn mesas-btn-warning"
                        onClick={() =>
                          toggleInactiva(r)
                        }
                      >
                        {String(estado).toLowerCase() ===
                        "inactiva"
                          ? "Activar"
                          : "Desactivar"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
