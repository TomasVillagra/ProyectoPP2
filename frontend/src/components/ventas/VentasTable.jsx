// src/components/ventas/VentasTable.jsx
import { Link } from "react-router-dom";

export default function VentasTable({
  rows,
  fmtDate,
  money,
  getEstadoNombre,
  esVentaCobrada,
  handleComprobante,
  downloadingId,
}) {
  return (
    <div className="table-wrap">
      <table className="table-dark">
        <thead>
          <tr>
            <th>Fecha/Hora</th>
            <th>Cliente</th>
            <th>Empleado</th>
            <th>Total</th>
            <th>Estado</th>
            <th style={{ width: 260 }}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                Sin registros
              </td>
            </tr>
          )}

          {rows.map((v, i) => {
            const id = v.id_venta ?? v.id ?? i;
            const fecha = v.ven_fecha_hora ?? v.fecha ?? v.created_at ?? null;

            const cliente =
              v.cliente_nombre ?? v.cli_nombre ?? v.id_cliente ?? "-";
            const empleado =
              v.empleado_nombre ?? v.emp_nombre ?? v.id_empleado ?? "-";

            const total = Number(
              v.ven_total ?? v.total ?? v.ven_monto ?? v.monto ?? 0
            );

            const estadoNombre = getEstadoNombre(v);
            const yaCobrada = esVentaCobrada(v);

            return (
              <tr key={id}>
                <td>{fmtDate(fecha)}</td>
                <td>{String(cliente)}</td>
                <td>{String(empleado)}</td>
                <td>${money(total)}</td>
                <td>{estadoNombre}</td>

                <td className="acciones-cell">
                  <Link to={`/ventas/${id}`} className="btn btn-secondary">
                    Ver
                  </Link>

                  {!yaCobrada && (
                    <Link className="btn btn-primary" to={`/cobros/${id}`}>
                      Cobrar
                    </Link>
                  )}

                  {yaCobrada && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleComprobante(id)}
                      disabled={downloadingId === id}
                    >
                      {downloadingId === id ? "Generando..." : "Comprobante"}
                    </button>
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
