import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalizeList(respData) {
  if (Array.isArray(respData)) return respData;
  if (respData?.results && Array.isArray(respData.results)) return respData.results;
  if (respData?.data && Array.isArray(respData.data)) return respData.data;
  return [];
}

export default function RecetasList() {
  const [data, setData] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecetas = async () => {
    try {
      const { data } = await api.get("/api/recetas/");
      setData(normalizeList(data));
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cargar recetas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecetas(); }, []);

  // ── REGLA 2: no se puede desactivar receta si su plato está en algún pedido
  const platoEstaEnPedidos = async (idPlato) => {
    // Intento 1: endpoints comunes de detalle de pedidos
    const tryEndpoints = [
      "/api/pedido-detalles/",
      "/api/detalle-pedidos/",
      "/api/detalles-pedido/",
      "/api/pedidos-detalle/",
    ];
    for (const ep of tryEndpoints) {
      try {
        const { data } = await api.get(ep, { params: { id_plato: Number(idPlato), page_size: 1 } });
        const list = normalizeList(data);
        if (Array.isArray(list) && list.length > 0) return true;
      } catch { /* sigue intentando */ }
    }
    // Intento 2 (fallback): traer pedidos y, si la API trae items embebidos, revisar allí
    try {
      const { data } = await api.get("/api/pedidos/", { params: { page_size: 1000 } });
      const pedidos = normalizeList(data);
      for (const p of pedidos) {
        const items = p.detalles || p.items || p.lineas || [];
        if (Array.isArray(items) && items.some(it => Number(it.id_plato ?? it.plato) === Number(idPlato))) {
          return true;
        }
      }
    } catch {/* noop */}
    return false;
    };

  const toggleEstado = async (rec) => {
    try {
      const nextEstado = (rec.id_estado_receta === 1 ? 2 : 1);

      // Si vamos a desactivar (2), chequear si el plato está en pedidos
      if (nextEstado === 2) {
        const idPlato = rec.id_plato ?? rec?.plato?.id_plato ?? rec?.plato;
        if (idPlato && await platoEstaEnPedidos(idPlato)) {
          alert("No se puede desactivar la receta: su plato aparece en uno o más pedidos.");
          return;
        }
      }

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

