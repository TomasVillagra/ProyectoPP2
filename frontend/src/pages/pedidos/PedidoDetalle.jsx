import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../api/axios";

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

export default function PedidoDetalle() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/pedidos/${id}/`);
        setPedido(res.data);
      } catch (e) {
        console.error(e);
        setMsg("No se pudo cargar el pedido.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (msg) return <p style={{ color: "#facc15" }}>{msg}</p>;
  if (!pedido) return <p>No se encontró el pedido.</p>;

  // Normalizar posibles nombres de campos
  const detalles = Array.isArray(pedido.detalles)
    ? pedido.detalles
    : Array.isArray(pedido.items)
    ? pedido.items
    : Array.isArray(pedido.lineas)
    ? pedido.lineas
    : [];

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: "#fff" }}>Pedido #{pedido.id_pedido ?? pedido.id}</h2>
        <Link className="btn btn-secondary" to="/pedidos">Volver a Pedidos</Link>
      </div>

      <div className="card">
        <div className="grid">
          <div>
            <div className="muted">Mesa</div>
            <div>{pedido.mesa_numero ?? pedido.mesa ?? "Sin mesa"}</div>
          </div>
          <div>
            <div className="muted">Empleado</div>
            <div>{pedido.empleado_nombre ?? pedido.empleado ?? "—"}</div>
          </div>
          <div>
            <div className="muted">Cliente</div>
            <div>{pedido.cliente_nombre ?? pedido.cliente ?? "—"}</div>
          </div>
          <div>
            <div className="muted">Estado</div>
            <div>{pedido.estado_nombre ?? pedido.estado ?? "—"}</div>
          </div>
          <div>
            <div className="muted">Tipo</div>
            <div>{pedido.tipo_nombre ?? pedido.tipo ?? "—"}</div>
          </div>
          <div>
            <div className="muted">Inicio</div>
            <div>{fmtDate(pedido.ped_fecha_hora_ini ?? pedido.fecha_hora_ini)}</div>
          </div>
          <div>
            <div className="muted">Fin</div>
            <div>{pedido.ped_fecha_hora_fin ? fmtDate(pedido.ped_fecha_hora_fin) : "En curso"}</div>
          </div>
          <div>
            <div className="muted">Descripción</div>
            <div>{pedido.ped_descripcion ?? pedido.descripcion ?? "—"}</div>
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: 18, color: "#fff" }}>Detalle de Platos</h3>
      <div className="table-wrap">
        <table className="table-dark">
          <thead>
            <tr>
              <th>Plato</th>
              <th style={{ width: 120, textAlign: "right" }}>Cantidad</th>
              {/* Si querés mostrar alguna nota por ítem, descomentá: */}
              {/* <th>Notas</th> */}
            </tr>
          </thead>
          <tbody>
            {detalles.length ? (
              detalles.map((d, i) => {
                const nombre =
                  d.plato_nombre ??
                  d.plato?.pla_nombre ??
                  d.plato?.plt_nombre ??
                  d.nombre ??
                  "(sin nombre)";
                const cantidad = d.detped_cantidad ?? d.cantidad ?? d.qty ?? 0;
                const notas = d.nota ?? d.notas ?? d.observacion ?? d.observaciones ?? null;

                return (
                  <tr key={i}>
                    <td>{nombre}</td>
                    <td style={{ textAlign: "right" }}>{cantidad}</td>
                    {/* {notas ? <td>{notas}</td> : <td>—</td>} */}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: "center" }}>
                  Sin platos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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


