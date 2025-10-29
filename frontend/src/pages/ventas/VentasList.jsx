// src/pages/ventas/VentasList.jsx
import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Link } from "react-router-dom";

function normAny(resp) {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

const clean = (s) => String(s || "").trim().toLowerCase();
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

export default function VentasList() {
  const [ventas, setVentas] = useState([]);
  const [estadosVenta, setEstadosVenta] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEstadosVenta = async () => {
    const candidates = [
      "/api/estado-ventas/",
      "/api/estado_ventas/",
      "/api/estados-venta/",
      "/api/estadosventa/",
    ];
    for (const url of candidates) {
      try {
        const res = await api.get(url);
        const list = normAny(res);
        if (Array.isArray(list)) { setEstadosVenta(list); return; }
      } catch {}
    }
    setEstadosVenta([]);
  };

  const fetchVentas = async () => {
    try {
      const res = await api.get("/api/ventas/");
      setVentas(normAny(res));
    } catch (e) {
      console.error(e);
      setMsg("No se pudieron cargar las ventas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchEstadosVenta();
      await fetchVentas();
    })();
  }, []);

  const resolveEstadoId = (targetNames = []) => {
    if (!Array.isArray(estadosVenta) || estadosVenta.length === 0) return null;
    const targets = targetNames.map((s) => clean(s));
    for (const it of estadosVenta) {
      const nombre = it.estven_nombre ?? it.nombre ?? it.estado ?? "";
      if (targets.includes(clean(nombre))) {
        return it.id_estado_venta ?? it.id;
      }
    }
    return null;
  };

  const setEstadoVenta = async (venta, target) => {
    try {
      const id = venta.id_venta ?? venta.id;
      const estadoId = resolveEstadoId([target]); // e.g. "pagada"
      if (!estadoId) {
        alert(`No se encontró el estado "${target}". Revisá catálogo de estados de venta.`);
        return;
      }
      const candidates = [
        `/api/ventas/${id}/`,
        `/api/venta/${id}/`,
      ];
      let ok = false;
      for (const url of candidates) {
        try {
          await api.patch(url, { id_estado_venta: Number(estadoId) });
          ok = true;
          break;
        } catch {}
      }
      if (!ok) throw new Error("No se pudo actualizar el estado de la venta.");
      await fetchVentas();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cambiar el estado de la venta.");
    }
  };

  return (
    <DashboardLayout>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{margin:0,color:"#fff"}}>Ventas</h2>
        {/* Si querés agregar "Registrar venta" manual, poné un Link acá */}
      </div>

      {msg && <p style={{color:"#facc15", whiteSpace:"pre-wrap"}}>{msg}</p>}
      {loading ? <p>Cargando...</p> : (
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha/Hora</th>
                <th>Cliente</th>
                <th>Empleado</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{width:480}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 && (
                <tr><td colSpan="7" style={{textAlign:"center"}}>Sin registros</td></tr>
              )}
              {ventas.map((v, i) => {
                const id = v.id_venta ?? v.id ?? i;
                const fecha = v.ven_fecha_hora ?? v.fecha ?? v.created_at ?? null;
                const cliente = v.cliente_nombre ?? v.cli_nombre ?? v.id_cliente ?? "-";
                const empleado = v.empleado_nombre ?? v.emp_nombre ?? v.id_empleado ?? "-";
                const total = v.ven_total ?? v.total ?? 0;
                const estado = v.estado_nombre ?? v.estven_nombre ?? v.estado ?? v.id_estado_venta ?? "-";

                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{fmtDate(fecha)}</td>
                    <td>{String(cliente)}</td>
                    <td>{String(empleado)}</td>
                    <td>${money(total)}</td>
                    <td>{String(estado)}</td>
                    <td style={{display:"flex",gap:8, flexWrap:"wrap"}}>
                      {/* Si tenés una pantalla de detalle de venta: */}
                      <Link to={`/ventas/${id}`} className="btn btn-secondary">Ver</Link>

                      <button className="btn btn-success" onClick={() => setEstadoVenta(v, "pagada")}>
                        Marcar Pagada
                      </button>
                      <button className="btn btn-info" onClick={() => setEstadoVenta(v, "pendiente")}>
                        Marcar Pendiente
                      </button>
                      <button className="btn btn-danger" onClick={() => setEstadoVenta(v, "anulada")}>
                        Marcar Anulada
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
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
.btn-danger { background:#ef4444; color:#fff; border-color:#ef4444; }
.btn-success { background:#22c55e; color:#0b0b0b; border-color:#22c55e; }
.btn-info { background:#38bdf8; color:#0b0b0b; border-color:#38bdf8; }
`;
