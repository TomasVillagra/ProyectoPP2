import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";
const api = apiNamed || apiDefault;

/* Helpers */
function normAny(resp) {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}
const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};
function fmtDate(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return String(dt).replace("T", " ").slice(0, 19);
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function MovimientosCajaList() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const fetchMovs = async () => {
    try {
      const candidates = ["/api/movimientos-caja/", "/api/movimientos_caja/"];
      for (const u of candidates) {
        try {
          const res = await api.get(u);
          setItems(normAny(res));
          return;
        } catch {}
      }
      setItems([]);
    } catch (e) {
      setMsg("No se pudieron cargar los movimientos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovs(); }, []);

  const filtered = useMemo(() => {
    const s = String(q || "").toLowerCase();
    if (!s) return items;
    return items.filter(it => JSON.stringify(it).toLowerCase().includes(s));
  }, [items, q]);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  return (
    <DashboardLayout>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{margin:0,color:"#fff"}}>Movimientos de Caja</h2>
        <input
          placeholder="Buscar..."
          value={q}
          onChange={e => { setPage(1); setQ(e.target.value); }}
          className="input"
          style={{maxWidth:260}}
        />
      </div>

      {msg && <p style={{color:"#facc15", whiteSpace:"pre-wrap"}}>{msg}</p>}
      {loading ? <p>Cargando...</p> : (
        <>
          <div className="table-wrap">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha/Hora</th>
                  <th>Tipo</th>
                  <th>Venta</th>
                  <th>Método pago</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 && (
                  <tr><td colSpan="7" style={{textAlign:"center"}}>Sin registros</td></tr>
                )}
                {pageData.map((m) => (
                  <tr key={m.id_movimiento_caja ?? m.id_movimiento ?? m.id}>
                    <td>{m.id_movimiento_caja ?? m.id_movimiento ?? m.id}</td>
                    <td>{fmtDate(m.mv_fecha_hora ?? m.mov_fecha_hora ?? m.fecha ?? m.created_at)}</td>
                    <td>{m.tipo_nombre ?? m.tipmov_nombre ?? m.id_tipo_movimiento_caja}</td>
                    <td>{m.id_venta ?? m.venta_id ?? "-"}</td>
                    <td>{m.metodo_pago_nombre ?? m.metpag_nombre ?? m.id_metodo_pago ?? "-"}</td>
                    <td>${money(m.mv_monto ?? m.mov_monto ?? m.monto ?? 0)}</td>
                    <td>{m.mv_descripcion ?? m.mov_descripcion ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:10}}>
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p-1))}>◀</button>
            <div className="btn btn-secondary" style={{cursor:"default"}}>Página {page} / {totalPages}</div>
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p+1))}>▶</button>
          </div>
        </>
      )}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.input { width:100%; max-width:260px; background:#0f0f10; color:#fff; border:1px solid #2a2a2a; border-radius:8px; padding:8px; }
.table-wrap { overflow:auto; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;


