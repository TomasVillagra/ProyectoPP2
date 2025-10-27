import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function ProveedorInsumos() {
  const { id } = useParams();                 // id_proveedor
  const navigate = useNavigate();

  const [prov, setProv] = useState(null);
  const [insumosAll, setInsumosAll] = useState([]);
  const [relaciones, setRelaciones] = useState([]); // proveedor x insumo
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [selInsumo, setSelInsumo] = useState("");

  const norm = (d) => (Array.isArray(d?.results) ? d.results : (Array.isArray(d) ? d : d?.data || []));

  // Mapa id_insumo -> insumo
  const insumoById = useMemo(() => {
    const m = new Map();
    (insumosAll || []).forEach(i => m.set(Number(i.id_insumo), i));
    return m;
  }, [insumosAll]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [provRes, relRes, insRes] = await Promise.all([
          api.get(`/api/proveedores/${id}/`),
          api.get(`/api/proveedores-insumos/?id_proveedor=${id}`), // ← endpoint del join
          api.get(`/api/insumos/`),
        ]);
        setProv(provRes.data || null);
        setRelaciones(norm(relRes));
        setInsumosAll(norm(insRes));
      } catch (e) {
        console.error(e);
        setMsg("No se pudo cargar la información del proveedor.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const vinculadosIds = new Set((relaciones || []).map(r => Number(r.id_insumo)));
  const insumosDisponibles = (insumosAll || []).filter(i => !vinculadosIds.has(Number(i.id_insumo)));

  const handleVincular = async () => {
    setMsg("");
    if (!selInsumo) {
      setMsg("Elegí un insumo para vincular.");
      return;
    }
    try {
      await api.post("/api/proveedores-insumos/", {
        id_proveedor: Number(id),
        id_insumo: Number(selInsumo),
      });
      // recargar relaciones
      const relRes = await api.get(`/api/proveedores-insumos/?id_proveedor=${id}`);
      setRelaciones(norm(relRes));
      setSelInsumo("");
      setMsg("Insumo vinculado correctamente ✅");
    } catch (e) {
      console.error(e);
      setMsg("No se pudo vincular el insumo.");
    }
  };

  const handleQuitar = async (rel) => {
    setMsg("");
    try {
      // soporta id_relación con distintos nombres
      const pk = rel.id_proveedor_insumo || rel.id || rel.pk;
      await api.delete(`/api/proveedores-insumos/${pk}/`);
      const relRes = await api.get(`/api/proveedores-insumos/?id_proveedor=${id}`);
      setRelaciones(norm(relRes));
    } catch (e) {
      console.error(e);
      setMsg("No se pudo quitar el insumo del proveedor.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p>Cargando…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h2>Insumos del Proveedor #{id}</h2>
          <p className="sub">{prov?.prov_nombre ?? "-"}</p>
        </div>
        <div className="header-actions">
          <Link to="/proveedores" className="btn btn-secondary">Volver</Link>
        </div>
      </div>

      {msg && <p className="notice">{msg}</p>}

      {/* Vincular existente */}
      <div className="card">
        <h3 style={{marginTop:0}}>Vincular insumo existente</h3>
        <div className="row">
          <select value={selInsumo} onChange={(e)=>setSelInsumo(e.target.value)}>
            <option value="">-- Seleccioná un insumo --</option>
            {insumosDisponibles.map(i => (
              <option key={i.id_insumo} value={i.id_insumo}>{i.ins_nombre}</option>
            ))}
          </select>
          <button onClick={handleVincular} className="btn btn-primary">Vincular</button>
          <Link
            to="/inventario/registrar"
            state={{ backTo: `/proveedores/${id}/insumos` }}
            className="btn btn-secondary"
            title="Crear un insumo nuevo si no existe"
          >
            Crear insumo…
          </Link>
        </div>
        <small className="muted">Si el insumo no existe, crealo con “Crear insumo…” y luego volvé para vincularlo.</small>
      </div>

      {/* Lista vinculados */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Insumo</th>
              <th>Unidad</th>
              <th>Stock actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(relaciones || []).map((r) => {
              const ins = insumoById.get(Number(r.id_insumo)) || {};
              return (
                <tr key={r.id_proveedor_insumo || r.id || `${r.id_proveedor}-${r.id_insumo}`}>
                  <td>{ins.id_insumo ?? r.id_insumo}</td>
                  <td>{ins.ins_nombre ?? r.ins_nombre ?? "-"}</td>
                  <td>{ins.ins_unidad ?? "-"}</td>
                  <td>{ins.ins_stock_actual ?? "-"}</td>
                  <td className="actions-cell">
                    <button className="btn btn-danger" onClick={()=>handleQuitar(r)}>Quitar</button>
                  </td>
                </tr>
              );
            })}
            {(!relaciones || relaciones.length === 0) && (
              <tr><td colSpan="5" className="empty-row">Este proveedor aún no tiene insumos vinculados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.page-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:16px; }
.page-header h2 { margin:0; color:#fff; }
.sub { margin:4px 0 0; color:#d1d5db; }
.header-actions { display:flex; gap:8px; }

.notice { background:#1f2937; border:1px solid #374151; color:#e5e7eb; padding:8px 12px; border-radius:8px; }

.card { background:#2c2c2e; border:1px solid #3a3a3c; border-radius:12px; padding:16px; margin-bottom:16px; }
.row { display:flex; gap:8px; align-items:center; }
select { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; border-radius:8px; padding:10px 12px; outline:none; }
.btn { display:inline-flex; align-items:center; gap:8px; padding:8px 14px; border-radius:8px; border:none; cursor:pointer; font-weight:600; text-decoration:none; transition:background-color .2s ease; }
.btn-primary { background:#facc15; color:#111827; }
.btn-primary:hover { background:#eab308; }
.btn-secondary { background:#3a3a3c; color:#eaeaea; }
.btn-secondary:hover { background:#4a4a4e; }
.btn-danger { background:rgba(239,68,68,.2); color:#ef4444; }
.btn-danger:hover { background:rgba(239,68,68,.3); }

.table-container { background:#2c2c2e; border:1px solid #3a3a3c; border-radius:12px; overflow:hidden; }
.table { width:100%; border-collapse:collapse; }
.table th, .table td { padding:14px 18px; text-align:left; border-bottom:1px solid #3a3a3c; color:#eaeaea; }
.table th { background:#3a3a3c; color:#d1d5db; font-weight:600; font-size:.875rem; text-transform:uppercase; }
.table tbody tr:last-child td { border-bottom:none; }
.actions-cell { display:flex; gap:8px; }
.empty-row { text-align:center; color:#a0a0a0; padding:32px; }
`;
