import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ===========================
   Helpers genéricos
   =========================== */

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

const lower = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const clean = (s) => lower(s).trim();

const estadoNombreDe = (r) =>
  clean(r.estado_nombre ?? r.estped_nombre ?? r.estado ?? r.id_estado_pedido);

const isFinalizado = (r) => estadoNombreDe(r) === "finalizado";
const isCancelado  = (r) => estadoNombreDe(r) === "cancelado";
const isEntregado  = (r) => estadoNombreDe(r) === "entregado";
const isTerminal   = (r) => isFinalizado(r) || isCancelado(r);

/* Mostrar fecha amigable */
function fmtDate(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) {
      return String(dt).replace("T", " ").slice(0, 16);
    }
    return d.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dt);
  }
}

/* Para ordenar por fecha */
const parseDate = (s) => (s ? new Date(String(s).replace(" ", "T")) : null);

/* Paginación helper */
const paginate = (arr, page, size) => arr.slice((page - 1) * size, page * size);

function nowForApiLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 19);
}

function resolveEstadoId(list, targetNames = [], fallbackId) {
  if (!Array.isArray(list) || list.length === 0) return fallbackId;
  const targets = targetNames.map((s) => clean(s));
  for (const it of list) {
    const nombre = it.estado_nombre ?? it.estped_nombre ?? it.nombre ?? "";
    if (targets.includes(clean(nombre))) {
      return it.id_estado_pedido ?? it.id ?? fallbackId;
    }
  }
  return fallbackId;
}

/* ===========================
   Helpers de STOCK (validación)
   =========================== */

const getNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const readPlatoStockField = (platoObj) =>
  getNumber(platoObj?.plt_stock ?? platoObj?.stock ?? platoObj?.stock_actual ?? 0);
const readInsumoStockField = (insumoObj) =>
  getNumber(
    insumoObj?.ins_stock_actual ??
      insumoObj?.ins_stock ??
      insumoObj?.stock_actual ??
      insumoObj?.stock ??
      0
  );
const readRecetaCantPorPlato = (det) =>
  getNumber(det?.cantidad ?? det?.ri_cantidad ?? det?.detrec_cantidad ?? det?.insumo_cantidad ?? 0);

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
async function fetchRecetaDePlato(platoId) {
  const candidates = [
    `/api/recetas/?id_plato=${platoId}`,
    `/api/receta/?id_plato=${platoId}`,
    `/api/recetas/plato/${platoId}/`,
  ];
  for (const url of candidates) {
    try {
      const res = await api.get(url);
      const list = normalize(res);
      if (Array.isArray(list) && list.length > 0) return list[0];
      if (res?.data && !Array.isArray(res.data)) return res.data;
    } catch {}
  }
  return null;
}
async function fetchDetallesReceta(recetaId) {
  const candidates = [
    `/api/recetas/${recetaId}/insumos/`,
    `/api/receta/${recetaId}/insumos/`,
    `/api/recetas-detalle/?id_receta=${recetaId}`,
    `/api/detalle-recetas/?id_receta=${recetaId}`,
  ];
  for (const url of candidates) {
    try {
      const res = await api.get(url);
      const list = normalize(res);
      if (Array.isArray(list)) return list;
    } catch {}
  }
  return [];
}
async function fetchInsumo(insumoId) {
  const candidates = [
    `/api/insumos/${insumoId}/`,
    `/api/insumo/${insumoId}/`,
    `/api/insumos?id=${insumoId}`,
  ];
  for (const url of candidates) {
    try {
      const { data } = await api.get(url);
      if (data) return Array.isArray(data) ? data[0] : data;
    } catch {}
  }
  return null;
}

/** Valida stock para UN ítem (plato + cantidad) */
async function validarStockItem({ id_plato, cantidad }) {
  const platoId = Number(id_plato);
  const cantPedida = Number(cantidad);
  if (!platoId || !cantPedida) return null;

  const plato = await fetchPlato(platoId);
  if (plato) {
    const stockPlato = readPlatoStockField(plato);
    if (stockPlato >= cantPedida) return null; // alcanza stock del plato
  }

  const receta = await fetchRecetaDePlato(platoId);
  if (!receta) {
    return {
      platoId,
      motivo: "Sin stock del plato y sin receta definida.",
      faltantes: [],
    };
  }

  const recetaId = receta.id_receta ?? receta.id ?? receta.receta_id ?? receta.rec_id ?? null;
  const insumosDet = recetaId ? await fetchDetallesReceta(recetaId) : [];

  const faltantes = [];
  for (const det of insumosDet) {
    const insumoId = Number(det.id_insumo ?? det.insumo ?? det.id ?? det.insumo_id ?? 0);
    if (!insumoId) continue;
    const cantPorPlato = readRecetaCantPorPlato(det);
    const requerido = cantPorPlato * cantPedida;

    const ins = await fetchInsumo(insumoId);
    const stockInsumo = readInsumoStockField(ins);
    if (stockInsumo < requerido) {
      const nombre = ins?.ins_nombre ?? ins?.nombre ?? `Insumo #${insumoId}`;
      faltantes.push({ insumoId, nombre, requerido, disponible: stockInsumo });
    }
  }
  if (faltantes.length === 0) return null;
  return { platoId, motivo: "Faltan insumos para elaborar el plato.", faltantes };
}

/* ===========================
   Platos con receta (filtro)
   =========================== */

async function fetchTodasLasRecetas() {
  const candidates = [
    "/api/recetas/",
    "/api/receta/",
    "/api/recetas?limit=1000",
    "/api/recetas/list/",
  ];
  for (const url of candidates) {
    try {
      const res = await api.get(url);
      const list = normalize(res);
      if (Array.isArray(list)) return list;
    } catch {}
  }
  return [];
}
function pickIdPlatoFromReceta(r) {
  return Number(
    r?.id_plato ??
      r?.plato ??
      r?.plato_id ??
      (r?.plato && (r.plato.id_plato ?? r.plato.id)) ??
      0
  );
}
const getPlatoId = (p) => Number(p?.id_plato ?? p?.id);

/* ===========================
   Componente principal
   =========================== */

export default function PedidosList() {
  const [data, setData] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [estados, setEstados] = useState([]);
  const [estadosMesa, setEstadosMesa] = useState([]);
  const [platos, setPlatos] = useState([]);

  const [platosConReceta, setPlatosConReceta] = useState(new Set());

  // filtros / orden / paginación
  const [q, setQ] = useState("");
  const [fMesa, setFMesa] = useState("");
  const [fEmp, setFEmp] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [orderBy, setOrderBy] = useState("fecha_desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal "Agregar ítem"
  const [addOpen, setAddOpen] = useState(false);
  const [addTarget, setAddTarget] = useState(null);
  const [newItem, setNewItem] = useState({ id_plato: "", cantidad: "" });
  const [addMsg, setAddMsg] = useState("");
  const [descontarAhora, setDescontarAhora] = useState(false);

  // Modal "Cancelar"
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

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
        if (Array.isArray(list)) { setEstados(list); return; }
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
        if (Array.isArray(list)) { setEstadosMesa(list); return; }
      } catch {}
    }
    setEstadosMesa([]);
  };

  const fetchPlatos = async () => {
    const candidates = ["/api/platos/", "/api/plato/", "/api/platos?limit=1000"];
    for (const url of candidates) {
      try {
        const { data } = await api.get(url);
        const list = normalize(data);
        if (Array.isArray(list)) { setPlatos(list); return; }
      } catch {}
    }
    setPlatos([]);
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
    (async () => {
      await Promise.all([fetchEstados(), fetchEstadosMesa(), fetchPlatos()]);
      const recetas = await fetchTodasLasRecetas();
      const ids = new Set();
      recetas.forEach((r) => {
        const idp = pickIdPlatoFromReceta(r);
        if (idp) ids.add(Number(idp));
      });
      setPlatosConReceta(ids);
      await fetchPedidos();
    })();
  }, []);

  // ====== Acciones stock/mesa/estado (SIN CAMBIOS) ======

  const descontarInsumos = async (pedidoId) => {
    try {
      await api.post(`/api/pedidos/${pedidoId}/descontar_insumos/`);
    } catch (e) {
      console.error(e);
      setMsg("No se pudieron descontar insumos.");
    }
  };

  const setMesaEstado = async (pedido, nombreEstadoMesa) => {
    try {
      const mesaId = pedido.id_mesa ?? null;
      if (!mesaId) return;
      const target = estadosMesa.find((e) => clean(e.estms_nombre) === clean(nombreEstadoMesa));
      if (!target) return;
      await api.patch(`/api/mesas/${mesaId}/`, { id_estado_mesa: Number(target.id_estado_mesa) });
    } catch (e) {
      console.warn("No se pudo actualizar el estado de la mesa:", e?.response?.data || e?.message);
    }
  };

  const marcarEntregado = async (p) => {
    try {
      const id = p.id_pedido ?? p.id;
      const entregadoId = resolveEstadoId(estados, ["entregado"], FALLBACK_IDS.ENTREGADO);
      await api.patch(`/api/pedidos/${id}/`, {
        ped_fecha_hora_fin: nowForApiLocal(),
        id_estado_pedido: entregadoId,
      });
      await descontarInsumos(id);
      await setMesaEstado(p, "Ocupada");
      await fetchPedidos();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo marcar como ENTREGADO.");
    }
  };

  const marcarFinalizado = async (p) => {
    try {
      const id = p.id_pedido ?? p.id;
      const finalizadoId = resolveEstadoId(estados, ["finalizado"], FALLBACK_IDS.FINALIZADO);
      await api.patch(`/api/pedidos/${id}/`, {
        ped_fecha_hora_fin: nowForApiLocal(),
        id_estado_pedido: finalizadoId,
      });
      await setMesaEstado(p, "Disponible");
      try {
        await api.post(`/api/pedidos/${id}/generar_venta/`);
      } catch (e) {
        const status = e?.response?.status;
        const data = e?.response?.data;
        alert("No se pudo generar la venta:\n" + JSON.stringify({ status, data }, null, 2));
      }
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
      await setMesaEstado(p, "Disponible");
      await fetchPedidos();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cancelar el pedido.");
    }
  };

  // ====== Agregar Ítem (SIN CAMBIOS) ======
  const abrirAgregarItem = (pedido) => {
    if (isTerminal(pedido)) {
      alert("No se pueden agregar ítems a un pedido Finalizado/Cancelado.");
      return;
    }
    setAddTarget(pedido);
    setNewItem({ id_plato: "", cantidad: "" });
    setAddMsg("");
    setDescontarAhora(false);
    setAddOpen(true);
  };

  const confirmarAgregarItem = async () => {
    setAddMsg("");
    if (!addTarget) return;

    const id_pedido = addTarget.id_pedido ?? addTarget.id;
    const id_plato = Number(newItem.id_plato);
    const cantidad = Number(newItem.cantidad);

    if (!id_plato) {
      setAddMsg("Seleccioná un plato.");
      return;
    }
    if (!platosConReceta.has(id_plato)) {
      setAddMsg("El plato elegido no tiene receta. No se puede seleccionar.");
      return;
    }
    if (!cantidad || cantidad <= 0) {
      setAddMsg("Ingresá una cantidad válida (>0).");
      return;
    }

    const err = await validarStockItem({ id_plato, cantidad });
    if (err) {
      const plato = platos.find((p) => getPlatoId(p) === Number(err.platoId));
      const nombrePlato = plato?.plt_nombre ?? plato?.nombre ?? `Plato #${err.platoId}`;
      const lines = [`• ${nombrePlato}: ${err.motivo}`];
      if (err.faltantes?.length) {
        err.faltantes.forEach((f) => {
          lines.push(`   - ${f.nombre}: requiere ${f.requerido}, disponible ${f.disponible}`);
        });
      }
      setAddMsg("Stock insuficiente:\n" + lines.join("\n"));
      return;
    }

    try {
      await api.post(`/api/detalle-pedidos/`, {
        id_pedido: Number(id_pedido),
        id_plato: Number(id_plato),
        detped_cantidad: Number(cantidad),
      });

      if (descontarAhora) {
        try {
          await api.post(`/api/pedidos/${id_pedido}/descontar_insumos_detalle/`, {
            id_plato: Number(id_plato),
            cantidad: Number(cantidad),
          });
        } catch (e) {
          const status = e?.response?.status;
          if (status === 404) {
            const ok = window.confirm(
              "No existe el endpoint para descontar SOLO este ítem. ¿Querés descontar insumos del pedido completo ahora?"
            );
            if (ok) {
              await descontarInsumos(id_pedido);
            }
          } else {
            alert("No se pudo descontar stock ahora: " + JSON.stringify(e?.response?.data ?? {}, null, 2));
          }
        }
      }

      setAddOpen(false);
      await fetchPedidos();
    } catch (e) {
      console.error(e);
      setAddMsg("No se pudo agregar el ítem. Revisá conexión/API.");
    }
  };

  // ====== Cancelar con dos opciones (SIN CAMBIOS) ======
  const abrirCancelar = (pedido) => {
    if (isTerminal(pedido)) return;
    setCancelTarget(pedido);
    setCancelOpen(true);
  };

  // =======================
  // Filtros y orden
  // =======================

  const opcionesMesa = useMemo(() => {
    const set = new Set();
    data.forEach((r) => {
      const mesa = r.mesa_numero ?? r.ms_numero ?? r.id_mesa ?? null;
      if (mesa !== null && mesa !== undefined && mesa !== "") set.add(String(mesa));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [data]);

  const opcionesEmpleado = useMemo(() => {
    const set = new Set();
    data.forEach((r) => {
      const emp = r.empleado_nombre ?? r.emp_nombre ?? r.id_empleado ?? "";
      if (emp !== "") set.add(String(emp));
    });
    return Array.from(set).sort();
  }, [data]);

  const opcionesTipo = useMemo(() => {
    const set = new Set();
    data.forEach((r) => {
      const tipo = r.tipo_nombre ?? r.tipped_nombre ?? r.id_tipo_pedido ?? "";
      if (tipo !== "") set.add(String(tipo));
    });
    return Array.from(set).sort();
  }, [data]);

  const opcionesEstado = useMemo(() => {
    const set = new Set();
    data.forEach((r) => {
      const est = r.estado_nombre ?? r.estped_nombre ?? r.id_estado_pedido ?? "";
      if (est !== "") set.add(String(est));
    });
    return Array.from(set).sort();
  }, [data]);

  const filtrados = useMemo(() => {
    const qn = lower(q);
    return data.filter((r) => {
      const id        = String(r.id_pedido ?? r.id ?? "");
      const inicio    = r.ped_fecha_hora_ini ?? r.ped_fecha ?? r.fecha ?? null;
      const mesa      = r.mesa_numero ?? r.ms_numero ?? r.id_mesa ?? null;
      const empleado  = r.empleado_nombre ?? r.emp_nombre ?? r.id_empleado ?? "";
      const tipo      = r.tipo_nombre ?? r.tipped_nombre ?? r.id_tipo_pedido ?? "";
      const estado    = r.estado_nombre ?? r.estped_nombre ?? r.id_estado_pedido ?? "";

      const passQ =
        !qn ||
        lower(id).includes(qn) ||
        lower(String(mesa ?? "")).includes(qn) ||
        lower(empleado).includes(qn) ||
        lower(tipo).includes(qn) ||
        lower(String(estado)).includes(qn);

      if (!passQ) return false;
      if (fMesa && String(mesa) !== String(fMesa)) return false;
      if (fEmp && String(empleado) !== String(fEmp)) return false;
      if (fTipo && String(tipo) !== String(fTipo)) return false;
      if (fEstado && String(estado) !== String(fEstado)) return false;
      return true;
    });
  }, [data, q, fMesa, fEmp, fTipo, fEstado]);

  const ordenados = useMemo(() => {
    const arr = [...filtrados];
    if (orderBy === "fecha_desc") {
      arr.sort(
        (a, b) =>
          (parseDate(b.ped_fecha_hora_ini)?.getTime() ?? 0) -
          (parseDate(a.ped_fecha_hora_ini)?.getTime() ?? 0)
      );
    } else {
      arr.sort(
        (a, b) =>
          (parseDate(a.ped_fecha_hora_ini)?.getTime() ?? 0) -
          (parseDate(b.ped_fecha_hora_ini)?.getTime() ?? 0)
      );
    }
    return arr;
  }, [filtrados, orderBy]);

  useEffect(() => {
    setPage(1);
  }, [q, fMesa, fEmp, fTipo, fEstado, orderBy, pageSize]);

  const totalRows = ordenados.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const rows = paginate(ordenados, pageSafe, pageSize);

  return (
    <DashboardLayout>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{margin:0,color:"#fff"}}>Pedidos</h2>
        <Link to="/pedidos/registrar" className="btn btn-primary">Registrar pedido</Link>
      </div>

      {msg && <p style={{color:"#facc15", whiteSpace:"pre-wrap"}}>{msg}</p>}

      {/* Filtros */}
      <div className="filters">
        <input
          className="ctl"
          placeholder="Buscar (ID, mesa, empleado, tipo, estado)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select className="ctl" value={fMesa} onChange={(e) => setFMesa(e.target.value)}>
          <option value="">Mesa (todas)</option>
          {opcionesMesa.map((m) => (
            <option key={m} value={m}>Mesa {m}</option>
          ))}
        </select>

        <select className="ctl" value={fEmp} onChange={(e) => setFEmp(e.target.value)}>
          <option value="">Empleado (todos)</option>
          {opcionesEmpleado.map((emp) => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>

        <select className="ctl" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
          <option value="">Tipo (todos)</option>
          {opcionesTipo.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select className="ctl" value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
          <option value="">Estado (todos)</option>
          {opcionesEstado.map((est) => (
            <option key={est} value={est}>{est}</option>
          ))}
        </select>

        <select
          className="ctl"
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value)}
          title="Orden por fecha de inicio"
        >
          <option value="fecha_desc">Fecha (más cerca → más lejos)</option>
          <option value="fecha_asc">Fecha (más lejos → más cerca)</option>
        </select>

        <div className="spacer" />
        <select
          className="ctl"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{ width: 90 }}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>{n}/pág</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Inicio</th>
                  <th>Mesa</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th style={{ width: 260 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan="5" style={{textAlign:"center"}}>Sin registros</td></tr>
                )}
                {rows.map((r, idx) => {
                  const id = r.id_pedido ?? r.id ?? idx;
                  const inicio = r.ped_fecha_hora_ini ?? r.ped_fecha ?? r.fecha ?? null;
                  const mesa = r.mesa_numero ?? r.ms_numero ?? r.id_mesa ?? null;
                  const tipo = r.tipo_nombre ?? r.tipped_nombre ?? r.id_tipo_pedido ?? "-";
                  const estado = r.estado_nombre ?? r.estped_nombre ?? r.id_estado_pedido ?? "-";

                  const terminal = isTerminal(r);
                  const entregado = isEntregado(r);

                  return (
                    <tr key={id}>
                      <td>{fmtDate(inicio)}</td>
                      <td>{mesa ? `Mesa ${mesa}` : "-"}</td>
                      <td>{tipo}</td>
                      <td>{String(estado)}</td>
                      <td>
                        <div className="acciones-cell">
                          {/* Ver siempre disponible */}
                          <Link
                            to={`/pedidos/${id}`}
                            className="btn btn-secondary"
                            title="Ver pedido"
                          >
                            👁
                          </Link>

                          {/* Editar sólo si NO está finalizado/cancelado */}
                          {!terminal && (
                            <Link
                              to={`/pedidos/${id}/editar`}
                              className="btn btn-secondary"
                              title="Editar pedido"
                            >
                              ✏
                            </Link>
                          )}

                          {/* Agregar ítem sólo si NO está finalizado/cancelado */}
                          {!terminal && (
                            <button
                              onClick={() => abrirAgregarItem(r)}
                              className="btn btn-success"
                              title="Agregar ítem"
                            >
                              ➕
                            </button>
                          )}

                          {/* Entregar sólo si NO está terminado ni entregado */}
                          {!terminal && !entregado && (
                            <button
                              onClick={() => {
                                const ok = window.confirm(
                                  "El pedido pasará a ENTREGADO (se descontará stock). ¿Continuar?"
                                );
                                if (ok) marcarEntregado(r);
                              }}
                              className="btn btn-info"
                              title="Marcar como ENTREGADO"
                            >
                              📦
                            </button>
                          )}

                          {/* Finalizar sólo si NO está finalizado/cancelado */}
                          {!terminal && (
                            <button
                              onClick={() => {
                                const ok = window.confirm(
                                  "El pedido pasará a FINALIZADO (no se descuenta stock). ¿Continuar?"
                                );
                                if (ok) marcarFinalizado(r);
                              }}
                              className="btn btn-primary"
                              title="Marcar como FINALIZADO"
                            >
                              ✅
                            </button>
                          )}

                          {/* Cancelar sólo si NO está finalizado/cancelado */}
                          {!terminal && (
                            <button
                              onClick={() => abrirCancelar(r)}
                              className="btn btn-danger"
                              title="Cancelar pedido"
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="paginate">
            <button className="btn" onClick={() => setPage(1)} disabled={pageSafe <= 1}>«</button>
            <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1}>‹</button>
            <span>Página {pageSafe} de {totalPages}</span>
            <button className="btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}>›</button>
            <button className="btn" onClick={() => setPage(totalPages)} disabled={pageSafe >= totalPages}>»</button>
          </div>
        </>
      )}

      {/* Modal Agregar Ítem */}
      {addOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{marginTop:0}}>Agregar ítem al pedido #{addTarget?.id_pedido ?? addTarget?.id}</h3>

            <div className="row">
              <label>Plato</label>
              <select
                value={newItem.id_plato}
                onChange={(e) => setNewItem((p) => ({ ...p, id_plato: e.target.value }))}
              >
                <option value="">— Seleccioná plato (con receta) —</option>
                {platos
                  .filter((p) => platosConReceta.has(getPlatoId(p)))
                  .map((p) => (
                    <option key={getPlatoId(p)} value={getPlatoId(p)}>
                      {p.plt_nombre ?? p.nombre ?? `#${getPlatoId(p)}`}
                    </option>
                  ))}
              </select>
            </div>

            <div className="row">
              <label>Cantidad</label>
              <input
                type="number"
                min="1"
                value={newItem.cantidad}
                onChange={(e) => setNewItem((p) => ({ ...p, cantidad: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="row">
              <label>Acción inmediata</label>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <input
                  id="chkDescontarAhora"
                  type="checkbox"
                  checked={descontarAhora}
                  onChange={(e) => setDescontarAhora(e.target.checked)}
                />
                <label htmlFor="chkDescontarAhora" style={{cursor:"pointer"}}>
                  Descontar stock ahora <small>(solo este ítem)</small>
                </label>
              </div>
            </div>

            {addMsg && <pre style={{whiteSpace:"pre-wrap", color:"#fca5a5"}}>{addMsg}</pre>}

            <div style={{display:"flex", gap:8, marginTop:12, flexWrap:"wrap"}}>
              <button className="btn btn-primary" onClick={confirmarAgregarItem}>Agregar</button>
              <button className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {cancelOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{marginTop:0}}>Cancelar pedido #{cancelTarget?.id_pedido ?? cancelTarget?.id}</h3>
            <p>Elegí cómo cancelar el pedido:</p>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  await marcarCancelado(cancelTarget, false);
                  setCancelOpen(false);
                }}
              >
                Cancelar <b>sin</b> restar stock
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  await marcarCancelado(cancelTarget, true);
                  setCancelOpen(false);
                }}
              >
                Cancelar <b>restando</b> stock
              </button>
              <button className="btn" onClick={() => setCancelOpen(false)}>Cerrar</button>
            </div>
          </div>
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
.btn-info { background:#38bdf8; color:#0b0b0b; border-color:#38bdf8; }

/* Filtros */
.filters { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:10px; }
.filters .ctl { background:#0f0f0f; color:#fff; border:1px solid #2a2a2a; border-radius:8px; padding:8px 10px; }
.filters .spacer { flex:1; }

.paginate { display:flex; gap:8px; align-items:center; justify-content:flex-end; margin-top:10px; }

/* Acciones dentro de la celda, como una "fila" de mesa */
.acciones-cell { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; z-index: 1000; }
.modal-card { background: #1b1b1e; color: #eaeaea; padding: 16px; border-radius: 12px; border: 1px solid #2a2a2a; max-width: 560px; width: 95%; box-shadow: 0 10px 30px rgba(0,0,0,.5); }
.row { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
.row label { width:180px; text-align:right; color:#d1d5db; }
select, input { flex:1; background:#0f0f0f; color:#fff; border:1px solid #2a2a2a; border-radius:8px; padding:10px 12px; }
`;

















