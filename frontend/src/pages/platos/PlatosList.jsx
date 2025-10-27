import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalizeResponse(respData) {
  if (Array.isArray(respData)) return respData;
  if (respData?.results && Array.isArray(respData.results)) return respData.results;
  if (respData?.data && Array.isArray(respData.data)) return respData.data;
  if (respData && typeof respData === "object") return [respData];
  return [];
}

export default function PlatosList() {
  const [data, setData] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // ---- CATEGORÍAS: traigo todas para poder mapear id -> nombre
  const fetchCategorias = async () => {
    try {
      const res = await api.get("/api/categorias-platos/");
      const list = normalizeResponse(res.data);
      setCategorias(list);
    } catch (e) {
      console.error("No se pudo cargar categorías", e);
    }
  };

  // Mapa id -> nombre (tolera distintos nombres de campos en tu back)
  const catMap = useMemo(() => {
    const map = {};
    categorias.forEach((c) => {
      const id = c.id_categoria_plato ?? c.id_categoria ?? c.id ?? c.categoria_id;
      const nombre = c.categoria_nombre ?? c.cat_nombre ?? c.nombre ?? (id != null ? `#${id}` : "-");
      if (id != null) map[id] = nombre;
    });
    return map;
  }, [categorias]);

  const fetchPlatos = async () => {
    try {
      const res = await api.get("/api/platos/");
      const list = normalizeResponse(res.data) || [];
      setData(list);
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cargar platos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // cargo categorías y platos en paralelo
    Promise.all([fetchCategorias(), fetchPlatos()]).catch(() => {});
  }, []);

  const toggleEstado = async (plato) => {
    try {
      const id = plato.id_plato ?? plato.id; // fallback por si tu API usa 'id'
      const idEstadoActual = String(plato.id_estado_plato ?? plato.id_estado ?? plato.estado ?? "1");
      const nextEstado = idEstadoActual === "1" ? 2 : 1;
      await api.patch(`/api/platos/${id}/`, { id_estado_plato: nextEstado });
      await fetchPlatos();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cambiar el estado.");
    }
  };

  return (
    <DashboardLayout>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{margin:0,color:"#fff"}}>Platos</h2>
        <Link to="/platos/registrar" className="btn btn-primary">Registrar plato</Link>
      </div>

      {msg && <p style={{color:"#facc15"}}>{msg}</p>}
      {loading ? <p>Cargando...</p> : (
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th style={{width:260}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan="7" style={{textAlign:"center"}}>Sin registros</td></tr>
              )}
              {data.map((r, idx) => {
                const id = r.id_plato ?? r.id ?? idx;
                const nombre = r.pla_nombre ?? r.plt_nombre ?? r.nombre ?? "(sin nombre)";
                const precio = r.pla_precio ?? r.plt_precio ?? r.precio ?? 0;

                // —— STOCK (distintos nombres posibles)
                const stock =
                  r.pla_stock ?? r.plt_stock ?? r.stock ?? r.stock_actual ?? "-";

                // —— CATEGORÍA
                // 1) Si viene el nombre directo
                let categoriaNombre =
                  r.categoria_nombre ?? r.cat_nombre ?? null;

                // 2) Si viene un objeto embebido { categoria: { id, nombre } }
                if (!categoriaNombre && r.categoria && typeof r.categoria === "object") {
                  categoriaNombre = r.categoria.nombre ?? r.categoria.cat_nombre ?? r.categoria.categoria_nombre ?? null;
                }

                // 3) Si NO hay nombre, intento con el id + lookup en catMap
                const categoriaId =
                  r.id_categoria_plato ?? r.id_categoria ?? r.categoria_id ??
                  (r.categoria && typeof r.categoria === "object" ? (r.categoria.id ?? r.categoria.id_categoria) : null);

                const categoria =
                  categoriaNombre ?? (categoriaId != null ? (catMap[categoriaId] || `#${categoriaId}`) : "-");

                const idEstado = String(r.id_estado_plato ?? r.id_estado ?? r.estado ?? "1");
                const estadoNombre = r.estado_nombre || (idEstado === "1" ? "Activo" : "Inactivo");

                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{nombre}</td>
                    <td>{Number(precio).toFixed(2)}</td>
                    <td>{stock}</td>
                    <td>{categoria}</td>
                    <td>{estadoNombre}</td>
                    <td style={{display:"flex",gap:8, flexWrap:"wrap"}}>
                      <Link to={`/platos/${id}/editar`} className="btn btn-secondary">Editar</Link>
                      <button onClick={() => toggleEstado(r)} className="btn btn-danger">
                        {idEstado === "1" ? "Desactivar" : "Activar"}
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

