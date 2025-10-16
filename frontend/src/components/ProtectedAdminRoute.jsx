import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/axios";

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

// 🔧 Buscar coincidencia EXACTA por username vs emp_nombre (sin fallback a list[0])
async function fetchUserWithCargo() {
  // 1) /api/auth/me/
  const { data: me } = await api.get("/api/auth/me/");
  let meFull = { ...me };

  // Si ya trae cargo, listo
  if (
    meFull.id_cargo_emp != null ||
    meFull.cargo_nombre != null ||
    meFull.cargo?.id != null
  ) {
    return meFull;
  }

  const username = (me?.username || "").trim();
  if (!username) return meFull;

  // match: username (auth/me) === emp_nombre (empleados)
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

  // 2) /api/empleados/me/ (si existe)
  try {
    const { data } = await api.get("/api/empleados/me/");
    const emp = Array.isArray(data?.results) ? data.results[0] : data;
    if (emp && matchByUsername(emp)) return pick(emp);
  } catch {}

  // 3) /api/empleados/?username=...
  try {
    const { data } = await api.get(`/api/empleados/?username=${encodeURIComponent(username)}`);
    const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    const emp = list.find(matchByUsername);
    if (emp) return pick(emp);
  } catch {}

  // 4) /api/empleados/?search=...
  try {
    const { data } = await api.get(`/api/empleados/?search=${encodeURIComponent(username)}`);
    const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    const emp = list.find(matchByUsername);
    if (emp) return pick(emp);
  } catch {}

  // Si no hubo match exacto, devolvemos me tal cual (sin cargo)
  return meFull;
}

export default function ProtectedAdminRoute({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const full = await fetchUserWithCargo();
        setMe(full);
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null; // spinner opcional
  if (!me || !isAdminUser(me)) return <Navigate to="/" replace />;

  return children;
}
