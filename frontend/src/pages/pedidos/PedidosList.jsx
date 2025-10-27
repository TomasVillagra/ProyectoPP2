import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

const FALLBACK_IDS = {
  ENTREGADO: 3,
  CANCELADO: 4,
  FINALIZADO: 5,
  EN_PROCESO: 1,
};

function normalize(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp?.results && Array.isArray(resp.results)) return resp.results;
  if (resp?.data && Array.isArray(resp.data)) return resp.data;
  return [];
}

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

function nowForApiLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 19);
}

function resolveEstadoId(list, targetNames = [], fallbackId) {
  if (!Array.isArray(list) || list.length === 0) return fallbackId;
  const clean = (s) => String(s || "").trim().toLowerCase();
  const targets = targetNames.map(clean);
  for (const it of list) {
    const nombre = it.estado_nombre ?? it.estped_nombre ?? it.nombre ?? "";
    if (targets.includes(clean(nombre))) {
      return it.id_estado_pedido ?? it.id ?? fallbackId;
    }
  }
  return fallbackId;
}

export default function PedidosList() {
  const [data, setData] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [estados, setEstados] = useState([]);
  const [estadosMesa, setEstadosMesa] = useState([]);

  const fetchEstados = async () => {
    const candidates = [
      "/api/estado-pedidos/",
      "/api/estado_pedidos/",
      "/api/estados-pedido/",
      "/api/estadospedido/",
    ];
    for (const url of candidates) {
      try {
        const { data } = await api.get(url);
        const list = normalize(data);
        if (Array.isArray(list)) {
          setEstados(list);
          return;
        }
      } catch {}
    }
    setEstados([]);
  };

  const fetchEstadosMesa = async () => {
    const candidates = ["/api/estados-mesa/", "/api/estado-mesas/"];
    for (const url of candidates) {
      try {
        const { data } = await api.get(url);
        const list = normalize(data);
        if (Array.isArray(list)) {
          setEstadosMesa(list);
          return;
        }
      } catch {}
    }
    setEstadosMesa([]);
  };

  const fetchPedidos = async () => {
    try {
      const { data } = await api.get("/api/pedidos/");
      setData(normalize(data));
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstados();
    fetchEstadosMesa();
    fetchPedidos();
  }, []);

  const descontarInsumos = async (pedidoId) => {
    try {
      await api.post(`/api/pedidos/${pedidoId}/descontar_insumos/`);
    } catch (e) {
      console.error(e);
      setMsg("Se actualizó el estado pero no se pudieron descontar insumos.");
    }
  };

  const setMesaEstado = async (pedido, nombreEstado) => {
    try {
      const mesaId = pedido.id_mesa ?? null;
      if (!mesaId) return;
      const clean = (s) => String(s || "").toLowerCase();
      const target = estadosMesa.find((e) => clean(e.estms_nombre) === clean(nombreEstado));
      if (!target) return;
      await api.patch(`/api/mesas/${mesaId}/`, { id_estado_mesa: Number(target.id_estado_mesa) });
    } catch (e) {
      console.warn("No se pudo actualizar el estado de la mesa:", e?.response?.data || e?.message);
    }
  };

  // ENTREGAR -> estado "Entregado" (NO es Finalizado)
  const marcarEntregado = async (p) => {
    try {
      const id = p.id_pedido ?? p.id;
      const entregadoId = resolveEstadoId(estados, ["entregado"], FALLBACK_IDS.ENTREGADO);
      await api.patch(`/api/pedidos/${id}/`, {
        ped_fecha_hora_fin: nowForApiLocal(),
        id_estado_pedido: entregadoId,
      });
      await descontarInsumos(id);
      await setMesaEstado(p, "Disponible"); // liberar mesa
      await fetchPedidos();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo marcar como ENTREGADO.");
    }
  };

  // FINALIZAR -> estado "Finalizado" (distinto a Entregado)
  const marcarFinalizado = async (p) => {
    try {
      const id = p.id_pedido ?? p.id;
      const finalizadoId = resolveEstadoId(estados, ["finalizado"], FALLBACK_IDS.FINALIZADO);
      await api.patch(`/api/pedidos/${id}/`, {
        ped_fecha_hora_fin: nowForApiLocal(),
        id_estado_pedido: finalizadoId,
      });
      await descontarInsumos(id);
      await setMesaEstado(p, "Disponible"); // liberar mesa
      await fetchPedidos();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo finalizar el pedido.");
    }
  };

  const marcarCancelado = async (p, restarStock = false) => {
    try {
      const id = p.id_pedido ?? p.id;
      const canceladoId = resolveEstadoId(estados, ["cancelado", "anulado"], FALLBACK_IDS.CANCELADO);
      await api.patch(`/api/pedidos/${id}/`, {
        ped_fecha_hora_fin: nowForApiLocal(),
        id_estado_pedido: canceladoId,
      });
      if (restarStock) await descontarInsumos(id);
      await fetchPedidos();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cancelar el pedido.");
    }
  };

  const onEntregarClick = async (pedido) => {
    const ok = window.confirm(
      "El pedido pasará a ENTREGADO y se descontará el stock. La mesa quedará DISPONIBLE. ¿Continuar?"
    );
    if (!ok) return;
    await marcarEntregado(pedido);
  };

  const onFinalizarClick = async (pedido) => {
    const ok = window.confirm(
      "El pedido pasará a FINALIZADO, se descontará el stock y la mesa quedará DISPONIBLE. ¿Continuar?"
    );
    if (!ok) return;
    await marcarFinalizado(pedido);
  };

  const onCancelarClick = async (pedido) => {
    const opt = window.prompt(
      "Escribí:\n1 = Cancelar SIN restar stock\n2 = Cancelar RESTANDO stock\n(otra tecla para abortar)"
    );
    if (opt === "1") return marcarCancelado(pedido, false);
    if (opt === "2") return marcarCancelado(pedido, true);
  };

  return (
    <DashboardLayout>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{margin:0,color:"#fff"}}>Pedidos</h2>
        <Link to="/pedidos/registrar" className="btn btn-primary">Registrar pedido</Link>
      </div>

      {msg && <p style={{color:"#facc15"}}>{msg}</p>}
      {loading ? <p>Cargando...</p> : (
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>ID</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Mesa</th>
                <th>Empleado</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th style={{width:500}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan="8" style={{textAlign:"center"}}>Sin registros</td></tr>
              )}
              {data.map((r, idx) => {
                const id = r.id_pedido ?? r.id ?? idx;
                const inicio = r.ped_fecha_hora_ini ?? r.ped_fecha ?? r.fecha ?? null;
                const fin = r.ped_fecha_hora_fin ?? null;
                const mesa = r.mesa_numero ?? r.ms_numero ?? r.id_mesa ?? null;
                const empleado = r.empleado_nombre ?? r.emp_nombre ?? r.id_empleado ?? "-";
                const tipo = r.tipo_nombre ?? r.tipped_nombre ?? r.id_tipo_pedido ?? "-";
                const estado = r.estado_nombre ?? r.estped_nombre ?? r.id_estado_pedido ?? "-";

                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{fmtDate(inicio)}</td>
                    <td>{fmtDate(fin)}</td>
                    <td>{mesa ? `Mesa ${mesa}` : "-"}</td>
                    <td>{empleado}</td>
                    <td>{tipo}</td>
                    <td>{estado}</td>
                    <td style={{display:"flex",gap:8, flexWrap:"wrap"}}>
                      <Link to={`/pedidos/${id}`} className="btn btn-secondary">Ver</Link>
                      <Link to={`/pedidos/${id}/editar`} className="btn btn-secondary">Editar</Link>
                      <button onClick={() => onEntregarClick(r)} className="btn btn-success">Entregar</button>
                      <button onClick={() => onFinalizarClick(r)} className="btn btn-primary">Finalizar</button>
                      <button onClick={() => onCancelarClick(r)} className="btn btn-danger">Cancelar</button>
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
.btn-success { background:#22c55e; color:#0b0b0b; border-color:#22c55e; }
`;








