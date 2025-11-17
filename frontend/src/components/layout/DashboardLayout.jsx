// src/components/layout/DashboardLayout.jsx
import { NavLink } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { api } from "../../api/axios";
import logo from "../../assets/logo.png";
import {
  FaHome, FaFileInvoice, FaChartLine, FaCashRegister, FaBoxOpen, FaTruck,
  FaUsers, FaCog, FaUserFriends, FaListUl, FaBoxes, FaLink, FaReceipt, FaClipboardList
} from "react-icons/fa";

import backgroundImage from '../../assets/pizza-background.jpg';

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// ─────────────────────────────────────────────────────────
// Misma lógica de admin + fetch de “me” que venías usando
// ─────────────────────────────────────────────────────────
const isAdminUser = (u) => {
  if (!u) return false;
  const nombreCargo = norm(u.cargo_nombre);
  const idCargo = Number(u.id_cargo_emp ?? 0);
  return nombreCargo === "administrador" || idCargo === 5 || u.is_superuser === true || u.is_staff === true;
};

async function fetchUserWithCargo() {
  // Simplificado a /api/empleados/me/
  const { data: emp } = await api.get("/api/empleados/me/");
  return {
    username: emp.emp_nombre || emp.emp_apellido || emp.emp_correo || "Usuario",
    id_cargo_emp: emp.id_cargo_emp,
    cargo_nombre: emp.cargo_nombre ?? null,
    is_staff: emp.is_staff ?? false,
    is_superuser: emp.is_superuser ?? false,
    ...emp,
  };
}

// ─────────────────────────────────────────────────────────
// ConfirmDialog (mismo contrato de props que usás en Home)
// ─────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 420,
          background: "#1f2937",
          color: "#e5e7eb",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,.5)",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", fontSize: 18, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: "0 0 18px 0", lineHeight: 1.4 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,.2)",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: "#facc15",
              border: "1px solid #facc15",
              color: "#111827",
              padding: "8px 12px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children, topRight = null }) {
  const [me, setMe] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const doLogout = async () => {
    try {
      await api.post("/api/auth/logout/");
    } catch {}
    window.location.href = "/login";
  };

  const menuItems = useMemo(
  () => [
    { key: "home", label: "Inicio", path: "/", icon: <FaHome /> },

    // Operación diaria
    { key: "pedidos", label: "Pedidos", path: "/pedidos", icon: <FaFileInvoice /> },
    { key: "ventas", label: "Ventas", path: "/ventas", icon: <FaChartLine /> },
    { key: "caja", label: "Caja", path: "/caja", icon: <FaCashRegister /> },
    { key: "caja-historial", label: "Historial de caja", path: "/caja/historial", icon: <FaCashRegister /> },
    { key: "movimientos", label: "Movivimientos", path: "/caja/movimientos", icon: <FaReceipt /> },
    { key: "cobros", label: "Cobros / Facturas", path: "/cobros", icon: <FaFileInvoice /> },
    

    // Stock / compras
    { key: "inventario", label: "Inventario", path: "/inventario", icon: <FaBoxOpen /> },
    { key: "compras", label: "Compras", path: "/compras", icon: <FaTruck /> },

    // Cocina
    { key: "platos", label: "Platos", path: "/platos", icon: <FaClipboardList /> },
    { key: "recetas", label: "Recetas", path: "/recetas", icon: <FaListUl /> },
    { key: "mesas", label: "Mesas", path: "/mesas", icon: <FaBoxes /> },

    // Extras frecuentes (si ya tenés rutas)
   

    // Solo admin
    ...(isAdminUser(me)
      ? [
          

          { key: "empleados", label: "Empleados", path: "/empleados", icon: <FaUsers /> },
          { key: "proveedores", label: "Proveedores", path: "/proveedores", icon: <FaTruck /> },
          { key: "configuracion", label: "Configuración", path: "/configuracion", icon: <FaCog /> },
        ]
      : []),
  ],
  [me]
);


  const cargoNombre =
    me?.cargo_nombre ??
    (isAdminUser(me) ? "Administrador" : null);

  // Estilo del botón igual que el Home (outline claro)
  const btnOutline = {
    background: "transparent",
    border: "1px solid rgba(255,255,255,.2)",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
  };

  return (
    <>
      <div className="layout-grid">
        <header className="layout-header">
          <div />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* 👇 NUEVO: saludo + nombre de usuario */}
            {me && (
              <span style={{ opacity: 0.9 }}>
                Hola, <strong>{me.username ?? me.emp_nombre ?? "Usuario"}</strong>
              </span>
            )}

            {/* Badge de cargo (Administrador u otro) */}
            {cargoNombre && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: isAdminUser(me) ? "#facc15" : "#374151",
                  color: isAdminUser(me) ? "#111827" : "#e5e7eb",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 0.3,
                  textTransform: "capitalize",
                }}
                title="Cargo"
              >
                {cargoNombre}
              </span>
            )}

            {/* Botón Cerrar Sesión con ConfirmDialog (igual que Home) */}
            <button onClick={() => setShowConfirm(true)} style={btnOutline}>
              Cerrar sesión
            </button>

            {/* Si alguna página aún pasa algo en topRight, lo seguimos mostrando */}
            {topRight}
          </div>
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

      <ConfirmDialog
        open={showConfirm}
        title="Confirmar cierre de sesión"
        message="¿Estás seguro que quieres cerrar sesión?"
        onCancel={() => setShowConfirm(false)}
        onConfirm={doLogout}
      />

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
          border-bottom: 1px solid rgba(255,255,255,0.1);
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
          transition: background-color .2s ease, color .2s ease;
        }

        .sidebar-icon {
          font-size: 1.1rem;
        }

        .sidebar-link:hover {
          background-color: rgba(250,204,21,0.1);
          color: #facc15;
        }

        .sidebar-link.active {
          background: #facc15;
          color: #111827;
          font-weight: 600;
        }

        .layout-main {
          grid-column: 2 / -1;
          padding: 18px 28px;
          background: transparent;
          overflow-y: auto;
        }
      `}</style>
    </>
  );
}




