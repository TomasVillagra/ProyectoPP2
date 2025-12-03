import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import PlatosListHeader from "../../components/platos/PlatosListHeader";
import PlatosListFilters from "../../components/platos/PlatosListFilters";
import PlatosListTable from "../../components/platos/PlatosListTable";
import PlatosListPagination from "../../components/platos/PlatosListPagination";
import PlatosListModals from "../../components/platos/PlatosListModals";

import "./PlatosList.css";

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
  const idNum = Number(idPlato);

  const tryEndpoints = [
    "/api/pedido-detalles/",
    "/api/detalle-pedidos/",
    "/api/detalles-pedido/",
    "/api/pedidos-detalle/",
  ];

  for (const ep of tryEndpoints) {
    try {
      const { data } = await api.get(ep, {
        params: { id_plato: idNum, page_size: 50 },
      });
      const list = normalizeResponse(data);

      const hayDeEstePlato =
        Array.isArray(list) &&
        list.some((it) => {
          const platoId =
            it.id_plato ??
            it.plato ??
            it.id_plato_id ??
            (it.plato && it.plato.id_plato);

          return Number(platoId) === idNum;
        });

      if (hayDeEstePlato) {
        return true;
      }
    } catch {
      // probamos siguiente endpoint
    }
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
          (it) =>
            Number(it.id_plato ?? it.plato ?? it.id_plato_id) === idNum
        )
      ) {
        return true;
      }
    }
  } catch {}

  // no encontramos nada, se puede desactivar
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

  // ✔ Caso A: NO hay receta asociada
  if (!receta) {
    return {
      motivo:
        "El plato no tiene receta asociada. No se puede cargar stock.",
      faltantes: [],
    };
  }

  const recetaId =
    receta.id_receta ?? receta.id ?? receta.receta_id ?? receta.rec_id ?? null;

  if (!recetaId) {
    return {
      motivo:
        "El plato no tiene una receta válida. No se puede cargar stock.",
      faltantes: [],
    };
  }

  const dets = await fetchDetallesReceta(recetaId);

  // ✔ Caso B: hay receta pero SIN insumos
  if (!Array.isArray(dets) || dets.length === 0) {
    return {
      motivo:
        "El plato no tiene insumos cargados en su receta. No se puede cargar stock.",
      faltantes: [],
    };
  }

  // ✔ Caso C: hay receta con insumos → validar stock
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

  for (const r of requeridos) {
    await actualizarStockInsumo(r.insumoId, r.disp - r.req);
  }

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

  // modal "Agregar categoría"
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catError, setCatError] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  // paginación data table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [qNombre, fCategoria, fEstado, data.length]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageRows = filteredData.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  /* ================== Cargar stock (producir) ================== */
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

      const ok = await tryProducirEndpoint(platoId, cant);
      if (!ok) {
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

  /* ================== Crear categoría ================== */
  const normalizarNombre = (s) =>
    (s || "").toLowerCase().replace(/\s+/g, "");

  const abrirAgregarCategoria = () => {
    setCatName("");
    setCatError("");
    setShowCatModal(true);
  };

  const guardarCategoria = async () => {
    const nombre = catName.trim();
    setCatError("");
    if (!nombre) {
      setCatError("El nombre es obligatorio.");
      return;
    }

    const buscado = normalizarNombre(nombre);
    const existe = categorias.some((c) => {
      const n =
        c.catplt_nombre ??
        c.categoria_nombre ??
        c.cat_nombre ??
        c.nombre ??
        "";
      return normalizarNombre(n) === buscado;
    });

    if (existe) {
      setCatError("Ya existe una categoría con ese nombre.");
      return;
    }

    try {
      setSavingCat(true);
      await api.post("/api/categorias-plato/", {
        catplt_nombre: nombre,
      });
      await fetchCategorias();
      setShowCatModal(false);
      setCatName("");
      setCatError("");
    } catch (e) {
      console.error(e);
      const detail =
        e?.response?.data?.detail ||
        e?.response?.data?.mensaje ||
        e?.response?.data?.error;
      setCatError(detail || "No se pudo crear la categoría.");
    } finally {
      setSavingCat(false);
    }
  };

  return (
    <DashboardLayout>
      <PlatosListHeader abrirAgregarCategoria={abrirAgregarCategoria} />

      <PlatosListFilters
        qNombre={qNombre}
        setQNombre={setQNombre}
        fCategoria={fCategoria}
        setFCategoria={setFCategoria}
        fEstado={fEstado}
        setFEstado={setFEstado}
        categorias={categorias}
      />

      {msg && <p className="platos-msg">{msg}</p>}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <PlatosListTable
            rows={pageRows}
            catMap={catMap}
            recetaPorPlato={recetaPorPlato}
            toggleEstado={toggleEstado}
            abrirCargarStock={abrirCargarStock}
          />

          {totalItems > 0 && (
            <PlatosListPagination
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
            />
          )}

          <PlatosListModals
            /* producir */
            showProd={showProd}
            onCloseProd={() => !producing && setShowProd(false)}
            prodPlato={prodPlato}
            prodCantidad={prodCantidad}
            setProdCantidad={setProdCantidad}
            prodMsg={prodMsg}
            producir={producir}
            producing={producing}
            /* categoría */
            showCatModal={showCatModal}
            onCloseCat={() => !savingCat && setShowCatModal(false)}
            catName={catName}
            setCatName={setCatName}
            catError={catError}
            guardarCategoria={guardarCategoria}
            savingCat={savingCat}
          />
        </>
      )}
    </DashboardLayout>
  );
}














