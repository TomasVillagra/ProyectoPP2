import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function ProveedoresList() {
  const [rows, setRows] = useState([]);

  useEffect(() => { cargar(); }, []);

  const cargar = () => {
    api.get("/api/proveedores/").then((res) => {
      setRows(Array.isArray(res.data?.results) ? res.data.results : res.data);
    });
  };

  const desactivar = async (prov) => {
    if (!window.confirm(`¿Desactivar al proveedor "${prov.prov_nombre}"?`)) return;
    try {
      await api.put(`/api/proveedores/${prov.id_proveedor}/`, {
        ...prov,
        id_estado_prov: 2, // 👈 Inactivo
      });
      alert("Proveedor desactivado.");
      cargar();
    } catch (e) {
      console.error(e);
      alert("No se pudo desactivar.");
    }
  };

  const activar = async (prov) => {
    if (!window.confirm(`¿Activar al proveedor "${prov.prov_nombre}"?`)) return;
    try {
      await api.put(`/api/proveedores/${prov.id_proveedor}/`, {
        ...prov,
        id_estado_prov: 1, // 👈 Activo
      });
      alert("Proveedor activado.");
      cargar();
    } catch (e) {
      console.error(e);
      alert("No se pudo activar.");
    }
  };

  const estadoChip = (id, nombre) => {
    const label = nombre ?? (id === 1 ? "Activo" : id === 2 ? "Inactivo" : "-");
    const isActive = (nombre ?? "") === "Activo" || id === 1;
    return (
      <span style={{
        display:"inline-block",padding:"4px 10px",borderRadius:999,fontSize:12,fontWeight:700,letterSpacing:".3px",
        background: isActive ? "rgba(34,197,94,.15)" : "rgba(244,63,94,.15)",
        color: isActive ? "#34d399" : "#f87171",
        border: `1px solid ${isActive ? "rgba(34,197,94,.35)" : "rgba(244,63,94,.35)"}`
      }}>
        {label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h2 style={{ margin:0, color:"#fff" }}>Proveedores</h2>
        <Link to="/proveedores/registrar">
          <button style={{
            background:"#2563eb", color:"#fff", border:"1px solid #2563eb",
            padding:"10px 14px", borderRadius:10, cursor:"pointer", fontWeight:700
          }}>
            ➕ Registrar proveedor
          </button>
        </Link>
      </div>

      <div style={{ overflowX:"auto", background:"#111", border:"1px solid #222", borderRadius:12 }}>
        <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:0 }}>
          <thead style={{ position:"sticky", top:0, zIndex:1 }}>
            <tr style={{ background:"#151515" }}>
              {["ID","Nombre","Teléfono","Correo","Dirección","Estado","Acciones"].map(h=>(
                <th key={h} style={{
                  textAlign:"left", padding:"12px 14px", color:"#d6d6d6",
                  fontWeight:700, borderBottom:"1px solid #222", fontSize:13, letterSpacing:".25px"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx)=>(
              <tr key={r.id_proveedor} style={{ background: idx%2===0 ? "#0f0f0f" : "#101010" }}>
                <td style={td}>{r.id_proveedor}</td>
                <td style={td}>{r.prov_nombre}</td>
                <td style={td}>{r.prov_tel || "-"}</td>
                <td style={td}>{r.prov_correo || "-"}</td>
                <td style={td}>{r.prov_direccion || "-"}</td>
                <td style={td}>{estadoChip(r.id_estado_prov, r.estado_nombre)}</td>
                <td style={{ ...td, display:"flex", gap:8 }}>
                  <Link to={`/proveedores/editar/${r.id_proveedor}`}>
                    <button style={btnEdit}>✏️ Editar</button>
                  </Link>
                  <button
                    style={r.id_estado_prov === 1 ? btnDesactivar : btnActivar}
                    onClick={() => r.id_estado_prov === 1 ? desactivar(r) : activar(r)}
                  >
                    {r.id_estado_prov === 1 ? "🔒 Desactivar" : "🔓 Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign:"center", color:"#aaa", padding:24 }}>
                  No hay proveedores cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

const td = { padding:"12px 14px", color:"#eaeaea", borderBottom:"1px solid #1c1c1c", fontSize:14 };
const btnEdit = {
  background:"transparent", border:"1px solid #2a2a2a", color:"#eaeaea",
  padding:"8px 10px", borderRadius:8, cursor:"pointer",
};
const btnDesactivar = {
  background:"rgba(244,63,94,.1)", border:"1px solid rgba(244,63,94,.35)",
  color:"#f87171", padding:"8px 10px", borderRadius:8, cursor:"pointer",
};
const btnActivar = {
  background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.35)",
  color:"#34d399", padding:"8px 10px", borderRadius:8, cursor:"pointer",
};
