import { useEffect, useState } from "react";
import { api } from "../api/axios";
import ConfirmDialog from "../components/ConfirmDialog";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function Home() {
  const [me, setMe] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState({ ventas_hoy: 5000, pedidos: 4, stock_bajo: 6 });

  useEffect(() => {
    (async () => {
      try {
        // Usuario autenticado
        const meRes = await api.get("/api/auth/me/");
        let userData = meRes.data;

        // Cargo (match username vs emp_nombre)
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
        } catch {
          // no-op
        }
        setMe(userData);
      } catch {
        // no-op
      }

      try {
        const s = await api.get("/api/dashboard/summary/");
        setStats(s.data);
      } catch {
        // no-op
      }
    })();
  }, []);

  const doLogout = async () => {
    try {
      await api.post("/api/auth/logout/");
    } catch {}
    window.location.href = "/login";
  };

  return (
    <DashboardLayout
      topRight={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {/* Rol del usuario */}
          {me?.cargo_nombre && (
            <span style={{ fontSize: 13, color: "#bcbcbc", marginBottom: 4 }}>
              Rol: <strong style={{ color: "#fff" }}>{me.cargo_nombre}</strong>
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#eaeaea" }}>Bienvenido, {me?.username || "usuario"}</span>
            <button
              onClick={() => setShowConfirm(true)}
              style={btnOutline}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      }
    >
      <main className="container">
        {/* Encabezado de página */}
        <div className="page-head">
          <h1>Panel general</h1>
          <p>Resumen de actividad y estado del sistema</p>
        </div>

        {/* KPIs */}
        <section className="metrics">
          <MetricCard
            title="Ventas de hoy"
            value={
              typeof stats.ventas_hoy === "number"
                ? `$ ${stats.ventas_hoy.toLocaleString("es-AR")}`
                : stats.ventas_hoy
            }
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 15l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            }
          />
          <MetricCard
            title="Pedidos"
            value={stats.pedidos}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            }
          />
          <MetricCard
            title="Insumos bajo mínimo"
            value={stats.stock_bajo}
            accent="warning"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2l9 18H3L12 2z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M12 9v5M12 18h.01" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            }
          />
        </section>

        {/* Últimos pedidos */}
        <section className="card block">
          <div className="block-head">
            <h2>Últimos pedidos</h2>
            <span className="hint">Actualiza para ver cambios recientes</span>
          </div>
          <div className="placeholder" />
        </section>
      </main>

      <ConfirmDialog
        open={showConfirm}
        title="Confirmar cierre de sesión"
        message="¿Estás seguro que quieres cerrar sesión?"
        onCancel={() => setShowConfirm(false)}
        onConfirm={doLogout}
      />

      <style>{styles}</style>
    </DashboardLayout>
  );
}

/* --------- Componentes UI internos (solo presentación) --------- */

function MetricCard({ title, value, icon, accent }) {
  return (
    <div className={`card metric ${accent || ""}`}>
      <div className="metric-top">
        <div className="metric-icon">{icon}</div>
        <div className="metric-title">{title}</div>
      </div>
      <div className="metric-value">{value ?? "-"}</div>
    </div>
  );
}

/* --------- Estilos --------- */

const btnOutline = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,.2)",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
};

const styles = `
  :root {
    --bg: #0e0e0e;
    --panel: #141414;
    --panel-2: #161616;
    --line: #232323;
    --muted: #bcbcbc;
    --muted-2: #9a9a9a;
    --text: #ffffff;
    --accent: #eaeaea;
    --blue: #2563eb;
    --green: #34d399;
    --yellow: #f59e0b;
  }

  .container {
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 28px 28px 48px;
  }

  .page-head {
    margin-bottom: 18px;
  }
  .page-head h1 {
    margin: 0 0 4px;
    color: var(--text);
    font-size: 24px;
    font-weight: 800;
    letter-spacing: .2px;
  }
  .page-head p {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(260px, 1fr));
    gap: 18px;
    margin-bottom: 22px;
  }

  .card {
    background: var(--panel-2);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 16px;
    padding: 16px;
    transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease;
  }
  .card:hover {
    transform: translateY(-2px);
    border-color: rgba(255,255,255,.14);
    box-shadow: 0 8px 24px rgba(0,0,0,.35);
  }

  .metric .metric-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .metric .metric-icon {
    width: 38px; height: 38px;
    display: grid; place-items: center;
    border-radius: 12px;
    background: #0f0f0f;
    border: 1px solid var(--line);
    color: #e5e5e5;
  }
  .metric .metric-title {
    margin-left: auto;
    color: var(--muted);
    font-weight: 600;
    font-size: 13px;
  }
  .metric .metric-value {
    font-size: 30px;
    font-weight: 900;
    color: var(--text);
    letter-spacing: .3px;
  }
  .metric.warning .metric-icon {
    color: var(--yellow);
    border-color: rgba(245,158,11,.45);
  }

  .block {
    padding: 0;
    overflow: hidden;
  }
  .block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
    background: linear-gradient(180deg, #121212, #101010);
  }
  .block-head h2 {
    margin: 0; color: var(--text); font-size: 18px; font-weight: 800;
  }
  .block-head .hint {
    color: var(--muted-2);
    font-size: 12px;
  }
  .placeholder {
    height: 240px;
    background:
      linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.02));
  }

  /* Responsive */
  @media (max-width: 980px) {
    .metrics {
      grid-template-columns: 1fr;
    }
  }
`;
