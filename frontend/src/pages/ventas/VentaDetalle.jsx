// src/pages/ventas/VentaDetalle.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../api/axios";

/* ---------------------------
   Helpers
--------------------------- */
function normalize(resp) {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}
const money = (n) => {
  const x = Number(n);
  return (Number.isFinite(x) ? x : 0).toFixed(2);
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

async function fetchVenta(id) {
  const candidates = [
    `/api/ventas/${id}/`,
    `/api/venta/${id}/`,
  ];
  for (const u of candidates) {
    try {
      const res = await api.get(u);
      if (res?.data) return res.data;
    } catch {}
  }
  return null;
}
async function fetchDetalles(id_venta) {
  const candidates = [
    `/api/detalle-ventas/?id_venta=${id_venta}`,
    `/api/detalles-venta/?id_venta=${id_venta}`,
    `/api/ventas/${id_venta}/detalles/`,
  ];
  for (const u of candidates) {
    try {
      const res = await api.get(u);
      const list = normalize(res);
      if (Array.isArray(list)) return list;
    } catch {}
  }
  return [];
}
async function fetchPlato(platoId) {
  const candidates = [
    `/api/platos/${platoId}/`,
    `/api/plato/${platoId}/`,
    `/api/platos?id=${platoId}`,
  ];
  for (const url of candidates) {
    try {
      const { data } = await api.get(url);
      if (data) return Array.isArray(data) ? data[0] : data;
    } catch {}
  }
  return null;
}
const readPlatoNombre = (p, fallback = "") =>
  p?.plt_nombre ?? p?.nombre ?? (fallback || `#${p?.id_plato ?? p?.id ?? ""}`);

/* ---------------------------
   Página
--------------------------- */
export default function VentaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venta, setVenta] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [platosCache, setPlatosCache] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const v = await fetchVenta(id);
        if (!v) {
          setMsg("No se encontró la venta.");
          setLoading(false);
          return;
        }
        setVenta(v);

        const dets = await fetchDetalles(v.id_venta ?? v.id ?? id);
        setDetalles(dets);

        // Traer nombres de platos (cache simple)
        const cache = new Map();
        await Promise.all(
          dets.map(async (d) => {
            const pid = Number(d.id_plato ?? d.plato ?? d.id);
            if (!pid || cache.has(pid)) return;
            const p = await fetchPlato(pid);
            cache.set(pid, p);
          })
        );
        setPlatosCache(cache);
      } catch (e) {
        setMsg("No se pudieron cargar los datos de la venta.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalCalculado = useMemo(() => {
    return detalles.reduce((acc, d) => {
      const cant = Number(d.detven_cantidad ?? d.cantidad ?? 0);
      const unit = Number(d.detven_precio_uni ?? d.precio_unitario ?? 0);
      const sub = Number(d.detven_subtotal ?? d.subtotal ?? unit * cant);
      const add = Number.isFinite(sub) ? sub : 0;
      return acc + add;
    }, 0);
  }, [detalles]);

  const venMonto = Number(venta?.ven_monto ?? venta?.monto ?? 0);
  const totalOK = Math.abs(venMonto - totalCalculado) < 0.01;

  const clienteStr =
    venta?.cliente_nombre ??
    venta?.cli_nombre ??
    (venta?.id_cliente != null ? `#${venta?.id_cliente}` : "-");

  const empleadoStr =
    venta?.empleado_nombre ??
    venta?.emp_nombre ??
    (venta?.id_empleado != null ? `#${venta?.id_empleado}` : "-");

  const estadoStr =
    venta?.estado_nombre ??
    venta?.estven_nombre ??
    (venta?.id_estado_venta != null ? `#${venta?.id_estado_venta}` : "-");

  return (
    <DashboardLayout>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{margin:0,color:"#fff"}}>Venta #{venta?.id_venta ?? venta?.id ?? id}</h2>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Link className="btn btn-secondary" to="/ventas">Volver a Ventas</Link>
        </div>
      </div>

      {loading && <p>Cargando...</p>}
      {msg && <p style={{color:"#facc15", whiteSpace:"pre-wrap"}}>{msg}</p>}

      {!loading && venta && (
        <>
          <div className="card">
            <div className="grid">
              <div>
                <div className="muted">Fecha/Hora</div>
                <div>{fmtDate(venta.ven_fecha_hora ?? venta.fecha ?? venta.created_at)}</div>
              </div>
              <div>
                <div className="muted">Cliente</div>
                <div>{clienteStr}</div>
              </div>
              <div>
                <div className="muted">Empleado</div>
                <div>{empleadoStr}</div>
              </div>
              <div>
                <div className="muted">Estado</div>
                <div>{String(estadoStr)}</div>
              </div>
              <div>
                <div className="muted">Descripción</div>
                <div>{venta.ven_descripcion ?? venta.descripcion ?? "-"}</div>
              </div>
              <div>
                <div className="muted">Total (ven_monto)</div>
                <div style={{fontWeight:700}}>${money(venMonto)}</div>
              </div>
              <div>
                <div className="muted">Total calculado (detalles)</div>
                <div style={{fontWeight:700, color: totalOK ? "#22c55e" : "#f97316"}}>
                  ${money(totalCalculado)} {!totalOK && "(≠ ven_monto)"}
                </div>
              </div>
            </div>
          </div>

          <h3 style={{marginTop:18, color:"#fff"}}>Detalles de la venta</h3>
          <div className="table-wrap">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Plato</th>
                  <th style={{width:110, textAlign:"right"}}>Cant.</th>
                  <th style={{width:160, textAlign:"right"}}>Precio unitario</th>
                  <th style={{width:160, textAlign:"right"}}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalles.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign:"center"}}>Sin ítems</td></tr>
                )}
                {detalles.map((d, idx) => {
                  const pid = Number(d.id_plato ?? d.plato ?? d.id ?? 0);
                  const plato = platosCache.get(pid);
                  const nombre = plato ? readPlatoNombre(plato) : (pid ? `Plato #${pid}` : "-");

                  const cantidad = Number(d.detven_cantidad ?? d.cantidad ?? 0);
                  const unit = Number(d.detven_precio_uni ?? d.precio_unitario ?? 0);
                  const sub = Number(d.detven_subtotal ?? d.subtotal ?? unit * cantidad);

                  return (
                    <tr key={idx}>
                      <td>{nombre}</td>
                      <td style={{textAlign:"right"}}>{cantidad}</td>
                      <td style={{textAlign:"right"}}>${money(unit)}</td>
                      <td style={{textAlign:"right"}}>${money(sub)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {detalles.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{textAlign:"right", fontWeight:700}}>Total</td>
                    <td style={{textAlign:"right", fontWeight:700}}>${money(totalCalculado)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.card {
  background:#1b1b1e; color:#eaeaea; border:1px solid #2a2a2a; border-radius:12px; padding:14px; margin-bottom:14px;
}
.grid {
  display:grid; gap:10px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.muted { color:#9ca3af; font-size:12px; margin-bottom:4px; }
.table-wrap { overflow:auto; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;
