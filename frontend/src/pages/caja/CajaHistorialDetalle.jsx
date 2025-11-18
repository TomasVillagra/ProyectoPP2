import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";
const api = apiNamed || apiDefault;

// Helpers
const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

function fmtDateTime(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) {
      return String(dt).replace("T", " ").slice(0, 19);
    }
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function CajaHistorialDetalle() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      setError("");

      // Ajustá esta URL si en tu API usás otro path, por ejemplo:
      // /api/caja/historial/{id}/detalle/
      const res = await api.get(`/api/caja/historial/${id}/`);
      setDetalle(res.data);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el detalle de la caja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  // Armar datos de empleados / totales de forma segura
  const empApertura =
    detalle?.apertura_empleado_nombre ??
    detalle?.empleado_apertura ??
    detalle?.emp_apertura ??
    detalle?.apertura_empleado ??
    "-";

  const empCierre =
    detalle?.cierre_empleado_nombre ??
    detalle?.empleado_cierre ??
    detalle?.emp_cierre ??
    detalle?.cierre_empleado ??
    "-";

  // Métodos por ingresos / egresos
  const resumenMap = new Map();

  (detalle?.por_metodo_ingresos || []).forEach((m) => {
    const nombre =
      m.metodo ||
      m.metpag_nombre ||
      m.metpago_nombre ||
      m.nombre ||
      "Sin método";
    const key = String(nombre);
    if (!resumenMap.has(key)) {
      resumenMap.set(key, { metodo: key, ingresos: 0, egresos: 0 });
    }
    const item = resumenMap.get(key);
    item.ingresos += Number(m.monto || 0);
  });

  (detalle?.por_metodo_egresos || []).forEach((m) => {
    const nombre =
      m.metodo ||
      m.metpag_nombre ||
      m.metpago_nombre ||
      m.nombre ||
      "Sin método";
    const key = String(nombre);
    if (!resumenMap.has(key)) {
      resumenMap.set(key, { metodo: key, ingresos: 0, egresos: 0 });
    }
    const item = resumenMap.get(key);
    item.egresos += Number(m.monto || 0);
  });

  const resumenMetodos = Array.from(resumenMap.values()).map((r) => ({
    ...r,
    neto: r.ingresos - r.egresos,
  }));

  const totalIngresosMetodos = resumenMetodos.reduce(
    (acc, r) => acc + r.ingresos,
    0
  );
  const totalEgresosMetodos = resumenMetodos.reduce(
    (acc, r) => acc + r.egresos,
    0
  );
  const totalNetoMetodos = totalIngresosMetodos - totalEgresosMetodos;

  // Movimientos individuales (para ver TODO el detalle)
  const movimientos =
    detalle?.movimientos ||
    detalle?.movimientos_caja ||
    detalle?.detalle ||
    [];

  return (
    <DashboardLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, color: "#fff" }}>
          Detalle de Caja #{id}
        </h2>
        <Link className="btn btn-secondary" to="/caja/historial">
          Volver al historial
        </Link>
      </div>

      {error && (
        <p style={{ color: "#facc15", marginTop: 8 }}>{error}</p>
      )}
      {loading && <p>Cargando detalle...</p>}

      {!loading && detalle && (
        <>
          {/* Resumen principal */}
          <div className="card-dark">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "space-between",
              }}
            >
              <div>
                <div className="label">Apertura</div>
                <div>{fmtDateTime(detalle.apertura_fecha)}</div>
              </div>
              <div>
                <div className="label">Empleado apertura</div>
                <div>{empApertura}</div>
              </div>
              <div>
                <div className="label">Cierre</div>
                <div>{fmtDateTime(detalle.cierre_fecha)}</div>
              </div>
              <div>
                <div className="label">Empleado cierre</div>
                <div>{empCierre}</div>
              </div>
              <div>
                <div className="label">Monto apertura</div>
                <div>${money(detalle.monto_apertura)}</div>
              </div>
              <div>
                <div className="label">Ingresos</div>
                <div className="res-num ok">
                  ${money(detalle.ingresos)}
                </div>
              </div>
              <div>
                <div className="label">Egresos</div>
                <div className="res-num err">
                  ${money(detalle.egresos)}
                </div>
              </div>
              <div>
                <div className="label">Total final</div>
                <div
                  className="res-num"
                  style={{
                    color:
                      Number(detalle.total_final) >= 0
                        ? "#22c55e"
                        : "#f97316",
                  }}
                >
                  {Number(detalle.total_final) >= 0 ? "+" : "-"}$
                  {money(Math.abs(Number(detalle.total_final) || 0))}
                </div>
              </div>
            </div>
          </div>

          {/* Resumen por método */}
          <div className="card-dark" style={{ marginTop: 16 }}>
            <h3 style={{ color: "#fff", marginBottom: 8 }}>
              Resumen por método de pago
            </h3>
            <div className="table-wrap">
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th style={{ textAlign: "right" }}>Ingresos</th>
                    <th style={{ textAlign: "right" }}>Egresos</th>
                    <th style={{ textAlign: "right" }}>Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenMetodos.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center" }}>
                        Sin movimientos por método en este ciclo.
                      </td>
                    </tr>
                  )}
                  {resumenMetodos.map((r, i) => (
                    <tr key={i}>
                      <td>{r.metodo}</td>
                      <td style={{ textAlign: "right" }}>
                        ${money(r.ingresos)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        ${money(r.egresos)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: r.neto >= 0 ? "#22c55e" : "#f97316",
                        }}
                      >
                        {r.neto >= 0 ? "+" : "-"}$
                        {money(Math.abs(r.neto))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {resumenMetodos.length > 0 && (
                  <tfoot>
                    <tr>
                      <th>Total</th>
                      <th style={{ textAlign: "right" }}>
                        ${money(totalIngresosMetodos)}
                      </th>
                      <th style={{ textAlign: "right" }}>
                        ${money(totalEgresosMetodos)}
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          color:
                            totalNetoMetodos >= 0
                              ? "#22c55e"
                              : "#f97316",
                        }}
                      >
                        {totalNetoMetodos >= 0 ? "+" : "-"}$
                        {money(Math.abs(totalNetoMetodos))}
                      </th>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Movimientos individuales */}
          <div className="card-dark" style={{ marginTop: 16 }}>
            <h3 style={{ color: "#fff", marginBottom: 8 }}>
              Movimientos de caja
            </h3>
            <div className="table-wrap">
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Método</th>
                    <th style={{ textAlign: "right" }}>Monto</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center" }}>
                        Sin movimientos registrados.
                      </td>
                    </tr>
                  )}
                  {movimientos.map((m, i) => {
                    const dt = fmtDateTime(m.fecha || m.created_at || m.fecha_movimiento);
                    const [fecha, hora] = String(dt).split(" ");
                    const tipo =
                      m.tipo ||
                      m.tipo_movimiento ||
                      (m.es_ingreso ? "Ingreso" : "Egreso") ||
                      "-";
                    const metodo =
                      m.metodo ||
                      m.metodo_pago ||
                      m.metpag_nombre ||
                      m.metpago_nombre ||
                      "-";
                    const obs =
                      m.observacion ||
                      m.descripcion ||
                      m.detalle ||
                      "";

                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{fecha}</td>
                        <td>{hora}</td>
                        <td>{tipo}</td>
                        <td>{metodo}</td>
                        <td style={{ textAlign: "right" }}>
                          ${money(m.monto)}
                        </td>
                        <td>{obs}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.card-dark {
  background:#121212;
  border:1px solid #232323;
  border-radius:10px;
  padding:10px;
}
.label {
  color:#a1a1aa;
  font-size:13px;
}
.res-num {
  font-size:18px;
  font-weight:700;
  margin-top:4px;
}
.res-num.ok { color:#22c55e; }
.res-num.err { color:#f97316; }
.table-wrap {
  margin-top:12px;
  overflow:auto;
}
.table-dark {
  width:100%;
  border-collapse:collapse;
  background:#121212;
  color:#eaeaea;
}
.table-dark th, .table-dark td {
  border:1px solid #232323;
  padding:8px;
  font-size:13px;
}
.table-dark th {
  background:#18181b;
}
.btn {
  padding:8px 12px;
  border-radius:8px;
  border:1px solid transparent;
  cursor:pointer;
  text-decoration:none;
  font-weight:600;
}
.btn-secondary {
  background:#3a3a3c;
  color:#fff;
  border:1px solid #4a4a4e;
}
`;
