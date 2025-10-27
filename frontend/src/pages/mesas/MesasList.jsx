import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalize(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp?.results) return resp.results;
  if (resp?.data) return resp.data;
  return [];
}

export default function MesasList() {
  const [data, setData] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const fetchEstados = async () => {
    try {
      const { data } = await api.get("/api/estados-mesa/");
      setEstados(normalize(data));
    } catch (e) { /* noop */ }
  };

  const fetchMesas = async () => {
    try {
      const { data } = await api.get("/api/mesas/");
      setData(normalize(data));
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cargar mesas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchEstados(), fetchMesas()]).catch(() => {});
  }, []);

  const estIdByName = (nombre) => {
    const n = String(nombre || "").toLowerCase();
    return estados.find(e => String(e.estms_nombre).toLowerCase() === n)?.id_estado_mesa;
  };

  const toggleEstado = async (mesa) => {
    try {
      const currentName =
        mesa.estado_mesa_nombre ??
        mesa?.id_estado_mesa?.estms_nombre ??
        "";
      const isDisponible = String(currentName).toLowerCase() === "disponible";
      const next = isDisponible ? "Ocupada" : "Disponible";
      const nextId = estIdByName(next);
      if (!nextId) {
        alert("No encuentro el catálogo de estados. Creá Disponible/Ocupada/Inactiva.");
        return;
      }
      const id = mesa.id_mesa ?? mesa.id;
      await api.patch(`/api/mesas/${id}/`, { id_estado_mesa: nextId });
      await fetchMesas();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cambiar el estado.");
    }
  };

  const estNombre = (r) =>
    r.estado_mesa_nombre ?? r?.id_estado_mesa?.estms_nombre ?? "-";

  const sorted = useMemo(
    () => [...data].sort((a, b) => (a.ms_numero ?? 0) - (b.ms_numero ?? 0)),
    [data]
  );

  return (
    <DashboardLayout>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{margin:0,color:"#fff"}}>Mesas</h2>
        <Link to="/mesas/registrar" className="btn btn-primary">Registrar mesa</Link>
      </div>

      {msg && <p style={{color:"#facc15"}}>{msg}</p>}
      {loading ? <p>Cargando...</p> : (
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>ID</th>
                <th>Número</th>
                <th>Estado</th>
                <th style={{width:260}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan="4" style={{textAlign:"center"}}>Sin registros</td></tr>
              )}
              {sorted.map((r, idx) => {
                const id = r.id_mesa ?? r.id ?? idx;
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{r.ms_numero ?? "-"}</td>
                    <td>{estNombre(r)}</td>
                    <td style={{display:"flex",gap:8, flexWrap:"wrap"}}>
                      <Link to={`/mesas/${id}/editar`} className="btn btn-secondary">Editar</Link>
                      <button onClick={() => toggleEstado(r)} className="btn btn-danger">
                        {String(estNombre(r)).toLowerCase() === "disponible" ? "Marcar ocupada" : "Marcar disponible"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.table-wrap { overflow:auto; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
.btn-danger { background:#ef4444; color:#fff; border-color:#ef4444; }
`;

