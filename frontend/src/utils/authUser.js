// src/utils/authUser.js
import { api } from "../api/axios";

// Admin si el cargo se llama "administrador" o si viene flageado desde backend (si alguna vez lo agregás)
export const isAdminUser = (u) => {
  if (!u) return false;
  const nombreCargo = String(u.cargo_nombre || "").toLowerCase();
  const idCargo = Number(u.id_cargo_emp ?? 0);
  return nombreCargo === "administrador" || idCargo === 5 || u.is_superuser === true || u.is_staff === true;
};

// Obtiene todo de /api/empleados/me/ para no hacer múltiples GET
export async function fetchUserWithCargo() {
  // 1 sola llamada
  const { data: emp } = await api.get("/api/empleados/me/");

  // Normalizo campos que usa el header
  return {
    // visible en el saludo
    username: emp.emp_nombre || emp.emp_apellido || emp.emp_correo || "Usuario",

    // info de cargo para el badge y permisos
    id_cargo_emp: emp.id_cargo_emp,
    cargo_nombre: emp.cargo_nombre ?? null,

    // por si querés chequear flags en el futuro
    is_staff: emp.is_staff ?? false,
    is_superuser: emp.is_superuser ?? false,

    // Dejo el resto por si algo más lo usa
    ...emp,
  };
}

