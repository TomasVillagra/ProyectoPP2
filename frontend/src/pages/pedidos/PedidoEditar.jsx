// src/pages/pedidos/PedidoEditar.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import PedidoFormRow from "../../components/pedidos/PedidoFormRow";
import PedidoDetalleRow from "../../components/pedidos/PedidoDetalleRow";
import "./PedidoEditar.css";

/* ===== util y catálogos ===== */
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
  s?.estped_nombre ??
  s?.nombre ??
  `Estado #${s?.id_estado_pedido ?? s?.id ?? "?"}`;
const tipoLabel = (t) =>
  t?.tipped_nombre ??
  t?.nombre ??
  `Tipo #${t?.id_tipo_pedido ?? t?.id ?? "?"}`;
const platoLabel = (p) => {
  const id = p?.id_plato ?? p?.id;
  const nombre = p?.plt_nombre ?? p?.nombre ?? `#${id}`;
  const precio = p?.plt_precio ?? p?.precio;
  return precio != null ? `${nombre} ($${Number(precio).toFixed(2)})` : nombre;
};
const getPlatoId = (p) => Number(p?.id_plato ?? p?.id);
const mesaEstadoNombre = (m) =>
  (m?.estado_mesa_nombre ?? m?.id_estado_mesa?.estms_nombre ?? "").toLowerCase();
const isMesaDisponible = (m) => mesaEstadoNombre(m) === "disponible";
const sanitizeInt = (raw) =>
  raw === "" || raw == null ? "" : String(raw).replace(/[^\d]/g, "");
const blockInvalidInt = (e) => {
  const invalid = ["-", "+", "e", "E", ".", ",", " "];
  if (invalid.includes(e.key)) e.preventDefault();
};
function toInputDateTime(val) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (!isNaN(d))
      return new Date(
        d.getTime() - d.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
    return String(val).slice(0, 16);
  } catch {
    return "";
  }
}

/* ===== recetas/platos/insumos para validación (misma lógica que registrar) ===== */
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

/* ===== reservas de stock por pedidos pendientes (MISMA LÓGICA QUE REGISTRAR) ===== */
function isPedidoAbierto(p) {
  const nombre = (p.estado_nombre ?? p.estped_nombre ?? p.estado ?? "")
    .toString()
    .toLowerCase();
  if (!nombre) return true;
  if (nombre.includes("cancel") || nombre.includes("entreg")) return false;
  return true;
}

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

/**
 * (comentado en tu código original)
 * Esta lógica ahora esta en el back,
 */
async function validarStockItem({ id_plato, cantidad }) {
  const platoId = Number(id_plato);
  const cantNueva = Number(cantidad);
  if (!platoId || !cantNueva) return null;

  const plato = await fetchPlato(platoId);
  const receta = await fetchRecetaDePlato(platoId);

  if (!plato && !receta) {
    return {
      platoId,
      motivo: "No se encontró stock ni receta para este plato.",
      faltantes: [],
    };
  }

  if (!receta) {
    const pedidosAbiertos = await fetchPedidosAbiertos();
    let capPlato = readPlatoStockField(plato);

    for (const ped of pedidosAbiertos) {
      const pid = ped.id_pedido ?? ped.id;
      if (!pid) continue;
      const dets = await fetchDetallesPedido(pid);
      for (const det of dets) {
        const detPlatoId = Number(
          det.id_plato ?? det.plato ?? det.plato_id ?? 0
        );
        if (detPlatoId !== platoId) continue;
        const q = getNumber(det.detped_cantidad ?? det.cantidad ?? 0);
        capPlato -= q;
      }
    }

    if (capPlato >= cantNueva) return null;

    return {
      platoId,
      motivo: "Stock insuficiente del plato (sin receta definida).",
      faltantes: [],
    };
  }

  const recetaId =
    receta.id_receta ?? receta.id ?? receta.receta_id ?? receta.rec_id ?? null;
  const detsReceta = recetaId ? await fetchDetallesReceta(recetaId) : [];
  if (!detsReceta.length) {
    const pedidosAbiertos = await fetchPedidosAbiertos();
    let capPlato = readPlatoStockField(plato);

    for (const ped of pedidosAbiertos) {
      const pid = ped.id_pedido ?? ped.id;
      if (!pid) continue;
      const dets = await fetchDetallesPedido(pid);
      for (const det of dets) {
        const detPlatoId = Number(
          det.id_plato ?? det.plato ?? det.plato_id ?? 0
        );
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

  let capPlato = readPlatoStockField(plato);
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

  function consumirCantidad(cant, recolectarFaltantes) {
    let restante = cant;

    const usarPlato = Math.min(capPlato, restante);
    capPlato -= usarPlato;
    restante -= usarPlato;

    if (restante <= 0) return null;

    const faltantes = [];
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
          faltantes.push({ nombre, requerido: req, disponible: disp });
        } else {
          return [
            {
              nombre: `Insumo #${insumoId}`,
              requerido: req,
              disponible: capInsumos[insumoId] ?? 0,
            },
          ];
        }
      }
    }

    if (faltantes.length) return faltantes;

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

  const pedidosAbiertos = await fetchPedidosAbiertos();
  for (const ped of pedidosAbiertos) {
    const pid = ped.id_pedido ?? ped.id;
    if (!pid) continue;
    const dets = await fetchDetallesPedido(pid);
    for (const det of dets) {
      const detPlatoId = Number(
        det.id_plato ?? det.plato ?? det.plato_id ?? 0
      );
      if (detPlatoId !== platoId) continue;
      const q = getNumber(det.detped_cantidad ?? det.cantidad ?? 0);
      if (!q) continue;
      consumirCantidad(q, false);
    }
  }

  const faltasNuevo = consumirCantidad(cantNueva, true);
  if (!faltasNuevo || !faltasNuevo.length) return null;

  return {
    platoId,
    motivo: "Stock insuficiente (plato + insumos) considerando pedidos abiertos.",
    faltantes: faltasNuevo,
  };
}

/* ===== componente ===== */
export default function PedidoEditar() {
  const { id } = useParams();
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
  const [estadoNombreActual, setEstadoNombreActual] = useState("");

  const isTerminal = ["finalizado", "cancelado"].includes(
    estadoNombreActual.toLowerCase()
  );
  const isEntregado = estadoNombreActual.toLowerCase() === "entregado";
  const isEnProceso = estadoNombreActual.toLowerCase() === "en proceso";

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
      const idEmp = data.id_empleado ?? data.id;
      setEmpleadoActual(data);
      setForm((p) => ({ ...p, id_empleado: String(idEmp || "") }));
    } catch {}
  };

  useEffect(() => {
    (async () => {
      const msgs = [];

      const [mesasArr, clientesArr, estadosArr, tiposArr, platosArr] =
        await Promise.all([
          fetchCatalog(["/api/mesas/", "/api/mesa/", "/api/mesas?limit=500"]),
          fetchCatalog([
            "/api/clientes/",
            "/api/cliente/",
            "/api/clientes?limit=500",
          ]),
          fetchCatalog([
            "/api/estado-pedidos/",
            "/api/estado_pedidos/",
            "/api/estados-pedido/",
          ]),
          fetchCatalog([
            "/api/tipo-pedidos/",
            "/api/tipo_pedidos/",
            "/api/tipos-pedido/",
          ]),
          fetchCatalog(["/api/platos/", "/api/plato/", "/api/platos?limit=1000"]),
        ]);

      setMesas(mesasArr);
      if (!mesasArr.length) msgs.push("No se pudieron cargar Mesas.");
      setClientes(clientesArr);
      if (!clientesArr.length)
        msgs.push("No se pudieron cargar Clientes.");
      setEstados(estadosArr);
      if (!estadosArr.length)
        msgs.push("No se pudieron cargar Estados de pedido.");
      setTipos(tiposArr);
      if (!tiposArr.length)
        msgs.push("No se pudieron cargar Tipos de pedido.");
      setPlatos(platosArr);
      if (!platosArr.length)
        msgs.push("No se pudieron cargar Platos.");

      const estMesaArr = await fetchCatalog([
        "/api/estados-mesa/",
        "/api/estado-mesas/",
      ]);
      setEstadosMesa(estMesaArr || []);

      const pedRes = await api.get(`/api/pedidos/${id}/`);
      const ped = pedRes.data;
      await getEmpleadoActual();

      const estNombre = String(
        ped.estado_nombre ?? ped.estado ?? ""
      ).toLowerCase();
      setEstadoNombreActual(estNombre);

      const estadoItem =
        estadosArr.find(
          (s) =>
            String(s.estped_nombre ?? s.nombre ?? "").toLowerCase() ===
            estNombre
        ) ||
        estadosArr.find(
          (s) =>
            Number(s.id_estado_pedido ?? s.id) ===
            Number(ped.id_estado_pedido)
        );

      setForm((p) => ({
        ...p,
        id_mesa: String(ped.id_mesa ?? ""),
        id_cliente: String(ped.id_cliente ?? ""),
        id_estado_pedido: String(
          estadoItem
            ? estadoItem.id_estado_pedido ?? estadoItem.id
            : ped.id_estado_pedido ?? ""
        ),
        id_tipo_pedido: String(ped.id_tipo_pedido ?? "1"),
        ped_descripcion: ped.ped_descripcion ?? "",
        ped_fecha_hora_ini: toInputDateTime(ped.ped_fecha_hora_ini) || "",
      }));

      let dets = ped.detalles;
      if (!Array.isArray(dets)) {
        const detRes = await api.get(
          `/api/detalle-pedidos/?id_pedido=${id}`
        );
        dets = normalize(detRes);
      }
      const rows = (dets || []).map((d) => ({
        id_plato: String(d.id_plato ?? d.plato ?? d.id ?? ""),
        detped_cantidad: String(d.detped_cantidad ?? d.cantidad ?? ""),
        _id_det: d.id_detalle_pedido ?? d.id ?? undefined,
        _min_cant: Number(d.detped_cantidad ?? d.cantidad ?? 0),
      }));
      setDetalles(
        rows.length ? rows : [{ id_plato: "", detped_cantidad: "" }]
      );

      const recetas = await fetchTodasLasRecetas();

      // 👉 Solo platos cuya receta tenga al menos 1 insumo
      const ids = new Set();

      for (const r of recetas) {
        const idPlato = pickIdPlatoFromReceta(r);
        const recetaId =
          r.id_receta ?? r.id ?? r.receta_id ?? r.rec_id ?? null;

        if (!idPlato || !recetaId) continue;

        // Traemos los detalles de la receta
        const dets = await fetchDetallesReceta(recetaId);

        // Solo aceptamos platos cuya receta tenga por lo menos un insumo
        if (Array.isArray(dets) && dets.length > 0) {
          ids.add(Number(idPlato));
        }
      }

      setPlatosConReceta(ids);


      setCatalogMsg(msgs);
    })();
  }, [id]);

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
    let newVal = name === "detped_cantidad" ? sanitizeInt(value) : value;

    if (name === "detped_cantidad" && isEntregado) {
      const prevRow = rows[idx];
      const min = Number(
        prevRow._min_cant ?? prevRow.detped_cantidad ?? 0
      );
      const numeric = Number(newVal || 0);
      if (prevRow._id_det && numeric < min) {
        newVal = String(min);
      }
    }

    rows[idx] = {
      ...rows[idx],
      [name]: newVal,
    };
    setDetalles(rows);
    setRowErrors(validateRows(rows));
  };

  const addRow = () =>
    setDetalles((p) => [
      ...p,
      { id_plato: "", detped_cantidad: "", _id_det: undefined, _min_cant: 0 },
    ]);

  const total = useMemo(() => {
    const getPrecio = (pid) => {
      const p = platos.find((pp) => getPlatoId(pp) === Number(pid));
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
      (s) => String(s.estped_nombre ?? s.nombre ?? "").toLowerCase() === n
    );
    return it?.id_estado_pedido ?? it?.id;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (isTerminal) {
      setMsg("Este pedido está Finalizado/Cancelado. No se puede editar.");
      return;
    }

    const detErrs = validateRows(detalles);
    setRowErrors(detErrs);
    if (Object.keys(detErrs).length) return;

    try {
      const validarPayload = {
        id_mesa: isParaLlevar
          ? null
          : form.id_mesa
          ? Number(form.id_mesa)
          : null,
        id_empleado: form.id_empleado
          ? Number(form.id_empleado)
          : null,
        id_cliente: form.id_cliente ? Number(form.id_cliente) : null,
        id_estado_pedido: Number(form.id_estado_pedido),
        id_tipo_pedido: Number(form.id_tipo_pedido),
        ped_descripcion: form.ped_descripcion || "",
        ped_fecha_hora_ini: form.ped_fecha_hora_ini,
        detalles: detalles.map((d) => ({
          id_plato: Number(d.id_plato),
          detped_cantidad: Number(d.detped_cantidad),
          _id_det: d._id_det ?? null,
          _min_cant: Number(d._min_cant || 0),
        })),
      };

      await api.post(
        `/api/pedidos/${id}/validar_stock_editar/`,
        validarPayload
      );
    } catch (err) {
      const resp = err?.response;
      if (resp?.data?.detail) {
        setMsg(resp.data.detail);
      } else {
        const apiMsg = resp?.data
          ? JSON.stringify(resp.data, null, 2)
          : "Error al validar stock";
        setMsg(`No se pudo validar el stock:\n${apiMsg}`);
      }
      return;
    }

    try {
      await api.put(`/api/pedidos/${id}/`, {
        id_mesa: isParaLlevar
          ? null
          : form.id_mesa
          ? Number(form.id_mesa)
          : null,
        id_empleado: form.id_empleado
          ? Number(form.id_empleado)
          : null,
        id_cliente: form.id_cliente ? Number(form.id_cliente) : null,
        id_estado_pedido: Number(form.id_estado_pedido),
        id_tipo_pedido: Number(form.id_tipo_pedido),
        ped_descripcion: form.ped_descripcion || "",
        ped_fecha_hora_ini: form.ped_fecha_hora_ini,
      });

      const existing = await api.get(
        `/api/detalle-pedidos/?id_pedido=${id}`
      );
      const rows = normalize(existing);
      await Promise.all(
        rows.map((r) =>
          api.delete(
            `/api/detalle-pedidos/${r.id_detalle_pedido || r.id}/`
          )
        )
      );
      await Promise.all(
        detalles.map((d) =>
          api.post(`/api/detalle-pedidos/`, {
            id_pedido: Number(id),
            id_plato: Number(d.id_plato),
            detped_cantidad: Number(d.detped_cantidad),
          })
        )
      );

      try {
        if (!isParaLlevar && form.id_mesa) {
          const idEntregado = getEstadoPedidoIdByName("entregado");
          const idEnProceso = getEstadoPedidoIdByName("en proceso");
          const idFinalizado = getEstadoPedidoIdByName("finalizado");
          const idCancelado = getEstadoPedidoIdByName("cancelado");
          const estadoId = Number(form.id_estado_pedido);

          if (estadoId === idEntregado || estadoId === idEnProceso) {
            const ocupadaId = getEstadoMesaId("ocupada");
            if (ocupadaId)
              await api.patch(`/api/mesas/${form.id_mesa}/`, {
                id_estado_mesa: Number(ocupadaId),
              });
          } else if (estadoId === idFinalizado || estadoId === idCancelado) {
            const disponibleId = getEstadoMesaId("disponible");
            if (disponibleId)
              await api.patch(`/api/mesas/${form.id_mesa}/`, {
                id_estado_mesa: Number(disponibleId),
              });
          }
        }
      } catch {}

      setMsg("Pedido actualizado");
      setTimeout(() => navigate("/pedidos"), 800);
    } catch (err) {
      const apiMsg = err?.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : "Error inesperado";
      setMsg(`No se pudo actualizar el pedido:\n${apiMsg}`);
    }
  };

  const platosFiltrados = platos.filter((p) =>
    platosConReceta.has(getPlatoId(p))
  );

  return (
    <DashboardLayout>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Editar Pedido</h2>

      {isTerminal && (
        <div
          style={{
            background: "#3a3a3c",
            color: "#f87171",
            padding: "10px 12px",
            borderRadius: 8,
            marginBottom: 12,
            border: "1px solid #4a0404",
          }}
        >
          Este pedido está <strong>{estadoNombreActual.toUpperCase()}</strong>.
          La edición está deshabilitada.
        </div>
      )}

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
        {/* Tipo */}
        <PedidoFormRow label="Tipo =" htmlFor="id_tipo_pedido">
          <select
            id="id_tipo_pedido"
            name="id_tipo_pedido"
            value={form.id_tipo_pedido}
            onChange={onChange}
            required
            disabled={isTerminal}
          >
            {tipos.map((t) => (
              <option
                key={t.id_tipo_pedido ?? t.id}
                value={t.id_tipo_pedido ?? t.id}
              >
                {tipoLabel(t)}
              </option>
            ))}
          </select>
        </PedidoFormRow>

        {/* Mesa */}
        <PedidoFormRow label="Mesa =" htmlFor="id_mesa">
          {isParaLlevar ? (
            <input value="(No aplica: Para llevar)" disabled />
          ) : (
            <select
              id="id_mesa"
              name="id_mesa"
              value={form.id_mesa}
              onChange={onChange}
              disabled={isTerminal}
            >
              <option value="">— Seleccioná mesa —</option>
              {mesas
                .filter(
                  (m) =>
                    isMesaDisponible(m) ||
                    String(m.id_mesa ?? m.id) === form.id_mesa
                )
                .map((m) => (
                  <option
                    key={m.id_mesa ?? m.id}
                    value={m.id_mesa ?? m.id}
                  >
                    {mesaLabel(m)}
                  </option>
                ))}
            </select>
          )}
        </PedidoFormRow>

        {/* Empleado */}
        <PedidoFormRow label="Empleado =">
          <input
            value={empleadoActual ? empleadoLabel(empleadoActual) : "—"}
            disabled
          />
        </PedidoFormRow>

        {/* Cliente */}
        <PedidoFormRow label="Cliente =" htmlFor="id_cliente">
          <select
            id="id_cliente"
            name="id_cliente"
            value={form.id_cliente}
            onChange={onChange}
            disabled={isTerminal || isEntregado || isEnProceso}
          >
            <option value="">— Seleccioná cliente —</option>
            {clientes.map((c) => (
              <option
                key={c.id_cliente ?? c.id}
                value={c.id_cliente ?? c.id}
              >
                {clienteLabel(c)}
              </option>
            ))}
          </select>
        </PedidoFormRow>

        {/* Estado */}
        <PedidoFormRow label="Estado =" htmlFor="id_estado_pedido">
          <select
            id="id_estado_pedido"
            name="id_estado_pedido"
            value={form.id_estado_pedido}
            onChange={onChange}
            disabled={isTerminal || isEntregado || isEnProceso}
            required
          >
            <option value="">— Seleccioná estado —</option>
            {estados.map((s) => (
              <option
                key={s.id_estado_pedido ?? s.id}
                value={s.id_estado_pedido ?? s.id}
              >
                {estadoLabel(s)}
              </option>
            ))}
          </select>
        </PedidoFormRow>

        {/* Fecha/hora inicio */}
        <PedidoFormRow
          label="Fecha y hora de inicio ="
          htmlFor="ped_fecha_hora_ini"
        >
          <input
            type="datetime-local"
            id="ped_fecha_hora_ini"
            name="ped_fecha_hora_ini"
            value={form.ped_fecha_hora_ini}
            onChange={onChange}
            required
            disabled={isTerminal}
          />
        </PedidoFormRow>

        {/* Descripción */}
        <PedidoFormRow
          label="Descripción ="
          htmlFor="ped_descripcion"
        >
          <textarea
            id="ped_descripcion"
            name="ped_descripcion"
            rows={3}
            value={form.ped_descripcion}
            onChange={onChange}
            disabled={isTerminal}
          />
        </PedidoFormRow>

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
                const opcionesPlatos = platosFiltrados.filter((p) => {
                  const idp = getPlatoId(p);
                  if (!idp) return false;
                  if (Number(row.id_plato) === idp) return true;
                  return !usados.has(idp);
                });

                const opciones = opcionesPlatos.map((p) => ({
                  value: getPlatoId(p),
                  label: platoLabel(p),
                }));

                const esDetalleOriginal = !!row._id_det;

                const disableSelect =
                  isTerminal || (isEntregado && esDetalleOriginal);
                const disableCantidad =
                  isTerminal || (isEntregado && esDetalleOriginal);
                const disableRemove =
                  detalles.length === 1 ||
                  isTerminal ||
                  (isEntregado && esDetalleOriginal);
                const showPlusButton =
                  isEntregado && esDetalleOriginal;

                return (
                  <PedidoDetalleRow
                    key={idx}
                    row={row}
                    idx={idx}
                    error={e}
                    opciones={opciones}
                    onRowChange={onRowChange}
                    onRemove={(i) =>
                      setDetalles((p) => p.filter((_, j) => j !== i))
                    }
                    blockInvalidInt={blockInvalidInt}
                    disableSelect={disableSelect}
                    disableCantidad={disableCantidad}
                    disableRemove={disableRemove}
                    showPlusButton={showPlusButton}
                    onPlusOne={() => {
                      const actual = Number(row.detped_cantidad || 0);
                      const nueva = actual + 1;
                      onRowChange(
                        idx,
                        "detped_cantidad",
                        String(nueva)
                      );
                    }}
                  />
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
            onClick={addRow}
            disabled={isTerminal}
          >
            Agregar renglón
          </button>
          <div style={{ color: "#eaeaea" }}>
            Total estimado: <strong>${total.toFixed(2)}</strong>
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isTerminal}
          >
            Guardar cambios
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
    </DashboardLayout>
  );
}














