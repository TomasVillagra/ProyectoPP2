import { NavLink, useNavigate } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { api } from "../../api/axios";
import logo from "../../assets/logo.png"; // ✅ import del logo

// Admin = cargo_empleados.id = 5
const isAdminUser = (u) => {
  if (!u) return false;

  const idCargo = Number(
    u.id_cargo_emp ??
    u.cargo_id ??
    u.cargo?.id ??
    u.cargo?.id_cargo_emp
  );

  const nombreCargo = String(
    u.cargo_nombre ?? u.cargo?.nombre ?? u.cargo?.carg_nombre ?? ""
  ).toLowerCase();

  return (
    u.is_superuser === true ||
    u.is_staff === true ||
    idCargo === 5 ||
    nombreCargo === "administrador"
  );
};

// Buscar coincidencia EXACTA por username vs emp_nombre
async function fetchUserWithCargo() {
  const { data: me } = await api.get("/api/auth/me/");
  let meFull = { ...me };

  if (
    meFull.id_cargo_emp != null ||
    meFull.cargo_nombre != null ||
    meFull.cargo?.id != null
  ) {
    return meFull;
  }

  const username = (me?.username || "").trim();
  if (!username) return meFull;

  const matchByUsername = (emp) => {
    const empName = (emp?.emp_nombre || "").trim().toLowerCase();
    return empName && empName === username.toLowerCase();
  };

  const pick = (emp) => ({
    ...meFull,
    id_cargo_emp: emp.id_cargo_emp,
    cargo_nombre: emp.cargo_nombre ?? emp.cargo?.carg_nombre,
    cargo: emp.cargo,
  });

  try {
    const { data } = await api.get("/api/empleados/me/");
    const emp = Array.isArray(data?.results) ? data.results[0] : data;
    if (emp && matchByUsername(emp)) return pick(emp);
  } catch {}

  try {
    const { data } = await api.get(`/api/empleados/?username=${encodeURIComponent(username)}`);
    const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    const emp = list.find(matchByUsername);
    if (emp) return pick(emp);
  } catch {}

  try {
    const { data } = await api.get(`/api/empleados/?search=${encodeURIComponent(username)}`);
    const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    const emp = list.find(matchByUsername);
    if (emp) return pick(emp);
  } catch {}

  return meFull;
}

export default function DashboardLayout({ children, topRight = null }) {
  const navigate = useNavigate();
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
      { key: "home", label: "Inicio", path: "/", icon: "🏠" },
      { key: "pedidos", label: "Pedidos", path: "/pedidos", icon: "🧾" },
      { key: "ventas", label: "Ventas", path: "/ventas", icon: "💹" },
      { key: "caja", label: "Caja", path: "/caja", icon: "💵" },
      { key: "inventario", label: "Inventario", path: "/inventario", icon: "📦" },
      { key: "proveedores", label: "Proveedores", path: "/proveedores", icon: "🏪" },
      ...(isAdminUser(me)
        ? [{ key: "empleados", label: "Empleados", path: "/empleados", icon: "👥" }]
        : []),
    ],
    [me]
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        gridTemplateRows: "64px 1fr",
        minHeight: "100vh",
        background: "#0e0e0e",
        color: "#fff",
      }}
    >
      <header
        style={{
          gridColumn: "1 / span 2",
          background: "#111",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #222",
        }}
      >
        {/* 🔥 Reemplazo del ícono por el logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={logo}
            alt="Logo Pizzería Rex"
            style={{ height: 36, width: "auto", borderRadius: 8 }}
          />
          <strong style={{ fontSize: 18 }}>Pizzería Rex</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {topRight}
        </div>
      </header>

      <aside
        style={{
          background: "#161616",
          color: "#eaeaea",
          borderRight: "1px solid #222",
          padding: "16px 10px",
        }}
      >
        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {menuItems.map((it) => (
            <NavLink
              key={it.key}
              to={it.path}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                textDecoration: "none",
                borderRadius: 10,
                border: "1px solid #222",
                color: isActive ? "#111" : "#eaeaea",
                background: isActive ? "#eaeaea" : "transparent",
                fontWeight: isActive ? 700 : 500,
              })}
            >
              <span aria-hidden>{it.icon}</span>
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main style={{ padding: 28, background: "#0e0e0e" }}>{children}</main>
    </div>
  );
}

const subItemStyle = {
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  background: "transparent",
  border: "1px dashed #2a2a2a",
  color: "#eaeaea",
  borderRadius: 8,
  cursor: "pointer",
  marginBottom: 6,
};
