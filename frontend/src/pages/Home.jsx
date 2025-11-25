import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import { FaClock, FaExclamationTriangle, FaStore } from "react-icons/fa";
import ReactApexChart from "react-apexcharts";

/* ============================
   Utilidades para críticos
   ============================ */

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
  const items = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];
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
  clean(
    r.estado_nombre ?? r.estped_nombre ?? r.estado ?? r.id_estado_pedido
  );

const esEnProceso = (r) => estadoNombreDe(r) === "en proceso";

export default function Home() {
  // eslint-disable-next-line no-unused-vars
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState({
    ventas_hoy: 0,
    pedidos: 0,
    stock_bajo: 0,
  });
  const [cajaEstado, setCajaEstado] = useState(null);
  const [metodosHoy, setMetodosHoy] = useState([]); // ingresos por método de hoy
  const [weekly, setWeekly] = useState([]); // datos históricos por día

  useEffect(() => {
    (async () => {
      // ─────────────────────────────────────────────────────────
      // 1) Usuario actual
      // ─────────────────────────────────────────────────────────
      try {
        const meRes = await api.get("/api/auth/me/");
        let userData = meRes.data;
        try {
          const empRes = await api.get(
            `/api/empleados/?username=${userData.username}`
          );
          const list = Array.isArray(empRes.data?.results)
            ? empRes.data.results
            : Array.isArray(empRes.data)
            ? empRes.data
            : [];
          const match = list.find(
            (e) =>
              e.emp_nombre?.toLowerCase() ===
              userData.username?.toLowerCase()
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
        let arrMetodos = Array.isArray(ce?.totales_metodo)
          ? ce.totales_metodo
          : [];

        // 🔹 Ajuste front-end: restar el monto de apertura del método EFECTIVO
        // para que el gráfico NO cuente la apertura como venta.
        const aperturaMonto = toNum(ce?.apertura_monto) || 0;
        if (aperturaMonto > 0 && arrMetodos.length > 0) {
          // clonamos para no mutar referencias originales
          arrMetodos = arrMetodos.map((m) => ({ ...m }));
          const idxEfectivo = arrMetodos.findIndex((m) => {
            const id = m.id_metodo_pago ?? m.id;
            const nombre = (
              m.nombre ||
              m.metodo_pago_nombre ||
              m.metpag_nombre ||
              ""
            )
              .toString()
              .toLowerCase();
            return id === 1 || nombre.includes("efectivo");
          });

          if (idxEfectivo !== -1) {
            const m = arrMetodos[idxEfectivo];
            const bruto = toNum(
              m.ingresos ?? m.total ?? m.saldo ?? m.monto ?? 0
            );
            const neto = bruto - aperturaMonto;
            const limpio = neto > 0 ? neto : 0;

            if (Object.prototype.hasOwnProperty.call(m, "ingresos")) {
              m.ingresos = limpio;
            } else if (Object.prototype.hasOwnProperty.call(m, "total")) {
              m.total = limpio;
            } else {
              m.monto = limpio;
            }
          }
        }

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
      // 6) Ingresos históricos por día (toda la base)
      // ─────────────────────────────────────────────────────────
      try {
        const r = await api.get("/api/caja/ingresos-historicos/");
        const dias = Array.isArray(r.data?.dias) ? r.data.dias : [];
        setWeekly(dias);
      } catch (e) {
        console.error("Error obteniendo ingresos históricos:", e);
      }
    })();
  }, []);

  const cajaAbierta = !!(cajaEstado && cajaEstado.abierta === true);

  return (
    <DashboardLayout>
      <div className="dashboard-page-dark">
        <section className="stat-cards-container">
          {/* Pedidos pendientes = pedidos con estado "En proceso" */}
          <StatCard
            icon={<FaClock />}
            value={stats.pedidos}
            title="Pedidos pendientes"
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
 * Resumen de ventas hoy:
 * - Total
 * - Lista por método
 * - Donut ApexCharts
 */
const SalesSummary = ({ ventasHoy, metodosHoy }) => {
  const metodos = (Array.isArray(metodosHoy) ? metodosHoy : [])
    .map((m) => {
      const nombre =
        m.nombre ??
        m.metodo_pago_nombre ??
        m.metodo ??
        `Método ${m.id_metodo_pago ?? ""}`;

      // Usamos primero "ingresos" (solo ventas),
      // si no está, usamos "total" o "saldo" como fallback.
      const montoMetodo = toNum(
        m.ingresos ?? m.total ?? m.saldo ?? m.monto ?? 0
      );

      return {
        nombre,
        total: Number.isNaN(montoMetodo) ? 0 : montoMetodo,
      };
    })
    // Solo mostramos métodos con monto positivo
    .filter((m) => m.total > 0);

  const sumaMetodos = metodos.reduce((acc, m) => acc + m.total, 0);
  const totalMostrar = sumaMetodos || (toNum(ventasHoy) || 0);

  const colors = [
    "#22c55e",
    "#3b82f6",
    "#f97316",
    "#a855f7",
    "#ef4444",
    "#14b8a6",
  ];

  if (!metodos.length) {
    return (
      <div className="widget-card">
        <h3 className="widget-title">Resumen de ventas hoy</h3>
        <div className="summary-total">
          <span className="summary-amount">{money(totalMostrar)}</span>
          <span className="summary-subtitle">Total de ingresos del día</span>
        </div>
        <div className="chart-placeholder">
          <p style={{ color: "#a0a0a0", textAlign: "center" }}>
            Sin ventas registradas hoy
          </p>
        </div>
      </div>
    );
  }

  const series = metodos.map((m) => m.total);
  const labels = metodos.map((m) => m.nombre);

  const options = {
    chart: {
      type: "donut",
      background: "transparent",
      toolbar: { show: false },
    },
    labels,
    colors,
    legend: {
      show: false,
      position: "right",
      labels: {
        colors: "#e5e5e5",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
      style: {
        fontSize: "12px",
        fontWeight: 500,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: 6,
            },
            value: {
              show: true,
              formatter: (val) => money(parseFloat(val) || 0),
            },
            total: {
              show: true,
              label: "Total",
              formatter: () => money(totalMostrar),
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value) => money(value),
      },
    },
    theme: {
      mode: "dark",
    },
    stroke: {
      width: 0,
    },
  };

  return (
    <div className="widget-card">
      <h3 className="widget-title">Resumen de ventas hoy</h3>

      <div className="summary-total">
        <span className="summary-amount">{money(totalMostrar)}</span>
        <span className="summary-subtitle">Total de ingresos del día</span>
      </div>

      <div className="summary-content">
        <div className="summary-pie-wrapper">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={200}
          />
        </div>

        <ul className="summary-legend">
          {metodos.map((m, idx) => (
            <li key={idx}>
              <span
                className="legend-dot"
                style={{ backgroundColor: colors[idx % colors.length] }}
              ></span>
              {labels[idx]}
              <span className="legend-value">{money(m.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * Gráfico de ventas con ApexCharts + filtros:
 * - Semana (esta semana, por día)
 * - Mes (mes actual dividido por semanas)
 * - Año (año actual por mes)
 * - Histórico (todos los años)
 * - Rango (entre dos fechas, por día)
 */
const WeeklySalesChart = ({ data }) => {
  const dias = Array.isArray(data) ? data : [];
  const [mode, setMode] = useState("semana"); // 'semana' | 'mes' | 'anio' | 'hist' | 'rango'
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const parseDate = (str) => {
    if (!str || !str.includes("-")) return null;
    const [ys, ms, ds] = str.split("-");
    const y = Number(ys);
    const m = Number(ms);
    const d = Number(ds);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  };

  // Ordenamos por fecha para filtros
  const diasOrdenados = [...dias].sort((a, b) =>
    (a.fecha || "").localeCompare(b.fecha || "")
  );

  // Inicializar selects cuando cambian los datos
  useEffect(() => {
    if (!diasOrdenados.length) return;
    const first = diasOrdenados[0]?.fecha || "";
    const last = diasOrdenados[diasOrdenados.length - 1]?.fecha || "";
    setRangeFrom(first);
    setRangeTo(last);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Construir dataset según modo
  let chartLabel = "Ventas";
  let chartSeries = [];
  let categories = [];

  if (!diasOrdenados.length) {
    return (
      <div className="widget-card">
        <div className="widget-header">
          <h3 className="widget-title">Ventas</h3>
          <div className="chart-filters">
            <button className="chart-filter active">Semana</button>
            <button className="chart-filter">Mes</button>
            <button className="chart-filter">Año</button>
            <button className="chart-filter">Histórico</button>
            <button className="chart-filter">Rango</button>
          </div>
        </div>
        <div className="chart-placeholder">
          <p style={{ color: "#a0a0a0", textAlign: "center" }}>
            Sin datos de ventas
          </p>
        </div>
      </div>
    );
  }

  const hoy = new Date();
  const hoyYear = hoy.getFullYear();
  const hoyMonth = hoy.getMonth() + 1; // 1-12

  if (mode === "mes") {
    // 🔹 Mes actual, día por día (1,2,3,...)
    const ingresosPorDia = {}; // dayOfMonth -> total

    diasOrdenados.forEach((d) => {
      const dt = parseDate(d.fecha);
      if (!dt) return;
      const year = dt.getFullYear();
      const month = dt.getMonth() + 1;
      if (year !== hoyYear || month !== hoyMonth) return;

      const dayOfMonth = dt.getDate();
      const ingreso = toNum(d.ingresos) || 0;
      ingresosPorDia[dayOfMonth] =
        (ingresosPorDia[dayOfMonth] || 0) + ingreso;
    });

    // Último día: HOY (no fin de mes)
    const ultimoDia = hoy.getDate();

    const cats = [];
    const dataMes = [];

    for (let day = 1; day <= ultimoDia; day++) {
      const label = `${String(day).padStart(2, "0")}/${String(
        hoyMonth
      ).padStart(2, "0")}`;
      cats.push(label);
      dataMes.push(ingresosPorDia[day] || 0); // 0 si no hubo ingresos
    }


    categories = cats;
    chartLabel = `Ventas del mes (día a día)`;
    chartSeries = [{ name: "Ingresos", data: dataMes }];
  } else if (mode === "anio") {
    // 🔹 Año actual por mes
    const grupos = {}; // mesNum -> total

    diasOrdenados.forEach((d) => {
      const dt = parseDate(d.fecha);
      if (!dt) return;
      const year = dt.getFullYear();
      if (year !== hoyYear) return;
      const month = dt.getMonth() + 1;
      const ingreso = toNum(d.ingresos) || 0;
      grupos[month] = (grupos[month] || 0) + ingreso;
    });

    const monthNames = [
      "",
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    const entries = Object.entries(grupos).sort(
      ([a], [b]) => Number(a) - Number(b)
    );
    categories = entries.map(([m]) => monthNames[Number(m)] || m);
    const dataAnio = entries.map(([, total]) => total);

    chartLabel = `Ventas por mes (${hoyYear})`;
    chartSeries = [{ name: "Ingresos", data: dataAnio }];
  } else if (mode === "hist") {
    // 🔹 Histórico: todos los años
    const grupos = {}; // year -> total

    diasOrdenados.forEach((d) => {
      const dt = parseDate(d.fecha);
      if (!dt) return;
      const year = dt.getFullYear();
      const ingreso = toNum(d.ingresos) || 0;
      grupos[year] = (grupos[year] || 0) + ingreso;
    });

    const entries = Object.entries(grupos).sort(
      ([a], [b]) => Number(a) - Number(b)
    );
    categories = entries.map(([y]) => String(y));
    const dataHist = entries.map(([, total]) => total);

    chartLabel = "Ventas históricas por año";
    chartSeries = [{ name: "Ingresos", data: dataHist }];
  } else {
    // 🔹 Modos: semana (esta semana) / rango (personalizado)
    let filtrados = diasOrdenados;

    if (mode === "rango" && rangeFrom && rangeTo) {
      filtrados = diasOrdenados.filter((d) => {
        const f = (d.fecha || "").slice(0, 10);
        return f >= rangeFrom.slice(0, 10) && f <= rangeTo.slice(0, 10);
      });
      chartLabel = "Ventas por rango";
    } else if (mode === "semana") {
      // 🔹 Solo los días de ESTA semana (lunes a domingo)
      const day = hoy.getDay(); // 0 = domingo, 1 = lunes, ...
      const diffToMonday = (day + 6) % 7; // cuántos días retroceder hasta lunes

      const lunes = new Date(hoy);
      lunes.setHours(0, 0, 0, 0);
      lunes.setDate(hoy.getDate() - diffToMonday);

      const domingo = new Date(lunes);
      domingo.setHours(23, 59, 59, 999);
      domingo.setDate(lunes.getDate() + 6);

      filtrados = diasOrdenados.filter((d) => {
        const dt = parseDate(d.fecha);
        if (!dt) return false;
        return dt >= lunes && dt <= domingo;
      });

      chartLabel = "Ventas de esta semana";
    }

    categories = filtrados.map((d) => {
      const fecha = d.fecha || "";
      if (!fecha.includes("-")) return fecha;
      const [, m, dayStr] = fecha.split("-");
      return `${dayStr}/${m}`;
    });

    const dataVals = filtrados.map((d) => toNum(d.ingresos) || 0);
    chartSeries = [{ name: "Ingresos", data: dataVals }];
  }

  const chartType =
    mode === "mes" || mode === "anio" || mode === "hist" ? "bar" : "line";

  const options = {
    chart: {
      type: chartType,
      background: "transparent",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: "#e5e5e5",
        },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#e5e5e5" },
        formatter: (value) =>
          `$ ${Number(value).toLocaleString("es-AR", {
            maximumFractionDigits: 0,
          })}`,
      },
    },
    grid: {
      borderColor: "rgba(255,255,255,0.08)",
    },
    tooltip: {
      y: {
        formatter: (value) => money(value),
      },
    },
    dataLabels: {
      enabled: false,
    },
    theme: {
      mode: "dark",
    },
    colors: ["#facc15"],
  };

  return (
    <div className="widget-card">
      <div className="widget-header">
        <h3 className="widget-title">{chartLabel}</h3>
        <div className="chart-filters">
          <button
            className={`chart-filter ${mode === "semana" ? "active" : ""}`}
            onClick={() => setMode("semana")}
          >
            Semana
          </button>
          <button
            className={`chart-filter ${mode === "mes" ? "active" : ""}`}
            onClick={() => setMode("mes")}
          >
            Mes
          </button>
          <button
            className={`chart-filter ${mode === "anio" ? "active" : ""}`}
            onClick={() => setMode("anio")}
          >
            Año
          </button>
          <button
            className={`chart-filter ${mode === "hist" ? "active" : ""}`}
            onClick={() => setMode("hist")}
          >
            Histórico
          </button>
          <button
            className={`chart-filter ${mode === "rango" ? "active" : ""}`}
            onClick={() => setMode("rango")}
          >
            Rango
          </button>
        </div>
      </div>

      {mode === "rango" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <select
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
            style={{
              background: "#111827",
              color: "#e5e5e5",
              borderRadius: 8,
              border: "1px solid #374151",
              padding: "4px 8px",
            }}
          >
            {diasOrdenados.map((d) => (
              <option key={`from-${d.fecha}`} value={d.fecha}>
                Desde {d.fecha}
              </option>
            ))}
          </select>
          <select
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
            style={{
              background: "#111827",
              color: "#e5e5e5",
              borderRadius: 8,
              border: "1px solid #374151",
              padding: "4px 8px",
            }}
          >
            {diasOrdenados.map((d) => (
              <option key={`to-${d.fecha}`} value={d.fecha}>
                Hasta {d.fecha}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="chart-wrapper">
        <ReactApexChart
          options={options}
          series={chartSeries}
          type={chartType}
          height={320}
        />
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

  .widget-title { margin: 0 0 16px 0; font-size: 1.2rem; font-weight: 600; color: #a0a0a0; }

  .summary-total { text-align: center; margin-bottom: 16px; }
  .summary-amount { font-size: 2.2rem; font-weight: 700; color: #22c55e; }
  .summary-subtitle { display: block; color: #a0a0a0; }

  .summary-content { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 16px; align-items: center; }

  .summary-legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .summary-legend li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; color: #e5e5e5; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
  .legend-value { font-weight: 600; color: #fff; }

  .summary-pie-wrapper { display: flex; align-items: center; justify-content: center; }

  .chart-wrapper { height: 340px; }

  .chart-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; }

  .widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .chart-filters {
    display: inline-flex;
    gap: 8px;
    background: #1f2933;
    border-radius: 999px;
    padding: 4px;
  }

  .chart-filter {
    border: none;
    background: transparent;
    color: #9ca3af;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color .15s ease, color .15s ease;
  }

  .chart-filter.active {
    background-color: #facc15;
    color: #111827;
    font-weight: 600;
  }

  .stat-link { text-decoration: none; color: inherit; }
  .stat-link .widget-card:hover { border-color: #facc15; transform: translateY(-1px); }

  @media (max-width: 980px) {
    .dashboard-main-content { grid-template-columns: 1fr; }
    .summary-content { grid-template-columns: 1fr; }
  }
`;










