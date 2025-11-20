import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ==== helpers comunes de normalización ==== */
function normalizeResponse(respData) {
  if (Array.isArray(respData)) return respData;
  if (respData?.results && Array.isArray(respData.results)) return respData.results;
  if (respData?.data && Array.isArray(respData.data)) return respData.data;
  if (respData && typeof respData === "object") return [respData];
  return [];
}

/* ==== chequear si el plato está en pedidos para bloquear desactivado ==== */
async function platoEstaEnPedidos(idPlato) {
  const tryEndpoints = [
    "/api/pedido-detalles/",
    "/api/detalle-pedidos/",
    "/api/detalles-pedido/",
    "/api/pedidos-detalle/",
  ];
  for (const ep of tryEndpoints) {
    try {
      const { data } = await api.get(ep, {
        params: { id_plato: Number(idPlato), page_size: 1 },
      });
      const list = normalizeResponse(data);
      if (list.length > 0) return true;
    } catch {}
  }
  // fallback: leer pedidos con items embebidos
  try {
    const { data } = await api.get("/api/pedidos/", {
      params: { page_size: 1000 },
    });
    const pedidos = normalizeResponse(data);
    for (const p of pedidos) {
      const items = p.detalles || p.items || p.lineas || [];
      if (
        Array.isArray(items) &&
        items.some(
          (it) => Number(it.id_plato ?? it.plato) === Number(idPlato)
        )
      ) {
        return true;
      }
    }
  } catch {}
  return false;
}

/* ================================================================
   Helpers de recetas/insumos/stock para "Cargar stock"
   ================================================================ */
const getNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const readPlatoStockField = (p) =>
  getNumber(p?.plt_stock ?? p?.pla_stock ?? p?.stock ?? p?.stock_actual ?? 0);
const readInsumoStockField = (i) =>
  getNumber(i?.ins_stock_actual ?? i?.ins_stock ?? i?.stock_actual ?? i?.stock ?? 0);

const readRecetaCantPorPlato = (det) =>
  getNumber(
    det?.detr_cant_unid ??
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
      const list = normalizeResponse(res.data ?? res);
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
      const list = normalizeResponse(res.data ?? res);
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

/** Validación estricta de producción */
async function validarProduccion({ id_plato, cantidad }) {
  const platoId = Number(id_plato);
  const cant = Number(cantidad);
  if (!platoId || !cant)
    return { motivo: "Datos inválidos.", faltantes: [] };

  // 1) stock directo del plato
  const plato = await fetchPlato(platoId);
  if (plato) {
    const st = readPlatoStockField(plato);
    if (st >= cant) return null; // suficiente stock del plato
  }

  // 2) receta
  const receta = await fetchRecetaDePlato(platoId);
  if (!receta) {
    return {
      motivo: "El plato no tiene receta y su stock actual no alcanza.",
      faltantes: [],
    };
  }

  const recetaId =
    receta.id_receta ?? receta.id ?? receta.receta_id ?? receta.rec_id ?? null;
  const dets = recetaId ? await fetchDetallesReceta(recetaId) : [];

  // 3) pre-cálculo global
  const faltantes = [];
  for (const det of dets) {
    const insumoId = Number(
      det.id_insumo ?? det.insumo ?? det.id ?? det.insumo_id ?? 0
    );
    if (!insumoId) continue;

    const porPlato = readRecetaCantPorPlato(det);
    const requerido = porPlato * cant;

    if (requerido <= 0) continue;

    const ins = await fetchInsumo(insumoId);
    const disp = readInsumoStockField(ins);

    if (disp < requerido) {
      const nombre =
        ins?.ins_nombre ?? ins?.nombre ?? `Insumo #${insumoId}`;
      faltantes.push({
        id_insumo: insumoId,
        nombre,
        requerido,
        disponible: disp,
      });
    }
  }

  return faltantes.length
    ? { motivo: "Faltan insumos para producir.", faltantes }
    : null;
}

/** Intenta usar endpoint especializado si existe */
async function tryProducirEndpoint(platoId, cantidad) {
  try {
    await api.post(`/api/platos/${platoId}/producir/`, {
      cantidad: Number(cantidad),
    });
    return true;
  } catch {
    return false;
  }
}

/** PATCH helpers */
async function actualizarStockPlato(platoId, nuevoStock) {
  const payloadCandidates = [
    { plt_stock: Number(nuevoStock) },
    { pla_stock: Number(nuevoStock) },
    { stock: Number(nuevoStock) },
    { stock_actual: Number(nuevoStock) },
  ];
  for (const body of payloadCandidates) {
    try {
      await api.patch(`/api/platos/${platoId}/`, body);
      return true;
    } catch {}
  }
  throw new Error("No se pudo actualizar el stock del plato.");
}
async function actualizarStockInsumo(insumoId, nuevoStock) {
  const payloadCandidates = [
    { ins_stock_actual: Number(nuevoStock) },
    { stock: Number(nuevoStock) },
    { stock_actual: Number(nuevoStock) },
  ];
  for (const body of payloadCandidates) {
    try {
      await api.patch(`/api/insumos/${insumoId}/`, body);
      return true;
    } catch {}
  }
  throw new Error(
    `No se pudo actualizar el stock del insumo #${insumoId}.`
  );
}

/** Fallback seguro para producir */
async function producirPorFallback(platoId, cantidad) {
  const receta = await fetchRecetaDePlato(platoId);
  if (!receta)
    throw new Error(
      "El plato no tiene receta para producir por fallback."
    );
  const recetaId =
    receta.id_receta ?? receta.id ?? receta.receta_id ?? receta.rec_id ?? null;
  const dets = recetaId ? await fetchDetallesReceta(recetaId) : [];

  // pre-calcular requerimientos + disponibilidad
  const requeridos = [];
  for (const det of dets) {
    const insumoId = Number(
      det.id_insumo ?? det.insumo ?? det.id ?? det.insumo_id ?? 0
    );
    if (!insumoId) continue;

    const porPlato = readRecetaCantPorPlato(det);
    const req = porPlato * Number(cantidad);
    if (req <= 0) continue;

    const ins = await fetchInsumo(insumoId);
    const disp = readInsumoStockField(ins);

    if (disp - req < 0) {
      const nombre =
        ins?.ins_nombre ?? ins?.nombre ?? `Insumo #${insumoId}`;
      throw new Error(
        `Insumo insuficiente: ${nombre}. Requiere ${req}, disponible ${disp}.`
      );
    }

    requeridos.push({ insumoId, req, disp });
  }

  // aplicar descuentos (si todo OK)
  for (const r of requeridos) {
    await actualizarStockInsumo(r.insumoId, r.disp - r.req);
  }

  // sumar stock del plato
  const plato = await fetchPlato(platoId);
  const stockPlato = readPlatoStockField(plato);
  await actualizarStockPlato(platoId, stockPlato + Number(cantidad));
}

/* ==== Componente principal ==== */
export default function PlatosList() {
  const [data, setData] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [recetaPorPlato, setRecetaPorPlato] = useState({});

  // filtros
  const [qNombre, setQNombre] = useState("");
  const [fCategoria, setFCategoria] = useState("");
  const [fEstado, setFEstado] = useState("");

  // modal de producción
  const [showProd, setShowProd] = useState(false);
  const [prodPlato, setProdPlato] = useState(null);
  const [prodCantidad, setProdCantidad] = useState("");
  const [prodMsg, setProdMsg] = useState("");
  const [producing, setProducing] = useState(false);

  const fetchCategorias = async () => {
    try {
      const res = await api.get("/api/categorias-plato/");
      const list = normalizeResponse(res.data);
      setCategorias(list);
    } catch (e) {
      console.error("No se pudo cargar categorías", e);
    }
  };

  const catMap = useMemo(() => {
    const map = {};
    categorias.forEach((c) => {
      const id =
        c.id_categoria_plato ?? c.id_categoria ?? c.id ?? c.categoria_id;
      const nombre =
        c.catplt_nombre ??
        c.categoria_nombre ??
        c.cat_nombre ??
        c.nombre ??
        (id != null ? `#${id}` : "-");
      if (id != null) map[id] = nombre;
    });
    return map;
  }, [categorias]);

  const fetchPlatos = async () => {
    try {
      const res = await api.get("/api/platos/");
      const list = normalizeResponse(res.data) || [];
      setData(list);
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cargar platos");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecetas = async () => {
    try {
      const res = await api.get("/api/recetas/", {
        params: { page_size: 1000 },
      });
      const list = normalizeResponse(res.data);
      const map = {};
      list.forEach((r) => {
        const idPlato =
          r.id_plato ?? r?.plato?.id_plato ?? r?.plato;
        const idReceta = r.id_receta ?? r.id;
        if (idPlato && idReceta) {
          map[Number(idPlato)] = Number(idReceta);
        }
      });
      setRecetaPorPlato(map);
    } catch (e) {
      console.error("No se pudieron cargar recetas", e);
    }
  };

  useEffect(() => {
    Promise.all([fetchCategorias(), fetchPlatos(), fetchRecetas()]).catch(
      () => {}
    );
  }, []);

  const toggleEstado = async (plato) => {
    try {
      const id = plato.id_plato ?? plato.id;
      const idEstadoActual = String(
        plato.id_estado_plato ?? plato.id_estado ?? plato.estado ?? "1"
      );
      const nextEstado = idEstadoActual === "1" ? 2 : 1;

      // si voy a desactivar y está en pedidos -> bloquear
      if (nextEstado === 2) {
        const enPedidos = await platoEstaEnPedidos(id);
        if (enPedidos) {
          alert(
            "No se puede desactivar el plato: está asociado a uno o más pedidos."
          );
          return;
        }
      }

      await api.patch(`/api/platos/${id}/`, {
        id_estado_plato: nextEstado,
      });
      await fetchPlatos();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cambiar el estado.");
    }
  };

  /* ================== FILTROS APLICADOS ================== */
  const filteredData = useMemo(() => {
    return data.filter((r) => {
      const nombrePlano = (
        r.pla_nombre ??
        r.plt_nombre ??
        r.nombre ??
        ""
      ).toLowerCase();

      if (
        qNombre &&
        !nombrePlano.includes(qNombre.toLowerCase())
      )
        return false;

      const categoriaId =
        r.id_categoria_plato ??
        r.id_categoria ??
        r.categoria_id ??
        (r.categoria && typeof r.categoria === "object"
          ? r.categoria.id ?? r.categoria.id_categoria
          : null);

      if (
        fCategoria &&
        String(categoriaId) !== String(fCategoria)
      )
        return false;

      const idEstado = String(
        r.id_estado_plato ?? r.id_estado ?? r.estado ?? "1"
      );
      if (fEstado === "1" && idEstado !== "1") return false;
      if (fEstado === "2" && idEstado !== "2") return false;

      return true;
    });
  }, [data, qNombre, fCategoria, fEstado]);

  /* ================================================================
     Flujo “Cargar stock” (producir)
     ================================================================ */
  const abrirCargarStock = (plato) => {
    setProdPlato(plato);
    setProdCantidad("");
    setProdMsg("");
    setShowProd(true);
  };

  const producir = async () => {
    setProdMsg("");
    if (!prodPlato) return;
    const platoId = Number(prodPlato.id_plato ?? prodPlato.id);
    const cant = Number(prodCantidad);

    if (!Number.isFinite(cant) || cant <= 0) {
      setProdMsg("Ingresá una cantidad válida (> 0).");
      return;
    }

    try {
      setProducing(true);

      // 1) Validar stock (plato directo y receta→insumos)
      const err = await validarProduccion({
        id_plato: platoId,
        cantidad: cant,
      });
      if (err) {
        const líneas = [];
        líneas.push(err.motivo || "No se puede producir.");
        if (err.faltantes?.length) {
          err.faltantes.forEach((f) => {
            líneas.push(
              `- ${f.nombre}: requiere ${f.requerido}, disponible ${f.disponible}`
            );
          });
        }
        setProdMsg(líneas.join("\n"));
        setProducing(false);
        return;
      }

      // 2) Endpoint especializado
      const ok = await tryProducirEndpoint(platoId, cant);
      if (!ok) {
        // 3) Fallback seguro
        await producirPorFallback(platoId, cant);
      }

      setProdMsg("Stock producido correctamente ✅");
      await fetchPlatos();
      setTimeout(() => setShowProd(false), 700);
    } catch (e) {
      console.error(e);
      const apiMsg = e?.response?.data
        ? JSON.stringify(e.response.data, null, 2)
        : e?.message || "No se pudo producir.";
      setProdMsg(apiMsg);
    } finally {
      setProducing(false);
    }
  };

  return (
    <DashboardLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, color: "#fff" }}>Platos</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Botón que pediste, lo dejamos visible (sin lógica de modal para evitar errores) */}
          <button className="btn btn-secondary" type="button">
            Agregar categoría
          </button>
          <Link to="/platos/registrar" className="btn btn-primary">
            Registrar plato
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={qNombre}
          onChange={(e) => setQNombre(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#0f0f0f",
            color: "#fff",
          }}
        />
        <select
          value={fCategoria}
          onChange={(e) => setFCategoria(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#0f0f0f",
            color: "#fff",
          }}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => {
            const id =
              c.id_categoria_plato ??
              c.id_categoria ??
              c.id ??
              c.categoria_id;
            const nombre =
              c.catplt_nombre ??
              c.categoria_nombre ??
              c.cat_nombre ??
              c.nombre ??
              (id != null ? `#${id}` : "-");
            return (
              <option key={id} value={id}>
                {nombre}
              </option>
            );
          })}
        </select>

        <select
          value={fEstado}
          onChange={(e) => setFEstado(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#0f0f0f",
            color: "#fff",
          }}
        >
          <option value="">Todos los estados</option>
          <option value="1">Activos</option>
          <option value="2">Inactivos</option>
        </select>
      </div>

      {msg && <p style={{ color: "#facc15" }}>{msg}</p>}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th style={{ width: 420 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Sin registros
                  </td>
                </tr>
              )}
              {filteredData.map((r, idx) => {
                const idPlato = r.id_plato ?? r.id ?? idx;
                const id = idPlato;
                const nombre =
                  r.pla_nombre ??
                  r.plt_nombre ??
                  r.nombre ??
                  "(sin nombre)";
                const precio =
                  r.pla_precio ?? r.plt_precio ?? r.precio ?? 0;
                const stock =
                  r.plt_stock ??
                  r.pla_stock ??
                  r.stock ??
                  r.stock_actual ??
                  "-";

                let categoriaNombre =
                  r.categoria_nombre ?? r.cat_nombre ?? null;
                if (
                  !categoriaNombre &&
                  r.categoria &&
                  typeof r.categoria === "object"
                ) {
                  categoriaNombre =
                    r.categoria.nombre ??
                    r.categoria.cat_nombre ??
                    r.categoria.categoria_nombre ??
                    null;
                }
                const categoriaId =
                  r.id_categoria_plato ??
                  r.id_categoria ??
                  r.categoria_id ??
                  (r.categoria && typeof r.categoria === "object"
                    ? r.categoria.id ?? r.categoria.id_categoria
                    : null);

                const categoria =
                  categoriaNombre ??
                  (categoriaId != null
                    ? catMap[categoriaId] || `#${categoriaId}`
                    : "-");

                const idEstado = String(
                  r.id_estado_plato ??
                    r.id_estado ??
                    r.estado ??
                    "1"
                );
                const estadoNombre =
                  r.estado_nombre ||
                  (idEstado === "1" ? "Activo" : "Inactivo");
                const recetaId = recetaPorPlato[Number(idPlato)];

                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{nombre}</td>
                    <td>{Number(precio).toFixed(2)}</td>
                    <td>{stock}</td>
                    <td>{categoria}</td>
                    <td>{estadoNombre}</td>
                    <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link to={`/platos/${id}/editar`} className="btn btn-secondary">
                      Editar
                    </Link>
                    <button onClick={() => toggleEstado(r)} className="btn btn-danger">
                      {idEstado === "1" ? "Desactivar" : "Activar"}
                    </button>
                    <button className="btn btn-primary" onClick={() => abrirCargarStock(r)}>
                      Cargar stock
                    </button>
                    {/* NUEVO: ir a ver la receta de este plato */}
                    <Link to={`/platos/${id}/receta`} className="btn btn-secondary">
                      Ver receta
                    </Link>
                  </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para producir (cargar stock) */}
      {showProd && (
        <div
          style={modal.backdrop}
          onClick={() => !producing && setShowProd(false)}
        >
          <div
            style={modal.card}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Cargar stock de plato</h3>
            <p
              style={{
                margin: "6px 0 12px",
                color: "#d1d5db",
              }}
            >
              Ingresá la <strong>cantidad</strong> a producir. Se validará
              el stock de insumos según la <strong>receta</strong>. Si
              falta algún insumo, no se descontará nada.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ color: "#eaeaea" }}>
                Plato:{" "}
                <strong>
                  {prodPlato?.pla_nombre ??
                    prodPlato?.plt_nombre ??
                    prodPlato?.nombre ??
                    `#${prodPlato?.id_plato ?? prodPlato?.id}`}
                </strong>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Cantidad"
                value={prodCantidad}
                onChange={(e) =>
                  setProdCantidad(e.target.value)
                }
                style={modal.input}
                disabled={producing}
              />
            </div>
            {prodMsg && (
              <pre style={modal.warn}>{prodMsg}</pre>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setShowProd(false)}
                disabled={producing}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={producir}
                disabled={producing}
              >
                {producing ? "Procesando..." : "Producir"}
              </button>
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
`;

const modal = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: 16,
  },
  card: {
    background: "#1a1a1a",
    color: "#fff",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: 18,
    maxWidth: 520,
    width: "100%",
    boxShadow: "0 10px 30px rgba(0,0,0,.5)",
  },
  input: {
    width: "100%",
    background: "#0f0f0f",
    color: "#fff",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "10px 12px",
  },
  warn: {
    background: "#3a3a3c",
    color: "#facc15",
    border: "1px solid #4a4a4e",
    borderRadius: 8,
    padding: "8px 10px",
    marginTop: 10,
    whiteSpace: "pre-wrap",
  },
};









