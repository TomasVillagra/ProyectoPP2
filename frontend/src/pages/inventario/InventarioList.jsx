import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function InventarioList() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    cargarInsumos();
  }, []);

  const cargarInsumos = () => {
    api.get("/api/insumos/").then((res) => {
      setRows(Array.isArray(res.data?.results) ? res.data.results : res.data);
    });
  };

  const desactivarInsumo = async (insumo) => {
    if (!window.confirm(`¿Seguro que querés desactivar el insumo "${insumo.ins_nombre}"?`)) return;
    try {
      await api.put(`/api/insumos/${insumo.id_insumo}/`, {
        ...insumo,
        id_estado_insumo: 2, // 2 = Inactivo
      });
      alert("Insumo desactivado correctamente.");
      cargarInsumos();
    } catch (err) {
      console.error(err);
      alert("Error al desactivar el insumo.");
    }
  };

  const activarInsumo = async (insumo) => {
    if (!window.confirm(`¿Seguro que querés activar el insumo "${insumo.ins_nombre}"?`)) return;
    try {
      await api.put(`/api/insumos/${insumo.id_insumo}/`, {
        ...insumo,
        id_estado_insumo: 1, // 1 = Activo
      });
      alert("Insumo activado correctamente.");
      cargarInsumos();
    } catch (err) {
      console.error(err);
      alert("Error al activar el insumo.");
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "-";
    return Number(num).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const estadoChip = (estadoId, nombre) => {
    const label = nombre ?? (estadoId === 1 ? "Activo" : estadoId === 2 ? "Inactivo" : "-");
    const isActive = (nombre ?? "") === "Activo" || estadoId === 1;
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

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: "#fff" }}>Inventario (Insumos)</h2>
        <Link to="/inventario/registrar">
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
            ➕ Registrar insumo
          </button>
        </Link>
      </div>

      <div style={{ overflowX: "auto", background: "#111", border: "1px solid #222", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr style={{ background: "#151515" }}>
              {["ID","Nombre","Unidad","Stock actual","Pto. reposición","Stock min","Stock max","Estado","Acciones"].map((h) => (
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
            {rows.map((r, idx) => (
              <tr
                key={r.id_insumo}
                style={{
                  background: idx % 2 === 0 ? "#0f0f0f" : "#101010",
                }}
              >
                <td style={td}>{r.id_insumo}</td>
                <td style={td}>{r.ins_nombre}</td>
                <td style={td}>{r.ins_unidad}</td>
                <td style={td}>{formatNumber(r.ins_stock_actual)}</td>
                <td style={td}>{formatNumber(r.ins_punto_reposicion)}</td>
                <td style={td}>{formatNumber(r.ins_stock_min)}</td>
                <td style={td}>{formatNumber(r.ins_stock_max)}</td>
                <td style={td}>{estadoChip(r.id_estado_insumo, r.estado_nombre)}</td>
                <td style={{ ...td, display: "flex", gap: 8 }}>
                  <Link to={`/inventario/editar/${r.id_insumo}`}>
                    <button
                      style={btnEdit}
                      title="Editar"
                    >
                      ✏️ Editar
                    </button>
                  </Link>

                  <button
                    style={r.id_estado_insumo === 1 ? btnDesactivar : btnActivar}
                    title={r.id_estado_insumo === 1 ? "Desactivar" : "Activar"}
                    onClick={() =>
                      r.id_estado_insumo === 1
                        ? desactivarInsumo(r)
                        : activarInsumo(r)
                    }
                  >
                    {r.id_estado_insumo === 1 ? "🔒 Desactivar" : "🔓 Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...td, textAlign: "center", color: "#aaa", padding: 24 }}>
                  No hay insumos cargados todavía.
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
