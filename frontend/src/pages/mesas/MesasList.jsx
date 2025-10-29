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

const isBlockingEstado = (raw) => {
  const s = String(raw || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  // Bloquea si hay pedidos "entregado" o "en proceso"
  return s === "entregado" || s === "en proceso" || s === "en_proceso" || s === "en-proceso";
};

export default function MesasList() {
  const [data, setData] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [bloqueadas, setBloqueadas] = useState(new Set()); // mesas con pedidos Entregado/En proceso

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

  // Marca como bloqueadas las mesas que tengan pedidos en estado Entregado o En proceso
  const fetchPedidosBloqueantes = async () => {
    try {
      const { data } = await api.get("/api/pedidos/", { params: { page_size: 1000 } });
      const list = normalize(data);
      const s = new Set();
      list.forEach((p) => {
        const estado = p?.estado_nombre ?? p?.id_estado_pedido?.estp_nombre ?? p?.estado ?? "";
        const idMesa = p?.id_mesa?.id_mesa ?? p?.id_mesa ?? null;
        if (idMesa && isBlockingEstado(estado)) {
          s.add(Number(idMesa));
        }
      });
      setBloqueadas(s);
    } catch (e) {
      console.warn("No se pudieron cargar pedidos para validar bloqueo de edición.");
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchEstados(), fetchMesas()]);
      await fetchPedidosBloqueantes();
    })();
  }, []);

  const estIdByName = (nombre) => {
    const n = String(nombre || "").toLowerCase();
    return estados.find(e => String(e.estms_nombre).toLowerCase() === n)?.id_estado_mesa;
  };

  const estNombre = (r) =>
    r.estado_mesa_nombre ?? r?.id_estado_mesa?.estms_nombre ?? "-";

  const setEstado = async (mesa, targetNombre) => {
    try {
      const targetId = estIdByName(targetNombre);
      if (!targetId) {
        alert('No encuentro el estado "' + targetNombre + '" en el catálogo. Creá Disponible/Ocupada/Inactiva.');
        return;
      }
      const id = mesa.id_mesa ?? mesa.id;
      await api.patch(`/api/mesas/${id}/`, { id_estado_mesa: targetId });
      await fetchMesas();
      await fetchPedidosBloqueantes();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cambiar el estado.");
    }
  };

  const toggleOcupadaDisponible = async (mesa) => {
    const currentName = String(estNombre(mesa) || "").toLowerCase();
    const next = currentName === "disponible" ? "Ocupada" : "Disponible";
    await setEstado(mesa, next);
  };

  // Desactivar / Activar (Inactiva <-> Disponible)
  const toggleInactiva = async (mesa) => {
    const currentName = String(estNombre(mesa) || "").toLowerCase();
    const next = currentName === "inactiva" ? "Disponible" : "Inactiva";
    await setEstado(mesa, next);
  };

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
                <th style={{width:420}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan="4" style={{textAlign:"center"}}>Sin registros</td></tr>
              )}
              {sorted.map((r, idx) => {
                const id = r.id_mesa ?? r.id ?? idx;
                const nombreEstado = String(estNombre(r)).toLowerCase();
                const isBloq = bloqueadas.has(Number(id)); // BLOQUEA si tiene pedido Entregado/En proceso
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{r.ms_numero ?? "-"}</td>
                    <td style={{textTransform:"capitalize"}}>{estNombre(r)}</td>
                    <td style={{display:"flex",gap:8, flexWrap:"wrap", alignItems:"center"}}>
                      {/* Editar: deshabilitado si la mesa está bloqueada (Entregado/En proceso) */}
                      {isBloq ? (
                        <>
                          <span
                            className="btn btn-secondary disabled"
                            title="No se puede editar: la mesa tiene un pedido Entregado/En proceso"
                            style={{opacity:.6, cursor:"not-allowed"}}
                            onClick={(e)=>e.preventDefault()}
                          >
                            Editar
                          </span>
                          <small style={{color:"#facc15"}}>Mesa bloqueada por pedido activo</small>
                        </>
                      ) : (
                        <Link to={`/mesas/${id}/editar`} className="btn btn-secondary">Editar</Link>
                      )}

                      {/* Ocultar acciones cuando está bloqueada */}
                      {!isBloq && (
                        <>
                          {/* Ocupada/Disponible */}
                          <button onClick={() => toggleOcupadaDisponible(r)} className="btn btn-danger">
                            {nombreEstado === "disponible" ? "Marcar ocupada" : "Marcar disponible"}
                          </button>

                          {/* Desactivar / Activar */}
                          <button
                            onClick={() => toggleInactiva(r)}
                            className="btn btn-warning"
                            title={nombreEstado === "inactiva" ? "Activar mesa (Disponible)" : "Desactivar mesa (Inactiva)"}
                          >
                            {nombreEstado === "inactiva" ? "Activar" : "Desactivar"}
                          </button>
                        </>
                      )}
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
.btn-warning { background:#f59e0b; color:#111827; border-color:#f59e0b; }
`;



