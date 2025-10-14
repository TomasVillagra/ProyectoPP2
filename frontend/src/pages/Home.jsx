import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import logo from '../assets/logo.png';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Home() {
  const [me, setMe] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState({ ventas_hoy: 5000, pedidos: 4, stock_bajo: 6 });

  useEffect(() => {
    (async () => {
      try {
        const meRes = await api.get('/api/auth/me/');
        setMe(meRes.data);
      } catch {}
      try {
        // Ejemplo: ajusta a tu endpoint real (e.g. /api/dashboard/summary/)
        const s = await api.get('/api/dashboard/summary/');
        setStats(s.data);
      } catch {}
    })();
  }, []);

  const doLogout = async () => {
    try { await api.post('/api/auth/logout/'); } catch {}
    window.location.href = '/login';
  };

  return (
    <div className="home">
      <header className="header">
        <div className="brand">
          <img src={logo} alt="Logo" />
          <span>Pizzería Rex</span>
        </div>
        <nav className="nav">
          <a href="#">Inicio</a>
          <a href="#">Pedidos</a>
          <a href="#">Inventario</a>
          <a href="#">Reportes</a>
        </nav>
        <div className="user">
          <span>Hola, {me?.username || 'usuario'}</span>
          <button className="btn btn-outline" onClick={() => setShowConfirm(true)}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="container">
        <section className="grid">
          <div className="card metric">
            <h3>Ventas de hoy</h3>
            <p className="metric-value">${stats.ventas_hoy?.toLocaleString?.() ?? stats.ventas_hoy}</p>
          </div>
          <div className="card metric">
            <h3>Pedidos</h3>
            <p className="metric-value">{stats.pedidos}</p>
          </div>
          <div className="card metric">
            <h3>Insumos bajo mínimo</h3>
            <p className="metric-value">{stats.stock_bajo}</p>
          </div>
        </section>

        <section className="card">
          <h2>Últimos pedidos</h2>
          {/* Renderiza una tabla o lista de /api/pedidos/?limit=10 */}
          {/* Ejemplo: */}
          {/* <OrdersTable /> */}
          <div className="placeholder"></div>
        </section>
      </main>

      <ConfirmDialog
        open={showConfirm}
        title="Confirmar cierre de sesión"
        message="¿Estás seguro que quieres cerrar sesión?"
        onCancel={() => setShowConfirm(false)}
        onConfirm={doLogout}
      />
    </div>
  );
}
