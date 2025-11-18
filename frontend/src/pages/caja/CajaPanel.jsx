// src/pages/caja/CajaPanel.jsx
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";
const api = apiNamed || apiDefault;

/* Helpers */
const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

export default function CajaPanel() {
  const [estado, setEstado] = useState(null); // {abierta: bool, ...}
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [montoInicial, setMontoInicial] = useState("");

  const totalesPorMetodo = useMemo(() => {
    const acc = {};
    (estado?.totales_metodo || []).forEach((t) => {
      const nombre =
        t.metpag_nombre || t.metpago_nombre || t.nombre || `Método ${t.id}`;
      acc[nombre] = Number(t.total || 0);
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
            // Si está abierta → solo botón de cerrar caja (sin mostrar totales)
            <div className="card-dark" style={{ marginTop: 12 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Caja abierta
              </div>

              {/* Referencia oculta a totalesPorMetodo para no romper nada ni generar warnings */}
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









