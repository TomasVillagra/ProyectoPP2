import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function EmpleadosList() {
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = () => {
    api.get("/api/empleados/").then((res) => {
      setEmpleados(Array.isArray(res.data?.results) ? res.data.results : res.data);
    });
  };

  const desactivarEmpleado = async (empleado) => {
    if (!window.confirm(`¿Seguro que querés desactivar a ${empleado.emp_nombre} ${empleado.emp_apellido}?`)) return;
    try {
      await api.put(`/api/empleados/${empleado.id_empleado}/`, {
        ...empleado,
        id_estado_empleado: 2, // 2 = Inactivo
      });
      alert("Empleado desactivado correctamente.");
      cargarEmpleados();
    } catch (err) {
      console.error(err);
      alert("Error al desactivar el empleado.");
    }
  };

  const activarEmpleado = async (empleado) => {
    if (!window.confirm(`¿Seguro que querés activar a ${empleado.emp_nombre} ${empleado.emp_apellido}?`)) return;
    try {
      await api.put(`/api/empleados/${empleado.id_empleado}/`, {
        ...empleado,
        id_estado_empleado: 1, // 1 = Activo
      });
      alert("Empleado activado correctamente.");
      cargarEmpleados();
    } catch (err) {
      console.error(err);
      alert("Error al activar el empleado.");
    }
  };

  const estadoChip = (id, nombre) => {
    const label = nombre ?? (id === 1 ? "Activo" : id === 2 ? "Inactivo" : "-");
    const isActive = (nombre ?? "") === "Activo" || id === 1;
    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: ".3px",
          background: isActive ? "rgba(34,197,94,.15)" : "rgba(244,63,94,.15)",
          color: isActive ? "#34d399" : "#f87171",
          border: `1px solid ${isActive ? "rgba(34,197,94,.35)" : "rgba(244,63,94,.35)"}`,
        }}
      >
        {label}
      </span>
    );
  };

  const cargoPill = (nombre, id) => (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        letterSpacing: ".2px",
        background: "rgba(59,130,246,.12)",
        color: "#93c5fd",
        border: "1px solid rgba(59,130,246,.35)",
        fontWeight: 700,
      }}
      title={id ? `ID cargo: ${id}` : undefined}
    >
      {nombre ?? id ?? "-"}
    </span>
  );

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: "#fff" }}>Empleados</h2>
        <Link to="/empleados/registrar">
          <button
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "1px solid #2563eb",
              padding: "10px 14px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ➕ Registrar empleado
          </button>
        </Link>
      </div>

      <div style={{ overflowX: "auto", background: "#111", border: "1px solid #222", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr style={{ background: "#151515" }}>
              {["ID", "Nombre", "Apellido", "Cargo", "Estado", "Acciones"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    color: "#d6d6d6",
                    fontWeight: 700,
                    borderBottom: "1px solid #222",
                    fontSize: 13,
                    letterSpacing: ".25px",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empleados.map((e, idx) => (
              <tr key={e.id_empleado} style={{ background: idx % 2 === 0 ? "#0f0f0f" : "#101010" }}>
                <td style={td}>{e.id_empleado}</td>
                <td style={td}>{e.emp_nombre}</td>
                <td style={td}>{e.emp_apellido}</td>
                <td style={td}>{cargoPill(e.cargo_nombre, e.id_cargo_emp)}</td>
                <td style={td}>{estadoChip(e.id_estado_empleado, e.estado_nombre)}</td>
                <td style={{ ...td, display: "flex", gap: 8 }}>
                  <Link to={`/empleados/editar/${e.id_empleado}`}>
                    <button style={btnEdit} title="Editar">
                      ✏️ Editar
                    </button>
                  </Link>

                  <button
                    style={e.id_estado_empleado === 1 ? btnDesactivar : btnActivar}
                    title={e.id_estado_empleado === 1 ? "Desactivar" : "Activar"}
                    onClick={() =>
                      e.id_estado_empleado === 1
                        ? desactivarEmpleado(e)
                        : activarEmpleado(e)
                    }
                  >
                    {e.id_estado_empleado === 1 ? "🔒 Desactivar" : "🔓 Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {empleados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: "center", color: "#aaa", padding: 24 }}>
                  No hay empleados cargados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

const td = {
  padding: "12px 14px",
  color: "#eaeaea",
  borderBottom: "1px solid #1c1c1c",
  fontSize: 14,
};

const btnEdit = {
  background: "transparent",
  border: "1px solid #2a2a2a",
  color: "#eaeaea",
  padding: "8px 10px",
  borderRadius: 8,
  cursor: "pointer",
};

const btnDesactivar = {
  background: "rgba(244,63,94,.1)",
  border: "1px solid rgba(244,63,94,.35)",
  color: "#f87171",
  padding: "8px 10px",
  borderRadius: 8,
  cursor: "pointer",
};

const btnActivar = {
  background: "rgba(34,197,94,.1)",
  border: "1px solid rgba(34,197,94,.35)",
  color: "#34d399",
  padding: "8px 10px",
  borderRadius: 8,
  cursor: "pointer",
};
