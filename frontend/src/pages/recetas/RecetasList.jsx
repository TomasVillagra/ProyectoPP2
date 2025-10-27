import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function RecetasList() {
  const [data, setData] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecetas = async () => {
    try {
      const { data } = await api.get("/api/recetas/");
      setData(data || []);
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cargar recetas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecetas(); }, []);

  const toggleEstado = async (rec) => {
    try {
      const nextEstado = (rec.id_estado_receta === 1 ? 2 : 1);
      await api.patch(`/api/recetas/${rec.id_receta}/`, { id_estado_receta: nextEstado });
      await fetchRecetas();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cambiar el estado.");
    }
  };

  return (
    <DashboardLayout>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{margin:0,color:"#fff"}}>Recetas</h2>
        <Link to="/recetas/registrar" className="btn btn-primary">Registrar receta</Link>
      </div>

      {msg && <p style={{color:"#facc15"}}>{msg}</p>}
      {loading ? <p>Cargando...</p> : (
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Plato</th>
                <th>Estado</th>
                <th style={{width:220}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan="5" style={{textAlign:"center"}}>Sin registros</td></tr>
              )}
              {data.map((r) => {
                const nombre = r.rec_nombre ?? r.plato_nombre ?? "(sin nombre)";
                const plato = r.plato_nombre ?? r.id_plato;
                const estado = r.estado_nombre ?? ((r.id_estado_receta === 1) ? "Activo" : "Inactivo");
                return (
                  <tr key={r.id_receta}>
                    <td>{r.id_receta}</td>
                    <td>{nombre}</td>
                    <td>{plato}</td>
                    <td>{estado}</td>
                    <td style={{display:"flex",gap:8}}>
                      <Link to={`/recetas/${r.id_receta}/editar`} className="btn btn-secondary">Editar</Link>
                      <button onClick={() => toggleEstado(r)} className="btn btn-danger">
                        {r.id_estado_receta === 1 ? "Desactivar" : "Activar"}
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
