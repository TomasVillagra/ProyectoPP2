import { NavLink } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { api } from "../../api/axios";
import logo from "../../assets/logo.png";
import { FaHome, FaFileInvoice, FaChartLine, FaCashRegister, FaBoxOpen, FaTruck, FaUsers, FaCog } from "react-icons/fa";
import backgroundImage from '../../assets/pizza-background.jpg';

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
// ... (Las funciones 'isAdminUser' y 'fetchUserWithCargo' se mantienen exactamente igual)
const isAdminUser = (u) => {
  if (!u) return false;
  const idCargo = Number(u.id_cargo_emp ?? u.cargo_id ?? u.cargo?.id ?? u.cargo?.id_cargo_emp);
  const nombreCargo = String(u.cargo_nombre ?? u.cargo?.nombre ?? u.cargo?.carg_nombre ?? "").toLowerCase();
  return (
    u.is_superuser === true ||
    u.is_staff === true ||
    idCargo === 5 ||
    nombreCargo === "Administrador"
  );
};

// ✅ Obtiene el usuario + cargo sin asumir que username = emp_nombre
async function fetchUserWithCargo() {
  // 1) info básica del auth
  const { data: me } = await api.get("/api/auth/me/");
  let meFull = { ...me };

  // si ya viene el cargo, devolvémoslo
  if (
    meFull.id_cargo_emp != null ||
    meFull.cargo_nombre != null ||
    meFull.cargo?.id != null
  ) {
    return meFull;
  }

  const loginUser = (me?.username || "").trim();
  if (!loginUser) return meFull;

  // función que intenta mapear un registro de empleado al auth user
  const matchByLogin = (emp) => {
    const candidates = [
      emp?.username,                     // si el empleado tiene username propio
      emp?.user?.username,               // si está enlazado a un User de Django
      (emp?.emp_correo || "").split("@")[0], // local-part del correo
      emp?.emp_nombre,                   // por si lo usaste como username
    ]
      .filter(Boolean)
      .map((s) =>
        String(s)
          .trim()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
      );

    const normLogin = String(loginUser)
      .trim()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

    return candidates.includes(normLogin);
  };

  // helper para traer cargo al objeto meFull
  const pick = (emp) => ({
    ...meFull,
    id_cargo_emp:
      emp.id_cargo_emp ?? emp.cargo?.id ?? emp.cargo?.id_cargo_emp ?? null,
    cargo_nombre:
      emp.cargo_nombre ?? emp.cargo?.carg_nombre ?? emp.cargo?.nombre ?? null,
    cargo: emp.cargo ?? meFull.cargo ?? null,
  });

  // 2) /api/empleados/me/ (si existe)
  try {
    const { data } = await api.get("/api/empleados/me/");
    const emp = Array.isArray(data?.results) ? data.results[0] : data;
    if (emp && matchByLogin(emp)) return pick(emp);
  } catch (_) {}

  // 3) /api/empleados/?username=
  try {
    const { data } = await api.get(
      `/api/empleados/?username=${encodeURIComponent(loginUser)}`
    );
    const list = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
      ? data
      : [];
    const emp = list.find(matchByLogin);
    if (emp) return pick(emp);
  } catch (_) {}

  // 4) /api/empleados/?search=
  try {
    const { data } = await api.get(
      `/api/empleados/?search=${encodeURIComponent(loginUser)}`
    );
    const list = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
      ? data
      : [];
    const emp = list.find(matchByLogin);
    if (emp) return pick(emp);
  } catch (_) {}

  // 5) último recurso
  return meFull;
}


export default function DashboardLayout({ children, topRight = null }) {
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const full = await fetchUserWithCargo();
        setMe(full);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  const menuItems = useMemo(
    () => [
      { key: "home", label: "Inicio", path: "/", icon: <FaHome /> },
      { key: "pedidos", label: "Pedidos", path: "/pedidos", icon: <FaFileInvoice /> },
      { key: "ventas", label: "Ventas", path: "/ventas", icon: <FaChartLine /> },
      { key: "caja", label: "Caja", path: "/caja", icon: <FaCashRegister /> },
      { key: "inventario", label: "Inventario", path: "/inventario", icon: <FaBoxOpen /> },
      { key: "compras", label: "Compras", path: "/compras", icon: <FaTruck /> },
      { key: "platos", label: "Platos", path: "/platos", icon: <FaTruck /> },
      { key: "recetas", label: "Recetas", path: "/recetas", icon: <FaTruck /> },
      { key: "mesas", label: "Mesas", path: "/mesas", icon: <FaTruck /> },
      ...(isAdminUser(me)
        ? [
            { key: "empleados", label: "Empleados", path: "/empleados", icon: <FaUsers /> },
            { key: "proveedores", label: "Proveedores", path: "/proveedores", icon: <FaTruck /> },
            { key: "configuracion", label: "Configuracion", path: "/configuracion", icon: <FaCog /> },
          ]
        : []),
    ],
    [me]
  );

  return (
    <>
      <div className="layout-grid">
        <header className="layout-header">
          <div />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{topRight}</div>
        </header>

        <aside className="layout-sidebar">
          <div className="sidebar-brand">
            <img src={logo} alt="Logo Pizzería Rex" />
            <strong>Pizzería REX</strong>
          </div>
          <nav className="sidebar-nav">
            {menuItems.map((it) => (
              <NavLink
                key={it.key}
                to={it.path}
                className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
              >
                <span className="sidebar-icon">{it.icon}</span>
                <span>{it.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="layout-main">{children}</main>
      </div>

      <style>{`
        body {
          background-image: linear-gradient(rgba(18, 18, 18, 0.65), rgba(18, 18, 18, 0.65)), url(${backgroundImage});
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          grid-template-rows: 64px 1fr;
          min-height: 100vh;
        }

        .layout-header {
          grid-column: 2 / -1;
          background: transparent;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .layout-sidebar {
          grid-row: 1 / span 2;
          background: #2c2c2e;
          color: #eaeaea;
          border-right: 1px solid #3a3a3c;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px 24px 10px;
          font-size: 1.25rem;
          color: #fff;
        }

        .sidebar-brand img {
          height: 38px;
          width: auto;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          text-decoration: none;
          border-radius: 8px;
          color: #d1d5db;
          font-weight: 500;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        
        .sidebar-icon {
          font-size: 1.1rem;
        }

        .sidebar-link:hover {
          background-color: rgba(250, 204, 21, 0.1);
          color: #facc15;
        }

        .sidebar-link.active {
          background: #facc15;
          color: #111827;
          font-weight: 600;
        }

        .layout-main {
          grid-column: 2 / -1;
          /* 🔥 CORRECCIÓN: Se reduce el padding superior */
          padding: 18px 28px; 
          background: transparent;
          overflow-y: auto;
        }
      `}</style>
    </>
  );
}