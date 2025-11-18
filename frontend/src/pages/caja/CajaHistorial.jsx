import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";
const api = apiNamed || apiDefault;

// Helpers
const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

function splitDateTime(dt) {
  if (!dt) return { fecha: "-", hora: "-" };
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) {
      // Por si viene como string "2025-11-18T10:23:45"
      const s = String(dt).replace("T", " ").slice(0, 19);
      const [fecha, hora] = s.split(" ");
      return { fecha: fecha || "-", hora: hora || "-" };
    }
    return {
      fecha: d.toLocaleDateString(),
      hora: d.toLocaleTimeString(),
    };
  } catch {
    return { fecha: String(dt), hora: "-" };
  }
}

export default function CajaHistorial() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historial, setHistorial] = useState([]); // lista de cierres

  // PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/caja/historial/");
      const data = Array.isArray(res.data) ? res.data : [];
      setHistorial(data);
      setCurrentPage(1); // resetea a la primera página al recargar
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el historial de caja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // Cálculos de paginación
  const totalItems = historial.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedHistorial = historial.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, color: "#fff" }}>Historial de Caja</h2>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={cargarHistorial}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {error && (
        <p style={{ color: "#facc15", marginTop: 8 }}>{error}</p>
      )}

      {loading && <p>Cargando historial...</p>}

      {!loading && historial.length === 0 && !error && (
        <p style={{ marginTop: 8 }}>Todavía no hay cierres registrados.</p>
      )}

      {!loading && historial.length > 0 && (
        <>
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
                      <td className="res-num ok">${money(c.ingresos)}</td>
                      <td className="res-num err">${money(c.egresos)}</td>
                      <td
                        className="res-num"
                        style={{
                          color: totalFinalNum >= 0 ? "#22c55e" : "#f97316",
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

          {/* Controles de paginación */}
          <div className="pagination-wrap">
            <div className="pagination-info">
              Mostrando <strong>{startIndex + 1}</strong>–
              <strong>{endIndex}</strong> de <strong>{totalItems}</strong>{" "}
              cierres
            </div>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="pagination-page">
                Página {currentPage} de {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.btn {
  padding:8px 14px;
  border-radius:8px;
  border:1px solid transparent;
  cursor:pointer;
  text-decoration:none;
  font-weight:600;
  font-size:13px;
}
.btn-sm {
  padding:6px 10px;
  font-size:12px;
}
.btn-primary {
  background:#2563eb;
  color:#fff;
}
.btn-secondary {
  background:#3a3a3c;
  color:#fff;
  border:1px solid #4a4a4e;
}
.table-wrap {
  margin-top:20px;
  overflow:auto;
}
.table-dark {
  width:100%;
  border-collapse:separate;
  border-spacing:0 4px;        /* más espacio entre filas */
  background:transparent;
  color:#eaeaea;
}
.table-dark thead tr {
  background:#18181b;
}
.table-dark th, .table-dark td {
  padding:10px 14px;           /* más padding */
  font-size:14px;
  line-height:1.4;
}
.table-dark th:first-child,
.table-dark td:first-child {
  padding-left:16px;
}
.table-dark th:last-child,
.table-dark td:last-child {
  padding-right:16px;
}
.table-dark tbody tr {
  background:#121212;
  border-radius:10px;
}
.table-dark tbody tr:hover {
  background:#1f2933;
}
.table-dark tbody tr td {
  border-top:1px solid #232323;
  border-bottom:1px solid #232323;
}
.table-dark tbody tr td:first-child {
  border-left:1px solid #232323;
  border-top-left-radius:10px;
  border-bottom-left-radius:10px;
}
.table-dark tbody tr td:last-child {
  border-right:1px solid #232323;
  border-top-right-radius:10px;
  border-bottom-right-radius:10px;
}
.table-dark th {
  text-align:left;
}
.res-num {
  font-weight:600;
}
.res-num.ok { color:#22c55e; }
.res-num.err { color:#f97316; }

.pagination-wrap {
  margin-top:16px;
  display:flex;
  flex-wrap:wrap;
  justify-content:space-between;
  align-items:center;
  gap:8px;
}
.pagination-info {
  font-size:13px;
  color:#d4d4d8;
}
.pagination-controls {
  display:flex;
  align-items:center;
  gap:8px;
}
.pagination-page {
  font-size:13px;
  color:#e4e4e7;
}
`;




