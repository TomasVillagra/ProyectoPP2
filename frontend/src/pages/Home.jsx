import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import { FaClock, FaDollarSign, FaExclamationTriangle, FaStore } from "react-icons/fa";

/* ============================
   Utilidades para críticos
   ============================ */
// "18.000" -> 18 ; "12,5" -> 12.5
const toNum = (v) => {
  if (v === null || v === undefined || v === "") return NaN;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).trim().replace(",", "."));
  return Number.isNaN(n) ? NaN : n;
};

const money = (v) => {
  const n = toNum(v);
  if (Number.isNaN(n)) return "$ 0";
  return `$ ${n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const isActive = (val) => {
  if (val === null || val === undefined || val === "") return true;
  return Number(val) === 1;
};

const esCritico = (item) => {
  if (!isActive(item?.id_estado_insumo)) return false; // Solo activos
  const actual = toNum(item?.ins_stock_actual);
  const repo = toNum(item?.ins_punto_reposicion);
  return !Number.isNaN(actual) && !Number.isNaN(repo) && actual < repo;
};

// 🔹 Estrategia simple: pedir muchos en una sola página
async function fetchAllInsumos(apiInstance) {
  const url = "/api/insumos/?page_size=1000&format=json";
  const res = await apiInstance.get(url);
  const data = res.data;
  const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  return items;
}

/* ============================
   Helpers para pedidos
   ============================ */

const normalizeList = (raw) => {
  if (!raw) return [];
  const data = raw.data ?? raw;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const lower = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const clean = (s) => lower(s).trim();

const estadoNombreDe = (r) =>
  clean(r.estado_nombre ?? r.estped_nombre ?? r.estado ?? r.id_estado_pedido);

const esEnProceso = (r) => estadoNombreDe(r) === "en proceso";

export default function Home() {
  // eslint-disable-next-line no-unused-vars
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState({ ventas_hoy: 0, pedidos: 0, stock_bajo: 0 });
  const [cajaEstado, setCajaEstado] = useState(null);
  const [metodosHoy, setMetodosHoy] = useState([]); // ingresos por método de hoy
  const [weekly, setWeekly] = useState([]); // datos para el gráfico semanal

  useEffect(() => {
    (async () => {
      // ─────────────────────────────────────────────────────────
      // 1) Usuario actual (lo dejamos por si lo usás en otros lados)
      // ─────────────────────────────────────────────────────────
      try {
        const meRes = await api.get("/api/auth/me/");
        let userData = meRes.data;
        try {
          const empRes = await api.get(`/api/empleados/?username=${userData.username}`);
          const list = Array.isArray(empRes.data?.results)
            ? empRes.data.results
            : Array.isArray(empRes.data)
            ? empRes.data
            : [];
          const match = list.find(
            (e) => e.emp_nombre?.toLowerCase() === userData.username?.toLowerCase()
          );
          if (match) userData = { ...userData, cargo_nombre: match.cargo_nombre };
        } catch {}
        setMe(userData);
      } catch {}

      // ─────────────────────────────────────────────────────────
      // 2) Summary (fallback, por si algo falla)
      // ─────────────────────────────────────────────────────────
      try {
        const s = await api.get("/api/dashboard/summary/");
        const srv = s.data || {};
        setStats((prev) => ({
          ventas_hoy: toNum(srv.ventas_hoy) || prev.ventas_hoy || 0,
          pedidos: toNum(srv.pedidos) || prev.pedidos || 0,
          stock_bajo: toNum(srv.stock_bajo) || prev.stock_bajo || 0,
        }));
      } catch (e) {
        // 404 u otro error: seguimos sin romper el flujo
      }

      // ─────────────────────────────────────────────────────────
      // 3) Estado de caja actual (abierta/cerrada + ventas del día + métodos)
      // ─────────────────────────────────────────────────────────
      try {
        const resCaja = await api.get("/api/caja/estado/");
        const ce = resCaja.data ?? resCaja ?? null;
        setCajaEstado(ce);

        const ingresosHoy = toNum(ce?.hoy_ingresos) || 0;
        setStats((prev) => ({ ...prev, ventas_hoy: ingresosHoy }));

        // Usamos el arreglo que arma la view: "totales_metodo"
        const arrMetodos = Array.isArray(ce?.totales_metodo) ? ce.totales_metodo : [];
        setMetodosHoy(arrMetodos);
      } catch (e) {
        console.error("Error obteniendo estado de caja:", e);
      }

      // ─────────────────────────────────────────────────────────
      // 4) Pedidos "En proceso" (pendientes reales)
      // ─────────────────────────────────────────────────────────
      try {
        const resPed = await api.get("/api/pedidos/");
        const lista = normalizeList(resPed);
        const enProcesoCount = lista.filter(esEnProceso).length;
        setStats((prev) => ({ ...prev, pedidos: enProcesoCount }));
      } catch (e) {
        // Si falla, se queda con el valor del summary (si lo hubo)
      }

      // ─────────────────────────────────────────────────────────
      // 5) Cálculo REAL de insumos críticos
      // ─────────────────────────────────────────────────────────
      try {
        const insumos = await fetchAllInsumos(api);
        const criticosReales = insumos.filter(esCritico).length;
        setStats((prev) => ({ ...prev, stock_bajo: criticosReales }));
      } catch (e) {
        // Si falla, nos quedamos con lo que haya en stats (quizás del summary)
      }

      // ─────────────────────────────────────────────────────────
      // 6) Ingresos por día de los últimos 7 días (sin domingos)
      // ─────────────────────────────────────────────────────────
      try {
        const r = await api.get("/api/caja/ingresos-semanales/");
        const dias = Array.isArray(r.data?.dias) ? r.data.dias : [];
        setWeekly(dias);
      } catch (e) {
        console.error("Error obteniendo ingresos semanales:", e);
      }
    })();
  }, []);

  const cajaAbierta = !!(cajaEstado && cajaEstado.abierta === true);

  return (
    <DashboardLayout>
      <div className="dashboard-page-dark">
        <section className="stat-cards-container">
          {/* Pedidos pendientes = pedidos con estado "En proceso" */}
          <StatCard icon={<FaClock />} value={stats.pedidos} title="Pedidos pendientes" />

          {/* Ventas del día = ingresos desde la apertura de la caja actual */}
          <StatCard
            icon={<FaDollarSign />}
            value={money(stats.ventas_hoy)}
            title="Ventas del día"
          />

          {/* Clic a /inventario, sin filtros */}
          <Link to="/inventario" className="stat-link">
            <StatCard
              icon={<FaExclamationTriangle />}
              value={stats.stock_bajo}
              title="Insumos críticos"
            />
          </Link>

          {/* Estado real de caja (Abierta / Cerrada) */}
          <StatCard
            icon={<FaStore />}
            value={cajaAbierta ? "Abierta" : "Cerrada"}
            title="Estado de caja"
          />
        </section>

        <section className="dashboard-main-content">
          <SalesSummary ventasHoy={stats.ventas_hoy} metodosHoy={metodosHoy} />
          <WeeklySalesChart data={weekly} />
        </section>
      </div>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

/* ============================
   Componentes de UI
   ============================ */

const StatCard = ({ icon, value, title }) => (
  <div className="widget-card stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-title">{title}</div>
  </div>
);

/**
 * Componente de gráfico de torta usando conic-gradient
 */
const PieChart = ({ values, colors }) => {
  const total = values.reduce((acc, v) => acc + v, 0);
  if (total <= 0) {
    return (
      <div className="chart-placeholder">
        <p style={{ color: "#a0a0a0", textAlign: "center" }}>Sin datos para mostrar</p>
      </div>
    );
  }

  let acumulado = 0;
  const segments = values
    .map((v, i) => {
      const start = (acumulado / total) * 100;
      acumulado += v;
      const end = (acumulado / total) * 100;
      return `${colors[i % colors.length]} ${start}% ${end}%`;
    })
    .join(", ");

  const style = {
    backgroundImage: `conic-gradient(${segments})`,
  };

  return <div className="pie-chart" style={style} />;
};

/**
 * Resumen de ventas hoy:
 * - Total
 * - Lista por método
 * - Gráfico de torta
 */
const SalesSummary = ({ ventasHoy, metodosHoy }) => {
  const total = toNum(ventasHoy) || 0;

  const metodos = (Array.isArray(metodosHoy) ? metodosHoy : [])
    .map((m) => ({
      nombre: m.nombre ?? m.metodo_pago_nombre ?? m.metodo ?? `Método ${m.id_metodo_pago ?? ""}`,
      total: toNum(m.total),
    }))
    .filter((m) => !Number.isNaN(m.total) && m.total > 0);

  const labels = metodos.map((m) => m.nombre);
  const dataValues = metodos.map((m) => m.total);

  const colors = ["#28a745", "#dc3545", "#007bff", "#ffc107", "#6f42c1", "#20c997"];

  return (
    <div className="widget-card">
      <h3 className="widget-title">Resumen de ventas hoy</h3>

      <div className="summary-total">
        <span className="summary-amount">{money(total)}</span>
        <span className="summary-subtitle">Total de ingresos del día</span>
      </div>

      <div className="summary-content">
        <ul className="summary-legend">
          {metodos.length === 0 && (
            <li style={{ color: "#a0a0a0" }}>Sin ventas registradas hoy</li>
          )}
          {metodos.map((m, idx) => (
            <li key={idx}>
              <span
                className="legend-dot"
                style={{ backgroundColor: colors[idx % colors.length] }}
              ></span>
              {m.nombre}
              <span className="legend-value">{money(m.total)}</span>
            </li>
          ))}
        </ul>

        <div className="summary-pie-wrapper">
          {metodos.length > 0 ? (
            <PieChart values={dataValues} colors={colors} />
          ) : (
            <div className="chart-placeholder">
              <p style={{ color: "#a0a0a0", textAlign: "center" }}>
                Sin datos para mostrar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Gráfico semanal mejorado con SVG:
 * - Eje Y con montos
 * - Eje X con día + fecha
 * - Grilla
 * - Valores sobre cada punto
 */
const WeeklySalesChart = ({ data }) => {
  const dias = Array.isArray(data) ? data : [];

  const labels = dias.map((d) => d.label ?? d.fecha);
  const values = dias.map((d) => toNum(d.ingresos) || 0);

  if (!values.length) {
    return (
      <div className="widget-card">
        <h3 className="widget-title">Ventas semanales</h3>
        <div className="chart-placeholder">
          <p style={{ color: "#a0a0a0", textAlign: "center" }}>
            Sin datos de los últimos días
          </p>
        </div>
      </div>
    );
  }

  const max = Math.max(...values, 1);

  // Ticks “lindos” en el eje Y (4 niveles)
  const ticks = [];
  const step = max / 4;
  for (let i = 0; i <= 4; i++) {
    ticks.push(step * i);
  }

  // Área de dibujo dentro del SVG
  const plotLeft = 18;
  const plotRight = 115;
  const plotTop = 8;
  const plotBottom = 85;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const scaleY = (v) => {
    const ratio = v / max;
    return plotBottom - ratio * plotHeight;
  };

  const scaleX = (idx) => {
    const n = Math.max(values.length - 1, 1);
    return plotLeft + (idx / n) * plotWidth;
  };

  const points = values
    .map((v, i) => `${scaleX(i)},${scaleY(v)}`)
    .join(" ");

  return (
    <div className="widget-card">
      <h3 className="widget-title">Ventas semanales</h3>
      <div className="chart-wrapper">
        <svg viewBox="0 0 120 100" className="line-chart-svg">
          {/* Grilla horizontal + labels eje Y */}
          {ticks.map((t, i) => {
            const y = scaleY(t);
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={plotLeft}
                  y1={y}
                  x2={plotRight}
                  y2={y}
                  className="line-chart-grid"
                />
                <text
                  x={plotLeft - 2}
                  y={y + 2}
                  textAnchor="end"
                  className="line-chart-ylabel"
                >
                  {`$${Math.round(t).toLocaleString("es-AR")}`}
                </text>
              </g>
            );
          })}

          {/* Eje X */}
          <line
            x1={plotLeft}
            y1={plotBottom}
            x2={plotRight}
            y2={plotBottom}
            className="line-chart-axis"
          />

          {/* Línea de datos */}
          <polyline className="line-chart-line" points={points} />

          {/* Puntos + valor arriba */}
          {values.map((v, i) => {
            const x = scaleX(i);
            const y = scaleY(v);
            return (
              <g key={`pt-${i}`}>
                <circle cx={x} cy={y} r="2.5" className="line-chart-point" />
                <text
                  x={x}
                  y={y - 4}
                  textAnchor="middle"
                  className="line-chart-value"
                >
                  {`$${v.toLocaleString("es-AR")}`}
                </text>
              </g>
            );
          })}

          {/* Labels del eje X: día + fecha corta */}
          {dias.map((d, i) => {
            const x = scaleX(i);
            const fecha = d.fecha || "";
            let fechaCorta = fecha;
            if (fecha.includes("-")) {
              const [y, m, day] = fecha.split("-");
              fechaCorta = `${day}/${m}`;
            }
            const labelLinea1 = labels[i] || "";
            const labelLinea2 = fechaCorta;

            return (
              <g key={`xl-${i}`}>
                <text
                  x={x}
                  y={92}
                  textAnchor="middle"
                  className="line-chart-xlabel"
                >
                  {labelLinea1}
                </text>
                <text
                  x={x}
                  y={97}
                  textAnchor="middle"
                  className="line-chart-xlabel-fecha"
                >
                  {labelLinea2}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};


/* ============================
   Estilos
   ============================ */

const styles = `
  .dashboard-page-dark { display: flex; flex-direction: column; gap: 24px; }
  .stat-cards-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
  .widget-card { background-color: #2c2c2e; padding: 24px; border-radius: 12px; border: 1px solid #3a3a3c; transition: border-color .15s ease, transform .15s ease; }
  .stat-card { display: flex; flex-direction: column; align-items: flex-start; }
  .stat-icon { font-size: 1.5rem; color: #a0a0a0; margin-bottom: 12px; }
  .stat-value { font-size: 2rem; font-weight: 700; margin-bottom: 4px; color: #fff; }
  .stat-title { font-size: 1rem; color: #a0a0a0; }
  .dashboard-main-content { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; align-items: stretch; }

  .widget-title { margin: 0 0 24px 0; font-size: 1.2rem; font-weight: 600; color: #a0a0a0; }

  .summary-total { text-align: center; margin-bottom: 24px; }
  .summary-amount { font-size: 2.5rem; font-weight: 700; color: #28a745; }
  .summary-subtitle { display: block; color: #a0a0a0; }

  .summary-content { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; align-items: center; }

  .summary-legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
  .summary-legend li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; color: #e5e5e5; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
  .legend-value { font-weight: 600; color: #fff; }

  .summary-pie-wrapper { height: 220px; display: flex; align-items: center; justify-content: center; }

  .pie-chart { width: 210px; height: 210px; border-radius: 50%; }

  .chart-wrapper { height: 260px; }

  .chart-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; }

  .line-chart-svg { width: 100%; height: 100%; }

  .line-chart-grid {
    stroke: rgba(255,255,255,0.06);
    stroke-width: 0.3;
  }

  .line-chart-axis {
    stroke: rgba(255,255,255,0.35);
    stroke-width: 0.4;
  }

  .line-chart-line {
    fill: none;
    stroke: #facc15;
    stroke-width: 1.5;
  }

  .line-chart-point {
    fill: #facc15;
  }

  .line-chart-ylabel {
    font-size: 3.4px;
    fill: #cfcfcf;
  }

  .line-chart-xlabel,
  .line-chart-xlabel-fecha {
    font-size: 3.4px;
    fill: #e5e5e5;
  }

  .line-chart-xlabel-fecha {
    fill: #9ca3af;
  }

  .line-chart-value {
    font-size: 3.2px;
    fill: #facc15;
    font-weight: 600;
  }


  .stat-link { text-decoration: none; color: inherit; }
  .stat-link .widget-card:hover { border-color: #facc15; transform: translateY(-1px); }

  @media (max-width: 980px) {
    .dashboard-main-content { grid-template-columns: 1fr; }
    .summary-content { grid-template-columns: 1fr; }
  }
`;





