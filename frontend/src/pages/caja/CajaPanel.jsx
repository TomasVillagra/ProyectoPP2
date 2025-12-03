import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";

import CajaPanelHeader from "../../components/caja/CajaPanelHeader";
import CajaPanelEstadoCard from "../../components/caja/CajaPanelEstadoCard";
import CajaPanelAbrirCard from "../../components/caja/CajaPanelAbrirCard";
import CajaPanelAbiertaCard from "../../components/caja/CajaPanelAbiertaCard";
import CajaPanelMovimientos from "../../components/caja/CajaPanelMovimientos";

// 🔹 Gráfico de torta de ventas del día
import SalesSummary from "../../components/home/SalesSummary";
// 🔹 Gráfico histórico (semana/mes/año, etc.)
import WeeklySalesChart from "../../components/home/WeeklySalesChart";

import "./CajaPanel.css";

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
  const [metodos, setMetodos] = useState([]); // (lo dejo por compatibilidad aunque no se use)
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [montoInicial, setMontoInicial] = useState("");

  // movimientos de la caja ACTUAL (desde última apertura)
  const [movs, setMovs] = useState([]);
  const [movsLoading, setMovsLoading] = useState(false);
  const [movsMsg, setMovsMsg] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 🔹 estado de confirmación: "abrir" | "cerrar" | null
  const [accionPendiente, setAccionPendiente] = useState(null);

  // 🔹 datos para WeeklySalesChart (igual que en Home)
  const [weekly, setWeekly] = useState([]); // [{fecha, ingresos}, ...]

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

      // 🔹 Traigo estado de caja, métodos de pago e ingresos históricos
      const [est, mets, ingresosHist] = await Promise.all([
        api.get("/api/caja/estado/"),
        api.get("/api/metodos-pago/"),
        api.get("/api/caja/ingresos-historicos/"),
      ]);

      console.log("Estado caja desde backend:", est.data);
      setEstado(est.data ?? null);
      setMetodos(Array.isArray(mets.data) ? mets.data : []);

      const dias = Array.isArray(ingresosHist.data?.dias)
        ? ingresosHist.data.dias
        : [];
      setWeekly(dias);

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

  const totalPages = Math.max(1, Math.ceil((movs?.length || 0) / pageSize));

  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return movs.slice(start, start + pageSize);
  }, [movs, page]);

  // 🔹 función REAL que llama al backend para abrir la caja
  const ejecutarAbrirCaja = async () => {
    if (loading) return;

    // chequeo al backend por si el estado del front se quedó viejo
    try {
      const est = await api.get("/api/caja/estado/");
      setEstado(est.data);
      if (est.data.abierta) {
        alert("La caja ya está abierta (según el servidor).");
        setAccionPendiente(null);
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
      setAccionPendiente(null);
      await cargar();
      alert("Caja abierta.");
    } catch (e) {
      console.log("Error abrir caja:", e.response?.data || e);
      alert("No se pudo abrir la caja.");
    }
  };

  // 🔹 función REAL que llama al backend para cerrar la caja
  const ejecutarCerrarCaja = async () => {
    if (loading) return;

    // Releer estado directamente del backend ANTES de intentar cerrar
    try {
      const est = await api.get("/api/caja/estado/");
      console.log("Estado caja justo antes de cerrar:", est.data);
      setEstado(est.data);
      if (!est.data.abierta) {
        alert("La caja ya está cerrada (según el servidor).");
        setAccionPendiente(null);
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
      setAccionPendiente(null);
      await cargar();
      alert("Caja cerrada.");
    } catch (e) {
      console.log("Error cerrar caja:", e.response?.data || e);
      alert("No se pudo cerrar la caja.");
    }
  };

  // 🔹 handlers que SOLO activan la confirmación
  const solicitarAbrir = () => {
    if (loading) return;
    setAccionPendiente("abrir");
  };

  const solicitarCerrar = () => {
    if (loading) return;
    setAccionPendiente("cerrar");
  };

  // 🔹 fila de confirmación reutilizable
  const renderConfirmRow = (tipo) => (
    <div className="caja-panel-confirm-row">
      <span className="caja-panel-confirm-text">
        {tipo === "abrir"
          ? "¿Confirmar apertura de caja?"
          : "¿Confirmar cierre de caja?"}
      </span>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setAccionPendiente(null)}
      >
        Cancelar
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={tipo === "abrir" ? ejecutarAbrirCaja : ejecutarCerrarCaja}
      >
        Confirmar
      </button>
    </div>
  );

  return (
    <DashboardLayout>
      {/* ✅ Scope para que el CSS no sea global */}
      <div className="caja-panel-scope">
        <CajaPanelHeader />

        {loading && <p>Cargando estado de caja...</p>}
        {msg && <p className="caja-panel-msg">{msg}</p>}

        {!loading && (
          <>
            <CajaPanelEstadoCard abierta={abierta} />

            {!abierta ? (
              <>
                {/* 🔹 Caja cerrada: card para apertura */}
                <CajaPanelAbrirCard
                  montoInicial={montoInicial}
                  setMontoInicial={setMontoInicial}
                  // ahora solo dispara la confirmación
                  abrirCaja={solicitarAbrir}
                />

                {/* 🔹 Botones Confirmar / Cancelar apertura */}
                {accionPendiente === "abrir" && renderConfirmRow("abrir")}
              </>
            ) : (
              <>
                {/* 🔹 Caja abierta: datos + botón de cierre */}
                <CajaPanelAbiertaCard
                  aperturaFechaHora={aperturaFechaHora}
                  aperturaEmpleado={aperturaEmpleado}
                  aperturaMonto={aperturaMonto}
                  efectivoDisponible={efectivoDisponible}
                  // ahora solo dispara la confirmación
                  cerrarCaja={solicitarCerrar}
                  totalesPorMetodo={totalesPorMetodo}
                  money={money}
                />

                {/* 🔹 Botones Confirmar / Cancelar cierre */}
                {accionPendiente === "cerrar" && renderConfirmRow("cerrar")}

                {/* 🔹 Gráficos: torta + weekly, igual que en Home pero en CajaPanel */}
                <div className="caja-panel-ventas-row">
                  <div className="caja-panel-ventas-card">
                    <SalesSummary
                      ventasHoy={estado?.hoy_ingresos}
                      metodosHoy={estado?.totales_metodo}
                    />
                  </div>
                  <div className="caja-panel-ventas-card">
                    <WeeklySalesChart data={weekly} />
                  </div>
                </div>
              </>
            )}

            {abierta && (
              <CajaPanelMovimientos
                movsLoading={movsLoading}
                movsMsg={movsMsg}
                pageData={pageData}
                page={page}
                totalPages={totalPages}
                setPage={setPage}
                money={money}
                fmtDate={fmtDate}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}















