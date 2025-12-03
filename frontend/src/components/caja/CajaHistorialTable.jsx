import React from "react";
import { Link } from "react-router-dom";

export default function CajaHistorialTable({
  paginatedHistorial,
  startIndex,
  money,
  splitDateTime,
}) {
  return (
    <div className="table-wrap">
      <table className="table-dark">
        <thead>
          <tr>
            <th>#</th>
            <th>Fecha apertura</th>
            <th>Hora apertura</th>
            <th>Empleado apertura</th>
            <th>Fecha cierre</th>
            <th>Hora cierre</th>
            <th>Empleado cierre</th>
            <th>Monto apertura</th>
            <th>Ingresos</th>
            <th>Egresos</th>
            <th>Total final</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {paginatedHistorial.map((c, idx) => {
            // índice global (1,2,3...) considerando la paginación
            const rowNumber = startIndex + idx + 1;

            // Empleados de apertura y cierre (probando distintos nombres de campo)
            const empApertura =
              c.apertura_empleado_nombre ??
              c.empleado_apertura ??
              c.emp_apertura ??
              c.apertura_empleado ??
              "-";

            const empCierre =
              c.cierre_empleado_nombre ??
              c.empleado_cierre ??
              c.emp_cierre ??
              c.cierre_empleado ??
              "-";

            const apertura = splitDateTime(c.apertura_fecha);
            const cierre = splitDateTime(c.cierre_fecha);

            const totalFinalNum = Number(c.total_final) || 0;
            const cierreId = c.id_cierre ?? c.id ?? rowNumber;

            return (
              <tr key={rowNumber}>
                <td>{rowNumber}</td>
                <td>{apertura.fecha}</td>
                <td>{apertura.hora}</td>
                <td>{empApertura}</td>
                <td>{cierre.fecha}</td>
                <td>{cierre.hora}</td>
                <td>{empCierre}</td>
                <td>${money(c.monto_apertura)}</td>
                <td className="res-num ok">
                  ${money(c.ingresos)}
                </td>
                <td className="res-num err">
                  ${money(c.egresos)}
                </td>
                <td
                  className="res-num"
                  style={{
                    color:
                      totalFinalNum >= 0 ? "#22c55e" : "#f97316",
                  }}
                >
                  {totalFinalNum >= 0 ? "+" : "-"}$
                  {money(Math.abs(totalFinalNum))}
                </td>
                <td style={{ textAlign: "center" }}>
                  <Link
                    className="btn btn-primary btn-sm"
                    to={`/caja/historial/${cierreId}`}
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
