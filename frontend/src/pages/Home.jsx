import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import { FaClock, FaDollarSign, FaExclamationTriangle, FaStore } from 'react-icons/fa';

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

const isActive = (val) => {
  if (val === null || val === undefined || val === "") return true;
  return Number(val) === 1;
};

const esCritico = (item) => {
  if (!isActive(item?.id_estado_insumo)) return false; // Solo activos
  const actual = toNum(item?.ins_stock_actual);
  const repo   = toNum(item?.ins_punto_reposicion);
  return !Number.isNaN(actual) && !Number.isNaN(repo) && actual < repo;
};

// 🔹 Estrategia simple: pedir muchos en una sola página
async function fetchAllInsumos(apiInstance) {
  const url = "/api/insumos/?page_size=1000&format=json";
  const res = await apiInstance.get(url);
  const data = res.data;
  const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
  return items;
}

export default function Home() {
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState({ ventas_hoy: 0, pedidos: 0, stock_bajo: 0 });

  useEffect(() => {
    (async () => {
      // ─────────────────────────────────────────────────────────
      // 1) Usuario actual (igual que antes)
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
      // 2) Summary (si 404, no frena nada)
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
        // console.warn("Summary no disponible:", e?.response?.status);
      }

      // ─────────────────────────────────────────────────────────
      // 3) Cálculo REAL de insumos críticos (siempre corre)
      // ─────────────────────────────────────────────────────────
      try {
        const insumos = await fetchAllInsumos(api);
        const criticosReales = insumos.filter(esCritico).length;
        setStats((prev) => ({ ...prev, stock_bajo: criticosReales }));
      } catch (e) {
        // Si falla, nos quedamos con lo que haya en stats (quizás del summary)
        // console.warn("Error calculando críticos:", e);
      }
    })();
  }, []);

  

  return (
    <DashboardLayout
      
    >
      <div className="dashboard-page-dark">
        <section className="stat-cards-container">
          <StatCard icon={<FaClock />} value={stats.pedidos} title="Pedidos pendientes" />
          <StatCard
            icon={<FaDollarSign />}
            value={`$ ${toNum(stats.ventas_hoy).toLocaleString("es-AR")}`}
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
          <StatCard icon={<FaStore />} value={"Cerrada"} title="Estado de caja" />
        </section>

        <section className="dashboard-main-content">
          <SalesSummary />
          <WeeklySalesChart />
        </section>
      </div>

      

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const StatCard = ({ icon, value, title }) => (
  <div className="widget-card stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-title">{title}</div>
  </div>
);

const SalesSummary = () => (
  <div className="widget-card">
    <h3 className="widget-title">Resumen de ventas hoy</h3>
    <div className="summary-total">
      <span className="summary-amount">$0</span>
      <span className="summary-subtitle">Total del día</span>
    </div>
    <ul className="summary-legend">
      <li>
        <span className="legend-dot" style={{ backgroundColor: "#28a745" }}></span>
        Efectivo<span className="legend-value">$0</span>
      </li>
      <li>
        <span className="legend-dot" style={{ backgroundColor: "#ffc107" }}></span>
        Tarjeta<span className="legend-value">$0</span>
      </li>
      <li>
        <span className="legend-dot" style={{ backgroundColor: "#007bff" }}></span>
        Transferencia<span className="legend-value">$0</span>
      </li>
    </ul>
  </div>
);

const WeeklySalesChart = () => (
  <div className="widget-card">
    <h3 className="widget-title">Ventas semanales</h3>
    <div className="chart-placeholder">
      <p style={{ color: "#a0a0a0", textAlign: "center" }}>Gráfico de ventas no disponible</p>
    </div>
  </div>
);

const btnOutline = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,.2)",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
};

const styles = `
  .dashboard-page-dark { display: flex; flex-direction: column; gap: 24px; }
  .stat-cards-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
  .widget-card { background-color: #2c2c2e; padding: 24px; border-radius: 12px; border: 1px solid #3a3a3c; transition: border-color .15s ease, transform .15s ease; }
  .stat-card { display: flex; flex-direction: column; align-items: flex-start; }
  .stat-icon { font-size: 1.5rem; color: #a0a0a0; margin-bottom: 12px; }
  .stat-value { font-size: 2rem; font-weight: 700; margin-bottom: 4px; color: #fff; }
  .stat-title { font-size: 1rem; color: #a0a0a0; }
  .dashboard-main-content { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; align-items: flex-start; }
  .widget-title { margin: 0 0 24px 0; font-size: 1.2rem; font-weight: 600; color: #a0a0a0; }
  .summary-total { text-align: center; margin-bottom: 24px; }
  .summary-amount { font-size: 2.5rem; font-weight: 700; color: #28a745; }
  .summary-subtitle { display: block; color: #a0a0a0; }
  .summary-legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
  .summary-legend li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
  .legend-value { font-weight: 600; color: #fff; }
  .chart-placeholder { height: 300px; display: flex; align-items: center; justify-content: center; }

  .stat-link { text-decoration: none; color: inherit; }
  .stat-link .widget-card:hover { border-color: #facc15; transform: translateY(-1px); }

  @media (max-width: 980px) { .dashboard-main-content { grid-template-columns: 1fr; } }
`;

