import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ===== util comunes ===== */
function normalize(resp) {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}
async function fetchCatalog(candidates) {
  for (const url of candidates) {
    try {
      const res = await api.get(url);
      const arr = normalize(res);
      if (Array.isArray(arr)) return arr;
    } catch {}
  }
  return [];
}
const mesaEstadoNombre = (m) =>
  (m?.estado_mesa_nombre ?? m?.id_estado_mesa?.estms_nombre ?? "").toLowerCase();
const isMesaDisponible = (m) => mesaEstadoNombre(m) === "disponible";
const mesaLabel = (m) =>
  m?.ms_numero != null
    ? `Mesa ${m.ms_numero}`
    : m?.numero != null
    ? `Mesa ${m.numero}`
    : `#${m?.id_mesa ?? m?.id ?? "?"}`;
const empleadoLabel = (e) => {
  const nom = [e?.emp_nombre ?? e?.nombre, e?.emp_apellido ?? e?.apellido]
    .filter(Boolean)
    .join(" ");
  return nom || `Empleado #${e?.id_empleado ?? e?.id ?? "?"}`;
};
const clienteLabel = (c) =>
  c?.cli_nombre ?? c?.nombre ?? `Cliente #${c?.id_cliente ?? c?.id ?? "?"}`;
const estadoLabel = (s) =>
  s?.estped_nombre ?? s?.nombre ?? `Estado #${s?.id_estado_pedido ?? s?.id ?? "?"}`;
const tipoLabel = (t) =>
  t?.tipped_nombre ?? t?.nombre ?? `Tipo #${t?.id_tipo_pedido ?? t?.id ?? "?"}`;
const platoLabel = (p) => {
  const id = p?.id_plato ?? p?.id;
  const nombre = p?.plt_nombre ?? p?.nombre ?? `#${id}`;
  const precio = p?.plt_precio ?? p?.precio;
  return precio != null ? `${nombre} ($${Number(precio).toFixed(2)})` : nombre;
};
function nowInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
const getPlatoId = (p) => Number(p?.id_plato ?? p?.id);
const sanitizeInt = (raw) =>
  raw === "" || raw == null ? "" : String(raw).replace(/[^\d]/g, "");
const blockInvalidInt = (e) => {
  const invalid = ["-", "+", "e", "E", ".", ",", " "];
  if (invalid.includes(e.key)) e.preventDefault();
};

const getNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const readPlatoStockField = (p) =>
  getNumber(p?.plt_stock ?? p?.stock ?? p?.stock_actual ?? 0);
const readInsumoStockField = (i) =>
  getNumber(
    i?.ins_stock_actual ?? i?.ins_stock ?? i?.stock_actual ?? i?.stock ?? 0
  );
const readRecetaCantPorPlato = (det) =>
  getNumber(
    det?.cantidad ??
      det?.ri_cantidad ??
      det?.detrec_cantidad ??
      det?.insumo_cantidad ??
      0
  );

/* ===== recetas/platos/insumos para validación de stock ===== */
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
async function fetchPlato(platoId) {
  const urls = [
    `/api/platos/${platoId}/`,
    `/api/plato/${platoId}/`,
    `/api/platos?id=${platoId}`,
  ];
  for (const u of urls) {
    try {
      const { data } = await api.get(u);
      return Array.isArray(data) ? data[0] : data;
    } catch {}
  }
  return null;
}
async function fetchRecetaDePlato(platoId) {
  const urls = [
    `/api/recetas/?id_plato=${platoId}`,
    `/api/receta/?id_plato=${platoId}`,
    `/api/recetas/plato/${platoId}/`,
  ];
  for (const u of urls) {
    try {
      const res = await api.get(u);
      const list = normalize(res);
      if (Array.isArray(list) && list.length) return list[0];
      if (res?.data && !Array.isArray(res.data)) return res.data;
    } catch {}
  }
  return null;
}
async function fetchDetallesReceta(recetaId) {
  const urls = [
    `/api/recetas/${recetaId}/insumos/`,
    `/api/receta/${recetaId}/insumos/`,
    `/api/recetas-detalle/?id_receta=${recetaId}`,
    `/api/detalle-recetas/?id_receta=${recetaId}`,
  ];
  for (const u of urls) {
    try {
      const res = await api.get(u);
      const list = normalize(res);
      if (Array.isArray(list)) return list;
    } catch {}
  }
  return [];
}
async function fetchInsumo(insumoId) {
  const urls = [
    `/api/insumos/${insumoId}/`,
    `/api/insumo/${insumoId}/`,
    `/api/insumos?id=${insumoId}`,
  ];
  for (const u of urls) {
    try {
      const { data } = await api.get(u);
      return Array.isArray(data) ? data[0] : data;
    } catch {}
  }
  return null;
}

/* ===== reservas de stock por pedidos pendientes ===== */
/** Devuelve true si el pedido está "abierto" (no entregado ni cancelado) */
function isPedidoAbierto(p) {
  const nombre = (p.estado_nombre ?? p.estped_nombre ?? p.estado ?? "")
    .toString()
    .toLowerCase();
  if (!nombre) return true;
  if (nombre.includes("cancel") || nombre.includes("entreg")) return false;
  return true;
}

/** Trae pedidos abiertos (que reservan stock) */
async function fetchPedidosAbiertos() {
  const urls = ["/api/pedidos/", "/api/pedido/"];
  for (const u of urls) {
    try {
      const res = await api.get(u);
      const list = normalize(res);
      if (Array.isArray(list)) {
        return list.filter(isPedidoAbierto);
      }
    } catch {}
  }
  return [];
}

/** Trae detalles de un pedido */
async function fetchDetallesPedido(pedidoId) {
  const urls = [
    `/api/detalle-pedidos/?id_pedido=${pedidoId}`,
    `/api/detalle_pedidos/?id_pedido=${pedidoId}`,
    `/api/pedidos/${pedidoId}/detalles/`,
  ];
  for (const u of urls) {
    try {
      const res = await api.get(u);
      const list = normalize(res);
      if (Array.isArray(list)) return list;
    } catch {}
  }
  return [];
}

/** Valida un ítem con lógica "mixta":
 *  1) Primero usa el stock del PLATO.
 *  2) Si no alcanza, el resto lo cubre con INSUMOS de la receta.
 *  3) Lo hace considerando también los pedidos ABIERTOS que ya reservan stock.
 */
async function validarStockItem({ id_plato, cantidad }) {
  const platoId = Number(id_plato);
  const cantNueva = Number(cantidad);
  if (!platoId || !cantNueva) return null;

  // 1) Plato y receta
  const plato = await fetchPlato(platoId);
  const receta = await fetchRecetaDePlato(platoId);

  // Si no hay plato ni receta, no se puede validar nada
  if (!plato && !receta) {
    return {
      platoId,
      motivo: "No se encontró stock ni receta para este plato.",
      faltantes: [],
    };
  }

  // ===== CASO SIN RECETA: sólo descuenta platos =====
  if (!receta) {
    const pedidosAbiertos = await fetchPedidosAbiertos();
    let capPlato = readPlatoStockField(plato); // capacidad de platos disponibles

    for (const ped of pedidosAbiertos) {
      const pid = ped.id_pedido ?? ped.id;
      if (!pid) continue;
      const dets = await fetchDetallesPedido(pid);
      for (const det of dets) {
        const detPlatoId = Number(det.id_plato ?? det.plato ?? det.plato_id ?? 0);
        if (detPlatoId !== platoId) continue;
        const q = getNumber(det.detped_cantidad ?? det.cantidad ?? 0);
        capPlato -= q; // restamos platos para pedidos abiertos
      }
    }

    if (capPlato >= cantNueva) return null;

    return {
      platoId,
      motivo: "Stock insuficiente del plato (sin receta definida).",
      faltantes: [],
    };
  }

  // ===== CASO CON RECETA: mezcla platos + insumos =====

  // Detalle de receta (insumos que usa el plato)
  const recetaId =
    receta.id_receta ?? receta.id ?? receta.receta_id ?? receta.rec_id ?? null;
  const detsReceta = recetaId ? await fetchDetallesReceta(recetaId) : [];
  if (!detsReceta.length) {
    // Hay receta pero sin insumos cargados
    const pedidosAbiertos = await fetchPedidosAbiertos();
    let capPlato = readPlatoStockField(plato);

    for (const ped of pedidosAbiertos) {
      const pid = ped.id_pedido ?? ped.id;
      if (!pid) continue;
      const dets = await fetchDetallesPedido(pid);
      for (const det of dets) {
        const detPlatoId = Number(det.id_plato ?? det.plato ?? det.plato_id ?? 0);
        if (detPlatoId !== platoId) continue;
        const q = getNumber(det.detped_cantidad ?? det.cantidad ?? 0);
        capPlato -= q;
      }
    }

    if (capPlato >= cantNueva) return null;
    return {
      platoId,
      motivo: "Stock insuficiente del plato (receta sin insumos).",
      faltantes: [],
    };
  }

  // 2) Cargar capacidades: stock del plato y de los insumos
  let capPlato = readPlatoStockField(plato); // platos posibles
  const capInsumos = {};
  const insumoInfo = {};

  for (const det of detsReceta) {
    const insumoId = Number(
      det.id_insumo ?? det.insumo ?? det.insumo_id ?? det.id ?? 0
    );
    if (!insumoId) continue;
    if (!(insumoId in capInsumos)) {
      const ins = await fetchInsumo(insumoId);
      insumoInfo[insumoId] = ins;
      capInsumos[insumoId] = readInsumoStockField(ins);
    }
  }

  // Helper para consumir una cantidad de platos (primero de platos, luego de insumos)
  function consumirCantidad(cant, recolectarFaltantes) {
    let restante = cant;

    // 1) consumir desde stock de plato
    const usarPlato = Math.min(capPlato, restante);
    capPlato -= usarPlato;
    restante -= usarPlato;

    if (restante <= 0) return null; // todo cubierto con platos

    // 2) consumir desde insumos para 'restante' platos
    const faltantes = [];
    // Chequeo previo: ver si hay insumos suficientes
    for (const det of detsReceta) {
      const insumoId = Number(
        det.id_insumo ?? det.insumo ?? det.insumo_id ?? det.id ?? 0
      );
      if (!insumoId) continue;
      const porPlato = readRecetaCantPorPlato(det);
      const req = restante * porPlato;
      const disp = capInsumos[insumoId] ?? 0;
      if (disp < req) {
        if (recolectarFaltantes) {
          const ins = insumoInfo[insumoId];
          const nombre =
            ins?.ins_nombre ?? ins?.nombre ?? `Insumo #${insumoId}`;
          faltantes.push({
            nombre,
            requerido: req,
            disponible: disp,
          });
        } else {
          // si no recolectamos, igual marcamos que no alcanza
          return [{ nombre: `Insumo #${insumoId}`, requerido: req, disponible: capInsumos[insumoId] ?? 0 }];
        }
      }
    }

    if (faltantes.length) return faltantes;

    // Si alcanzan, restamos definitivamente
    for (const det of detsReceta) {
      const insumoId = Number(
        det.id_insumo ?? det.insumo ?? det.insumo_id ?? det.id ?? 0
      );
      if (!insumoId) continue;
      const porPlato = readRecetaCantPorPlato(det);
      const req = restante * porPlato;
      capInsumos[insumoId] = (capInsumos[insumoId] ?? 0) - req;
    }

    return null;
  }

  // 3) Aplicar la lógica de consumo a los pedidos ABIERTOS primero
  const pedidosAbiertos = await fetchPedidosAbiertos();
  for (const ped of pedidosAbiertos) {
    const pid = ped.id_pedido ?? ped.id;
    if (!pid) continue;
    const dets = await fetchDetallesPedido(pid);
    for (const det of dets) {
      const detPlatoId = Number(det.id_plato ?? det.plato ?? det.plato_id ?? 0);
      if (detPlatoId !== platoId) continue;
      const q = getNumber(det.detped_cantidad ?? det.cantidad ?? 0);
      if (!q) continue;
      // Para pedidos ya existentes NO queremos cortar aunque "falten" insumos,
      // asumimos que ya fueron aceptados. Sólo consumimos capacidad.
      consumirCantidad(q, false);
    }
  }

  // 4) Intentar consumir para EL NUEVO pedido
  const faltasNuevo = consumirCantidad(cantNueva, true);
  if (!faltasNuevo || !faltasNuevo.length) {
    // Alcanzó usando primero platos y luego insumos
    return null;
  }

  return {
    platoId,
    motivo: "Stock insuficiente (plato + insumos) considerando pedidos abiertos.",
    faltantes: faltasNuevo,
  };
}

/* ===== componente ===== */
export default function PedidoRegistrar() {
  const navigate = useNavigate();

  const [mesas, setMesas] = useState([]);
  const [empleadoActual, setEmpleadoActual] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [estadosMesa, setEstadosMesa] = useState([]);
  const [platosConReceta, setPlatosConReceta] = useState(new Set());

  const [form, setForm] = useState({
    id_mesa: "",
    id_empleado: "",
    id_cliente: "",
    id_estado_pedido: "",
    id_tipo_pedido: "1",
    ped_descripcion: "",
    ped_fecha_hora_ini: "",
  });

  const [detalles, setDetalles] = useState([
    { id_plato: "", detped_cantidad: "" },
  ]);
  const [rowErrors, setRowErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [catalogMsg, setCatalogMsg] = useState([]);

  // Cliente SIEMPRE nuevo
  const [nuevoNombre, setNuevoNombre] = useState("");

  /* ===== detectar “Para llevar” en tipos ===== */
  const isParaLlevarById = (idTipo) => {
    const t = tipos.find(
      (x) => String(x.id_tipo_pedido ?? x.id) === String(idTipo)
    );
    const nombre = String(
      t?.tipped_nombre ?? t?.nombre ?? ""
    ).toLowerCase();
    return nombre.includes("llevar");
  };
  const isParaLlevar = isParaLlevarById(form.id_tipo_pedido);

  const getEmpleadoActual = async () => {
    try {
      const { data } = await api.get("/api/empleados/me/");
      const id = data.id_empleado ?? data.id;
      setEmpleadoActual(data);
      setForm((p) => ({ ...p, id_empleado: String(id || "") }));
    } catch {}
  };

  useEffect(() => {
    (async () => {
      const msgs = [];
      setForm((p) => ({ ...p, ped_fecha_hora_ini: nowInputValue() }));
      await getEmpleadoActual();

      const [mesasArr, clientesArr, estadosArr, tiposArr, platosArr] =
        await Promise.all([
          fetchCatalog(["/api/mesas/", "/api/mesas?limit=500"]),
          fetchCatalog(["/api/clientes/", "/api/clientes?limit=500"]),
          fetchCatalog(["/api/estados-pedido/"]),
          fetchCatalog(["/api/tipos-pedido/"]),
          fetchCatalog(["/api/platos/", "/api/platos?limit=1000"]),
        ]);

      setMesas(mesasArr);
      if (!mesasArr.length) msgs.push("No se pudieron cargar Mesas.");
      setClientes(clientesArr);
      if (!clientesArr.length)
        msgs.push("No se pudieron cargar Clientes.");
      setEstados(estadosArr);
      if (!estadosArr.length)
        msgs.push("No se pudieron cargar Estados.");
      setTipos(tiposArr);
      if (!tiposArr.length) msgs.push("No se pudieron cargar Tipos.");
      setPlatos(platosArr);
      if (!platosArr.length)
        msgs.push("No se pudieron cargar Platos.");

      const estMesaArr = await fetchCatalog([
        "/api/estados-mesa/",
        "/api/estado-mesas/",
      ]);
      setEstadosMesa(estMesaArr || []);

      // platos con receta
      const recetas = await fetchTodasLasRecetas();
      const ids = new Set();
      recetas.forEach((r) => {
        const idp = pickIdPlatoFromReceta(r);
        if (idp) ids.add(Number(idp));
      });
      setPlatosConReceta(ids);

      // Estado por defecto: En Proceso
      const enProc =
        estadosArr.find(
          (s) =>
            String(
              s.estped_nombre ?? s.nombre ?? ""
            ).toLowerCase() === "en proceso"
        ) ||
        estadosArr.find(
          (s) =>
            String(s.nombre ?? "").toLowerCase() === "en proceso"
        );
      if (enProc)
        setForm((p) => ({
          ...p,
          id_estado_pedido: String(
            enProc.id_estado_pedido ?? enProc.id
          ),
        }));

      setCatalogMsg(msgs);
    })();
  }, []);

  /* Validación rápida de filas */
  const validateRows = (rows) => {
    const out = {};
    rows.forEach((r, i) => {
      const e = {};
      if (!String(r.id_plato).trim())
        e.id_plato = "Seleccioná un plato.";
      else if (!platosConReceta.has(Number(r.id_plato)))
        e.id_plato = "El plato no tiene receta.";
      const q = Number(r.detped_cantidad);
      if (r.detped_cantidad === "" || !Number.isFinite(q) || q <= 0)
        e.detped_cantidad = "Cantidad > 0.";
      if (Object.keys(e).length) out[i] = e;
    });
    return out;
  };

  const onChange = (e) => {
    const { name, value } = e.target;

    // si cambia el tipo a “para llevar”, limpiar mesa
    if (name === "id_tipo_pedido") {
      const v = sanitizeInt(value);
      const willBeParaLlevar = (() => {
        const t = tipos.find(
          (x) => String(x.id_tipo_pedido ?? x.id) === String(v)
        );
        const nombre = String(
          t?.tipped_nombre ?? t?.nombre ?? ""
        ).toLowerCase();
        return nombre.includes("llevar");
      })();
      setForm((p) => ({
        ...p,
        id_tipo_pedido: v,
        id_mesa: willBeParaLlevar ? "" : p.id_mesa,
      }));
      return;
    }

    const v = [
      "id_mesa",
      "id_empleado",
      "id_cliente",
      "id_estado_pedido",
      "id_tipo_pedido",
    ].includes(name)
      ? sanitizeInt(value)
      : value;
    setForm((p) => ({ ...p, [name]: v }));
  };

  const onRowChange = (idx, name, value) => {
    const rows = [...detalles];
    rows[idx] = {
      ...rows[idx],
      [name]: name === "detped_cantidad" ? sanitizeInt(value) : value,
    };
    setDetalles(rows);
    setRowErrors(validateRows(rows));
  };
  const addRow = () =>
    setDetalles((p) => [...p, { id_plato: "", detped_cantidad: "" }]);
  const removeRow = (idx) => {
    setDetalles((p) => p.filter((_, i) => i !== idx));
    setRowErrors((prev) => {
      const n = { ...prev };
      delete n[idx];
      return n;
    });
  };

  const total = useMemo(() => {
    const getPrecio = (pid) => {
      const p = platos.find(
        (pp) => (pp.id_plato ?? pp.id) === Number(pid)
      );
      return Number(p?.plt_precio ?? p?.precio ?? 0);
    };
    return detalles.reduce((acc, r) => {
      const q = Number(r.detped_cantidad || 0);
      const price = getPrecio(r.id_plato);
      if (!Number.isFinite(q) || !Number.isFinite(price)) return acc;
      return acc + q * price;
    }, 0);
  }, [detalles, platos]);

  const getEstadoMesaId = (nombre) => {
    const n = String(nombre || "").toLowerCase();
    return estadosMesa.find(
      (e) => String(e.estms_nombre).toLowerCase() === n
    )?.id_estado_mesa;
  };
  const getEstadoPedidoIdByName = (nombre) => {
    const n = String(nombre || "").toLowerCase();
    const it = estados.find(
      (s) =>
        String(s.estped_nombre ?? s.nombre ?? "").toLowerCase() === n
    );
    return it?.id_estado_pedido ?? it?.id;
  };

  /* Cliente SIEMPRE nuevo */
  const createClienteRaw = async (nombre) => {
    const body = { cli_nombre: nombre };
    const { data } = await api.post("/api/clientes/", body);
    const id = data.id_cliente ?? data.id;
    const lista = await api.get("/api/clientes/");
    setClientes(normalize(lista));
    return id;
  };
  const createClienteNombreId = async (nombreOpcional = "") => {
    try {
      const id = await createClienteRaw(String(nombreOpcional));
      if (!nombreOpcional) {
        await api.patch(`/api/clientes/${id}/`, {
          cli_nombre: String(id),
        });
      }
      return id;
    } catch {
      const id = await createClienteRaw("TEMP");
      await api.patch(`/api/clientes/${id}/`, {
        cli_nombre: String(id),
      });
      return id;
    }
  };
  const ensureClienteId = async () => {
    const nombre = (nuevoNombre || "").trim();
    const id = await createClienteNombreId(nombre);
    return Number(id);
  };

  /* ===== Submit con validación de stock (incluye pedidos abiertos) ===== */
  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const detErrs = validateRows(detalles);
    setRowErrors(detErrs);
    if (Object.keys(detErrs).length) return;

    const faltas = [];
    for (const row of detalles) {
      const err = await validarStockItem({
        id_plato: row.id_plato,
        cantidad: row.detped_cantidad,
      });
      if (err) {
        const plato = platos.find(
          (pp) => (pp.id_plato ?? pp.id) === Number(err.platoId)
        );
        const nombrePlato =
          plato?.plt_nombre ?? plato?.nombre ?? `Plato #${err.platoId}`;
        const lines = [`• ${nombrePlato}: ${err.motivo}`];
        if (err.faltantes?.length) {
          err.faltantes.forEach((f) =>
            lines.push(
              `   - ${f.nombre}: requiere ${f.requerido}, disponible ${f.disponible}`
            )
          );
        }
        faltas.push(...lines);
      }
    }
    if (faltas.length) {
      setMsg(
        "Stock insuficiente para registrar el pedido:\n" +
          faltas.join("\n")
      );
      return;
    }

    const erroresCab = {};
    if (!isParaLlevar) {
      if (!form.id_mesa) erroresCab.id_mesa = "Seleccioná una mesa.";
    }
    if (!form.id_empleado)
      erroresCab.id_empleado = "No se reconoció el empleado actual.";
    if (!form.id_estado_pedido)
      erroresCab.id_estado_pedido =
        "No se pudo fijar 'En Proceso'.";
    if (!form.id_tipo_pedido)
      erroresCab.id_tipo_pedido = "Seleccioná tipo.";
    if (!form.ped_fecha_hora_ini)
      erroresCab.ped_fecha_hora_ini =
        "Completá fecha y hora de inicio.";
    if (Object.keys(erroresCab).length) {
      setMsg(
        "Revisá los campos:\n" +
          Object.entries(erroresCab)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join("\n")
      );
      return;
    }

    try {
      const idClienteFinal = await ensureClienteId();

      const payload = {
        id_mesa: isParaLlevar ? null : Number(form.id_mesa),
        id_empleado: Number(form.id_empleado),
        id_cliente: Number(idClienteFinal),
        id_estado_pedido: Number(form.id_estado_pedido),
        id_tipo_pedido: Number(form.id_tipo_pedido),
        ped_descripcion: form.ped_descripcion || "",
        ped_fecha_hora_ini: form.ped_fecha_hora_ini,
        detalles: detalles.map((d) => ({
          id_plato: Number(d.id_plato),
          detped_cantidad: Number(d.detped_cantidad),
        })),
      };

      const { data: created } = await api.post("/api/pedidos/", payload);
      const idPedido = created.id_pedido ?? created.id;

      await Promise.all(
        detalles.map((d) =>
          api.post(`/api/detalle-pedidos/`, {
            id_pedido: Number(idPedido),
            id_plato: Number(d.id_plato),
            detped_cantidad: Number(d.detped_cantidad),
          })
        )
      );

      // Estado de mesa: si no es para llevar
      try {
        if (!isParaLlevar && form.id_mesa) {
          const estadoId = Number(form.id_estado_pedido);
          const idEntregado = getEstadoPedidoIdByName("entregado");
          const idEnProceso = getEstadoPedidoIdByName("en proceso");
          if (estadoId === idEntregado || estadoId === idEnProceso) {
            const ocupadaId = getEstadoMesaId("ocupada");
            if (ocupadaId)
              await api.patch(`/api/mesas/${form.id_mesa}/`, {
                id_estado_mesa: Number(ocupadaId),
              });
          }
        }
      } catch {}

      setMsg("Pedido creado");
      setTimeout(() => navigate("/pedidos"), 700);
    } catch (err) {
      const apiMsg = err?.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : "Error inesperado";
      setMsg(`No se pudo crear el pedido:\n${apiMsg}`);
    }
  };

  const platosFiltrados = platos.filter((p) =>
    platosConReceta.has(getPlatoId(p))
  );

  return (
    <DashboardLayout>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Registrar Pedido</h2>
      {catalogMsg.length > 0 && (
        <div
          style={{
            background: "#3a3a3c",
            color: "#facc15",
            padding: "10px 12px",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {catalogMsg.map((m, i) => (
            <div key={i}>• {m}</div>
          ))}
        </div>
      )}
      {msg && <pre style={{ whiteSpace: "pre-wrap" }}>{msg}</pre>}

      <form onSubmit={onSubmit} className="form">
        {/* Tipo de pedido */}
        <div className="row">
          <label htmlFor="id_tipo_pedido">Tipo =</label>
          <select
            id="id_tipo_pedido"
            name="id_tipo_pedido"
            value={form.id_tipo_pedido}
            onChange={onChange}
            required
          >
            {tipos.map((t) => (
              <option key={t.id_tipo_pedido ?? t.id} value={t.id_tipo_pedido ?? t.id}>
                {tipoLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label htmlFor="id_mesa">Mesa =</label>
          {isParaLlevar ? (
            <input value="(No aplica: Para llevar)" disabled />
          ) : (
            <select
              id="id_mesa"
              name="id_mesa"
              value={form.id_mesa}
              onChange={onChange}
              required
            >
              <option value="">— Seleccioná mesa —</option>
              {mesas.filter(isMesaDisponible).map((m) => (
                <option key={m.id_mesa ?? m.id} value={m.id_mesa ?? m.id}>
                  {mesaLabel(m)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="row">
          <label>Empleado =</label>
          <input
            value={empleadoActual ? empleadoLabel(empleadoActual) : "—"}
            disabled
          />
        </div>

        {/* Cliente: SIEMPRE nuevo */}
        <div className="row">
          <label>Cliente =</label>
          <input
            type="text"
            placeholder="Nombre del nuevo cliente (opcional)."
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />
        </div>

        <div className="row">
          <label>Estado =</label>
          <input
            value={
              estadoLabel(
                estados.find(
                  (s) =>
                    String(s.id_estado_pedido ?? s.id) === form.id_estado_pedido
                )
              ) || "En Proceso"
            }
            disabled
          />
        </div>

        <div className="row">
          <label htmlFor="ped_fecha_hora_ini">Fecha y hora de inicio =</label>
          <input
            type="datetime-local"
            id="ped_fecha_hora_ini"
            name="ped_fecha_hora_ini"
            value={form.ped_fecha_hora_ini}
            onChange={onChange}
            required
          />
        </div>

        <div className="row">
          <label htmlFor="ped_descripcion">Descripción =</label>
          <textarea
            id="ped_descripcion"
            name="ped_descripcion"
            rows={3}
            value={form.ped_descripcion}
            onChange={onChange}
          />
        </div>

        {/* Detalles */}
        <h3 style={{ marginTop: 18, marginBottom: 8, color: "#fff" }}>
          Detalles
        </h3>
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th style={{ width: "60%" }}>Plato</th>
                <th style={{ width: "20%" }}>Cantidad</th>
                <th style={{ width: "20%" }}></th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((row, idx) => {
                const e = rowErrors[idx] || {};

                const usados = new Set(
                  detalles
                    .map((d, i2) =>
                      i2 === idx ? null : Number(d.id_plato)
                    )
                    .filter((v) => v)
                );
                const opciones = platosFiltrados.filter((p) => {
                  const idp = getPlatoId(p);
                  if (!idp) return false;
                  if (Number(row.id_plato) === idp) return true;
                  return !usados.has(idp);
                });

                return (
                  <tr key={idx}>
                    <td>
                      <select
                        value={row.id_plato}
                        onChange={(ev) =>
                          onRowChange(idx, "id_plato", ev.target.value)
                        }
                      >
                        <option value="">
                          — Seleccioná plato (con receta) —
                        </option>
                        {opciones.map((p) => (
                          <option key={getPlatoId(p)} value={getPlatoId(p)}>
                            {platoLabel(p)}
                          </option>
                        ))}
                      </select>
                      {e.id_plato && (
                        <small className="err-inline">
                          {e.id_plato}
                        </small>
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row.detped_cantidad}
                        onChange={(ev) =>
                          onRowChange(
                            idx,
                            "detped_cantidad",
                            ev.target.value
                          )
                        }
                        onKeyDown={blockInvalidInt}
                        placeholder="0"
                      />
                      {e.detped_cantidad && (
                        <small className="err-inline">
                          {e.detped_cantidad}
                        </small>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => removeRow(idx)}
                        disabled={detalles.length === 1}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 8,
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => addRow()}
          >
            Agregar renglón
          </button>
          <div style={{ color: "#eaeaea" }}>
            Total estimado: <strong>${total.toFixed(2)}</strong>
          </div>
        </div>

        <div>
          <button type="submit" className="btn btn-primary">
            Registrar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/pedidos")}
            style={{ marginLeft: 10 }}
          >
            Cancelar
          </button>
        </div>
      </form>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.form .row { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
.form label { min-width:220px; text-align:right; color:#d1d5db; }
textarea, input, select { width:100%; background:#0f0f0f; color:#fff; border:1px solid #2a2a2a; border-radius:8px; padding:10px 12px; }
.table-wrap { overflow:auto; margin-top:6px; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }
.err-inline { color:#fca5a5; font-size:12px; display:block; margin-top:6px; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;













