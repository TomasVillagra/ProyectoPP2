import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";
const api = apiNamed || apiDefault;

/* Helpers */
function normAny(resp) {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

function fmtDate(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return String(dt).replace("T", " ").slice(0, 19);
    return d.toLocaleString("es-AR");
  } catch {
    return String(dt);
  }
}

export default function CajaPanel() {
  const [estado, setEstado] = useState(null); // {abierta: bool, ...}
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [montoInicial, setMontoInicial] = useState("");

  // movimientos de la caja ACTUAL (desde última apertura)
  const [movs, setMovs] = useState([]);
  const [movsLoading, setMovsLoading] = useState(false);
  const [movsMsg, setMovsMsg] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 🔧 soporta totales_metodo como ARRAY o como OBJETO
  const totalesPorMetodo = useMemo(() => {
    const acc = {};
    const tm = estado?.totales_metodo;

    let lista = [];
    if (Array.isArray(tm)) {
      lista = tm;
    } else if (tm && typeof tm === "object") {
      lista = Object.values(tm);
    }

    lista.forEach((t) => {
      const nombre =
        t.metpag_nombre || t.metpago_nombre || t.nombre || `Método ${t.id}`;
      acc[nombre] = Number(t.total || t.saldo || 0);
    });
    return acc;
  }, [estado]);

  const cargar = async () => {
    try {
      setLoading(true);
      const [est, mets] = await Promise.all([
        api.get("/api/caja/estado/"),
        api.get("/api/metodos-pago/"),
      ]);
      console.log("Estado caja desde backend:", est.data);
      setEstado(est.data ?? null);
      setMetodos(Array.isArray(mets.data) ? mets.data : []);
      setMsg("");
    } catch (e) {
      console.log("Error estado caja:", e.response?.data || e);
      setMsg("No se pudo cargar el estado de caja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // bandera oficial: viene del backend
  const abierta = !!(estado && estado.abierta === true);

  // ▼▼ datos de apertura y efectivo disponible ▼▼
  const aperturaMonto = Number(
    estado?.apertura_monto ?? estado?.apertura?.mv_monto ?? 0
  );

  const efectivoDisponible = Number(estado?.efectivo_disponible ?? 0);

  const aperturaFechaStr =
    estado?.apertura_fecha || estado?.apertura?.mv_fecha_hora || null;

  const aperturaEmpleado =
    estado?.apertura_empleado_nombre ||
    estado?.apertura?.empleado_nombre ||
    "-";

  const aperturaFechaHora = (() => {
    if (!aperturaFechaStr) return "-";
    try {
      const d = new Date(aperturaFechaStr);
      if (Number.isNaN(d.getTime())) return String(aperturaFechaStr);
      return d.toLocaleString("es-AR");
    } catch {
      return String(aperturaFechaStr);
    }
  })();
  // ▲▲ datos apertura ▲▲

  // Movimientos SOLO de la caja actual (desde la última apertura)
  const cargarMovsActual = async (aperturaBase) => {
    if (!aperturaBase) {
      setMovs([]);
      return;
    }
    setMovsLoading(true);
    setMovsMsg("");
    try {
      const candidates = ["/api/movimientos-caja/", "/api/movimientos_caja/"];
      let todos = [];
      for (const u of candidates) {
        try {
          const res = await api.get(u);
          todos = normAny(res);
          break;
        } catch (e) {
          // intenta siguiente url
        }
      }
      if (!Array.isArray(todos)) todos = [];

      const apDate = new Date(aperturaBase);
      const tAp = apDate.getTime();
      const filtrados = todos.filter((m) => {
        const raw =
          m.mv_fecha_hora || m.mov_fecha_hora || m.fecha || m.created_at;
        if (!raw) return false;
        const d = new Date(raw);
        const t = d.getTime();
        if (Number.isNaN(t)) return false;
        // solo movimientos desde la APERTURA (caja actual)
        return t >= tAp;
      });

      filtrados.sort((a, b) => {
        const da = new Date(
          a.mv_fecha_hora || a.mov_fecha_hora || a.fecha || a.created_at
        ).getTime();
        const db = new Date(
          b.mv_fecha_hora || b.mov_fecha_hora || b.fecha || b.created_at
        ).getTime();
        return da - db; // orden cronológico ascendente
      });

      setMovs(filtrados);
      setPage(1);
    } catch (e) {
      console.log(
        "Error cargando movimientos de la caja actual:",
        e.response?.data || e
      );
      setMovs([]);
      setMovsMsg("No se pudieron cargar los movimientos de la caja actual.");
    } finally {
      setMovsLoading(false);
    }
  };

  // Cada vez que cambia el estado de la caja o la apertura, recargo los movimientos de ESTA caja
  useEffect(() => {
    if (abierta && aperturaFechaStr) {
      cargarMovsActual(aperturaFechaStr);
    } else {
      setMovs([]);
    }
  }, [abierta, aperturaFechaStr]);

  const totalPages = Math.max(
    1,
    Math.ceil((movs?.length || 0) / pageSize)
  );

  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return movs.slice(start, start + pageSize);
  }, [movs, page]);

  const abrirCaja = async () => {
    if (loading) return;

    // chequeo al backend por si el estado del front se quedó viejo
    try {
      const est = await api.get("/api/caja/estado/");
      setEstado(est.data);
      if (est.data.abierta) {
        alert("La caja ya está abierta (según el servidor).");
        return;
      }
    } catch (e) {
      console.log(
        "Error releyendo estado antes de abrir:",
        e.response?.data || e
      );
    }

    const montoNum = Number(montoInicial);
    if (!montoInicial || !Number.isFinite(montoNum) || montoNum <= 5000) {
      alert("Ingresá un monto inicial válido (mayor a 5000).");
      return;
    }

    try {
      await api.post("/api/movimientos-caja/", {
        id_tipo_movimiento_caja: 1, // 1 = Apertura
        mv_monto: montoNum,
        mv_descripcion: "Apertura de caja",
      });
      setMontoInicial("");
      await cargar();
      alert("Caja abierta.");
    } catch (e) {
      console.log("Error abrir caja:", e.response?.data || e);
      alert("No se pudo abrir la caja.");
    }
  };

  const cerrarCaja = async () => {
    if (loading) return;

    // Releer estado directamente del backend ANTES de intentar cerrar
    try {
      const est = await api.get("/api/caja/estado/");
      console.log("Estado caja justo antes de cerrar:", est.data);
      setEstado(est.data);
      if (!est.data.abierta) {
        alert("La caja ya está cerrada (según el servidor).");
        return;
      }
    } catch (e) {
      console.log(
        "Error releyendo estado antes de cerrar:",
        e.response?.data || e
      );
      alert("No se pudo verificar el estado de la caja.");
      return;
    }

    try {
      await api.post("/api/movimientos-caja/", {
        id_tipo_movimiento_caja: 4, // 4 = Cierre
        mv_descripcion: "Cierre de caja",
      });
      await cargar();
      alert("Caja cerrada.");
    } catch (e) {
      console.log("Error cerrar caja:", e.response?.data || e);
      alert("No se pudo cerrar la caja.");
    }
  };

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
        <h2 style={{ margin: 0, color: "#fff" }}>Panel de Caja</h2>
      </div>

      {loading && <p>Cargando estado de caja...</p>}
      {msg && <p style={{ color: "#facc15" }}>{msg}</p>}

      {!loading && (
        <>
          {/* Card principal: solo muestra estado */}
          <div className="card-dark">
            <div className="card-row">
              <div>
                <div className="label">Estado</div>
                <div className={`badge ${abierta ? "ok" : "err"}`}>
                  {abierta ? "Abierta" : "Cerrada"}
                </div>
              </div>
            </div>
          </div>

          {/* Si está cerrada → sólo permite abrir */}
          {!abierta ? (
            <div className="card-dark" style={{ marginTop: 12 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Abrir caja
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="input"
                  placeholder="Monto inicial"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  style={{ maxWidth: 180 }}
                />
                <button className="btn btn-primary" onClick={abrirCaja}>
                  Abrir caja
                </button>
              </div>
            </div>
          ) : (
            // Si está abierta → muestra info de apertura + botón de cerrar
            <div className="card-dark" style={{ marginTop: 12 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Caja abierta
              </div>

              {/* Datos de la apertura actual */}
              <div className="card-row" style={{ marginTop: 8 }}>
                <div>
                  <div className="label">Fecha / hora de apertura</div>
                  <div>{aperturaFechaHora}</div>
                </div>

                <div>
                  <div className="label">Empleado que abrió</div>
                  <div>{aperturaEmpleado}</div>
                </div>

                <div>
                  <div className="label">Monto de apertura</div>
                  <div>${money(aperturaMonto)}</div>
                </div>

                <div>
                  <div className="label">Efectivo disponible</div>
                  <div
                    style={{
                      fontWeight: 600,
                      color:
                        efectivoDisponible >= 0 ? "#22c55e" : "#f97316",
                    }}
                  >
                    {efectivoDisponible >= 0 ? "+" : "-"}$
                    {money(Math.abs(efectivoDisponible))}
                  </div>
                </div>
              </div>

              {/* Referencia oculta a totalesPorMetodo para no generar warnings */}
              <span style={{ display: "none" }}>
                {Object.keys(totalesPorMetodo).length}
              </span>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 10,
                }}
              >
                <button className="btn btn-secondary" onClick={cerrarCaja}>
                  Cerrar caja
                </button>
              </div>
            </div>
          )}

          {/* DataTable de movimientos de la CAJA ACTUAL (desde la apertura) */}
          {abierta && (
            <div className="card-dark" style={{ marginTop: 12 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Movimientos de la caja actual (desde la apertura)
              </div>

              {movsMsg && (
                <p style={{ color: "#facc15", whiteSpace: "pre-wrap" }}>
                  {movsMsg}
                </p>
              )}

              {movsLoading ? (
                <p>Cargando movimientos...</p>
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="table-dark">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Fecha/Hora</th>
                          <th>Tipo</th>
                          <th>Venta</th>
                          <th>Método pago</th>
                          <th>Monto</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ textAlign: "center" }}>
                              Sin registros en esta caja.
                            </td>
                          </tr>
                        )}
                        {pageData.map((m) => (
                          <tr
                            key={
                              m.id_movimiento_caja ??
                              m.id_movimiento ??
                              m.id
                            }
                          >
                            <td>
                              {m.id_movimiento_caja ??
                                m.id_movimiento ??
                                m.id}
                            </td>
                            <td>
                              {fmtDate(
                                m.mv_fecha_hora ??
                                  m.mov_fecha_hora ??
                                  m.fecha ??
                                  m.created_at
                              )}
                            </td>
                            <td>
                              {m.tipo_nombre ??
                                m.tipmov_nombre ??
                                m.id_tipo_movimiento_caja}
                            </td>
                            <td>{m.id_venta ?? m.venta_id ?? "-"}</td>
                            <td>
                              {m.metodo_pago_nombre ??
                                m.metpag_nombre ??
                                m.id_metodo_pago ??
                                "-"}
                            </td>
                            <td>
                              ${money(
                                m.mv_monto ??
                                  m.mov_monto ??
                                  m.monto ??
                                  0
                              )}
                            </td>
                            <td>
                              {m.mv_descripcion ??
                                m.mov_descripcion ??
                                "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                      marginTop: 10,
                    }}
                  >
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        setPage((p) => Math.max(1, p - 1))
                      }
                    >
                      ◀
                    </button>
                    <div
                      className="btn btn-secondary"
                      style={{ cursor: "default" }}
                    >
                      Página {page} / {totalPages}
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(totalPages, p + 1)
                        )
                      }
                    >
                      ▶
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.label { color:#aaa; font-size:14px; }
.card-dark { background:#121212; border:1px solid #232323; border-radius:10px; padding:12px; }
.card-row { display:flex; gap:18px; flex-wrap:wrap; }
.badge { display:inline-block; padding:4px 8px; border-radius:999px; font-weight:700; }
.badge.ok { background:#14532d; color:#a7f3d0; }
.badge.err { background:#7f1d1d; color:#fecaca; }
.input { background:#0f0f10; color:#fff; border:1px solid #2a2a2a; border-radius:8px; padding:8px; }
.table-wrap { overflow:auto; margin-top:8px; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;












