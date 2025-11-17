import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";
const api = apiNamed || apiDefault;

// Helpers
const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

function fmtDate(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) {
      // por si viene ya formateado
      return String(dt).replace("T", " ").slice(0, 19);
    }
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function CajaHistorial() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historial, setHistorial] = useState([]); // ← lista de cierres

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/caja/historial/");
      const data = Array.isArray(res.data) ? res.data : [];
      setHistorial(data);
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

      {!loading && historial.length === 0 && !error && (
        <p style={{ marginTop: 8 }}>Todavía no hay cierres registrados.</p>
      )}

      {loading && <p>Cargando historial...</p>}

      {!loading &&
        historial.map((c, idx) => (
          <div key={idx} className="card-dark" style={{ marginBottom: 16 }}>
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
                <div>{fmtDate(c.apertura_fecha)}</div>
              </div>
              <div>
                <div className="label">Cierre</div>
                <div>{fmtDate(c.cierre_fecha)}</div>
              </div>
              <div>
                <div className="label">Monto apertura</div>
                <div>${money(c.monto_apertura)}</div>
              </div>
              <div>
                <div className="label">Ingresos</div>
                <div className="res-num ok">${money(c.ingresos)}</div>
              </div>
              <div>
                <div className="label">Egresos</div>
                <div className="res-num err">${money(c.egresos)}</div>
              </div>
              <div>
                <div className="label">Total final</div>
                <div
                  className="res-num"
                  style={{
                    color:
                      Number(c.total_final) >= 0 ? "#22c55e" : "#f97316",
                  }}
                >
                  {Number(c.total_final) >= 0 ? "+" : "-"}$
                  {money(Math.abs(Number(c.total_final) || 0))}
                </div>
              </div>
            </div>

            {/* Detalle por método de pago */}
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <h4 style={{ color: "#fff", marginBottom: 6 }}>
                Ingresos por método de pago
              </h4>
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th style={{ textAlign: "right" }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {(!c.por_metodo_ingresos ||
                    c.por_metodo_ingresos.length === 0) && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: "center" }}>
                        Sin ingresos en este ciclo.
                      </td>
                    </tr>
                  )}
                  {c.por_metodo_ingresos &&
                    c.por_metodo_ingresos.map((m, i) => (
                      <tr key={i}>
                        <td>{m.metodo || "Sin método"}</td>
                        <td style={{ textAlign: "right" }}>
                          ${money(m.monto)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="table-wrap" style={{ marginTop: 12 }}>
              <h4 style={{ color: "#fff", marginBottom: 6 }}>
                Egresos por método de pago
              </h4>
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th style={{ textAlign: "right" }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {(!c.por_metodo_egresos ||
                    c.por_metodo_egresos.length === 0) && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: "center" }}>
                        Sin egresos en este ciclo.
                      </td>
                    </tr>
                  )}
                  {c.por_metodo_egresos &&
                    c.por_metodo_egresos.map((m, i) => (
                      <tr key={i}>
                        <td>{m.metodo || "Sin método"}</td>
                        <td style={{ textAlign: "right" }}>
                          ${money(m.monto)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.filtros-card {
  background:#121212;
  border:1px solid #232323;
  border-radius:10px;
  padding:10px;
  margin-bottom:12px;
}
.filtros-row {
  display:flex;
  gap:12px;
  flex-wrap:wrap;
}
.field {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.label {
  color:#a1a1aa;
  font-size:13px;
}
.input {
  background:#0f0f10;
  color:#fff;
  border:1px solid #2a2a2a;
  border-radius:8px;
  padding:6px 8px;
}
.btn {
  padding:8px 12px;
  border-radius:8px;
  border:1px solid transparent;
  cursor:pointer;
  text-decoration:none;
  font-weight:600;
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
.resumen-grid {
  display:grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap:10px;
  margin-top:10px;
}
@media (min-width: 800px) {
  .resumen-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.card-dark {
  background:#121212;
  border:1px solid #232323;
  border-radius:10px;
  padding:10px;
}
.res-num {
  font-size:20px;
  font-weight:700;
  margin-top:4px;
}
.res-num.ok { color:#22c55e; }
.res-num.err { color:#f97316; }
.table-wrap {
  margin-top:16px;
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
}
`;


