import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function ProveedorInsumos() {
  const { id } = useParams();                 // id_proveedor
  const navigate = useNavigate();
  const location = useLocation();

  const [prov, setProv] = useState(null);
  const [insumosAll, setInsumosAll] = useState([]);
  const [relaciones, setRelaciones] = useState([]); // proveedor x insumo
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // selección actual (combobox)
  const [selInsumo, setSelInsumo] = useState("");

  // --- BUSCADOR (combobox) ---
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // --- Precio para vincular (requerido) ---
  const [priceInput, setPriceInput] = useState("");
  const priceRef = useRef(null);

  // flag para evitar cerrar por blur cuando se hace click dentro de la lista
  const clickingListRef = useRef(false);

  // --- Edición de precio en tabla ---
  const [editingRow, setEditingRow] = useState(null); // pk de la relación
  const [editingPrice, setEditingPrice] = useState("");

  // === NUEVO: Conjuntos para bloquear acciones ===
  // insumos que aparecen en CUALQUIER compra del proveedor (bloquea QUITAR)
  const [insumosUsadosEnCompras, setInsumosUsadosEnCompras] = useState(new Set());
  // insumos que aparecen en compras del proveedor con estado "En proceso" (bloquea EDITAR PRECIO)
  const [insumosEnProceso, setInsumosEnProceso] = useState(new Set());

  const norm = (d) =>
    Array.isArray(d?.results) ? d.results : (Array.isArray(d) ? d : d?.data || []);

  // Quita acentos, espacios y pasa a minúsculas
  const nrmText = (t) =>
    t
      ? t
          .toString()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/\s+/g, "")
      : "";

  const clean = (s) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Mapa id_insumo -> insumo
  const insumoById = useMemo(() => {
    const m = new Map();
    (insumosAll || []).forEach((i) => m.set(Number(i.id_insumo), i));
    return m;
  }, [insumosAll]);

  // ---------- Carga inicial ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [provRes, relRes, insRes] = await Promise.all([
          api.get(`/api/proveedores/${id}/`),
          api.get(`/api/proveedores-insumos/?id_proveedor=${id}`),
          api.get(`/api/insumos/`),
        ]);
        setProv(provRes.data || null);
        setRelaciones(norm(relRes));
        setInsumosAll(norm(insRes));
      } catch (e) {
        console.error(e);
        setMsg("No se pudo cargar la información del proveedor.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Flash message al volver desde Registrar
  useEffect(() => {
    if (location.state?.flash) {
      setMsg(location.state.flash);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // ---------- NUEVO: Cargar compras y calcular bloqueos ----------
  const refreshComprasBloqueos = useCallback(async () => {
    try {
      // 1) Traer compras del proveedor
      const comprasRes = await api.get(`/api/compras/?id_proveedor=${id}`);
      const compras = Array.isArray(comprasRes.data)
        ? comprasRes.data
        : (comprasRes.data?.results || comprasRes.data || []);

      if (!compras.length) {
        setInsumosUsadosEnCompras(new Set());
        setInsumosEnProceso(new Set());
        return;
      }

      // 2) Por cada compra, traer detalles y llenar sets
      const usados = new Set();
      const enProceso = new Set();
      await Promise.all(
        compras.map(async (c) => {
          const idCompra = c.id_compra ?? c.id;
          if (!idCompra) return;
          const detRes = await api.get(`/api/detalle-compras/?id_compra=${idCompra}`);
          const detalle = Array.isArray(detRes.data)
            ? detRes.data
            : (detRes.data?.results || detRes.data || []);

          // marcar todos los insumos de esta compra
          detalle.forEach((d) => {
            const insumoId =
              Number(d.id_insumo ?? d.insumo_id ?? d?.id_insumo?.id_insumo ?? 0);
            if (insumoId) usados.add(insumoId);
          });

          // si la compra está "En proceso", marcar sus insumos en conjunto especial
          const estNom =
            clean(c.estado_nombre ?? c.estcom_nombre ?? c.estado ?? c.id_estado_compra);
          const esEnProceso = estNom === "en proceso" || estNom === "en_proceso";
          if (esEnProceso) {
            detalle.forEach((d) => {
              const insumoId =
                Number(d.id_insumo ?? d.insumo_id ?? d?.id_insumo?.id_insumo ?? 0);
              if (insumoId) enProceso.add(insumoId);
            });
          }
        })
      );

      setInsumosUsadosEnCompras(usados);
      setInsumosEnProceso(enProceso);
    } catch (e) {
      console.error("No se pudieron calcular bloqueos de compras:", e?.response?.data || e?.message);
      // En caso de error, por seguridad, no bloqueamos nada (o podrías bloquear todo)
      setInsumosUsadosEnCompras(new Set());
      setInsumosEnProceso(new Set());
    }
  }, [id]);

  // Cargar bloqueos después de cargar relaciones
  useEffect(() => {
    refreshComprasBloqueos();
  }, [refreshComprasBloqueos, relaciones]);

  const vinculadosIds = new Set((relaciones || []).map((r) => Number(r.id_insumo)));
  const insumosDisponibles = (insumosAll || []).filter(
    (i) => !vinculadosIds.has(Number(i.id_insumo))
  );

  // filtro del buscador (nombre, unidad, código o id)
  const matchesQuery = useCallback(
    (i) => {
      if (!q) return true;
      const qn = nrmText(q);
      return [
        i.ins_nombre,
        i.ins_unidad,
        i.codigo,         // si tu modelo tiene "codigo"
        i.id_insumo,
      ]
        .map((v) => nrmText(v))
        .some((txt) => txt.includes(qn));
    },
    [q]
  );

  const insumosFiltrados = useMemo(
    () => insumosDisponibles.filter(matchesQuery),
    [insumosDisponibles, matchesQuery]
  );

  // helpers
  const getRelPk = (r) => r.id_prov_x_ins || r.id_proveedor_insumo || r.id || r.pk;
  const isValidPrice = (val) => {
    if (val === "" || val === null || typeof val === "undefined") return false;
    const num = Number(String(val).replace(",", "."));
    if (Number.isNaN(num)) return false;
    if (num < 0) return false;
    // hasta 3 decimales
    const parts = String(val).replace(",", ".").split(".");
    return parts.length === 1 || (parts[1]?.length ?? 0) <= 3;
  };
  const toPriceStr = (val) => {
    const num = Number(String(val).replace(",", "."));
    if (Number.isNaN(num)) return null;
    return num.toFixed(3); // Decimal(12,3)
  };

  const refreshRel = async () => {
    const relRes = await api.get(`/api/proveedores-insumos/?id_proveedor=${id}`);
    setRelaciones(norm(relRes));
  };

  const handleVincular = async () => {
    setMsg("");
    if (!selInsumo) {
      setMsg("Elegí un insumo para vincular.");
      return;
    }
    if (!isValidPrice(priceInput)) {
      setMsg("Ingresá un precio válido (≥ 0, hasta 3 decimales).");
      priceRef.current?.focus();
      return;
    }
    try {
      await api.post("/api/proveedores-insumos/", {
        id_proveedor: Number(id),
        id_insumo: Number(selInsumo),
        precio_unitario: toPriceStr(priceInput),
      });
      await refreshRel();
      await refreshComprasBloqueos(); // recalcular bloqueos
      setSelInsumo("");
      setQ("");
      setPriceInput("");
      setOpen(false);
      setActive(-1);
      setMsg("Insumo vinculado correctamente ✅");
      inputRef.current?.focus();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo vincular el insumo.");
    }
  };

  // ---------- Quitar relación con bloqueos ----------
  const handleQuitar = async (rel) => {
    setMsg("");
    try {
      const insumoId = Number(rel.id_insumo);
      // Si el insumo aparece en alguna compra del proveedor, bloquear
      if (insumosUsadosEnCompras.has(insumoId)) {
        setMsg("No se puede quitar el insumo: está asociado a una o más compras de este proveedor.");
        return;
      }

      const pk = getRelPk(rel);
      await api.delete(`/api/proveedores-insumos/${pk}/`);
      await refreshRel();
      await refreshComprasBloqueos();
      setMsg("Insumo desvinculado del proveedor.");
    } catch (e) {
      console.error(e);
      setMsg("No se pudo quitar el insumo del proveedor.");
    }
  };

  // --- Interacción teclado del combobox ---
  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((idx) => Math.min(idx + 1, insumosFiltrados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((idx) => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && insumosFiltrados[active]) {
        // ✅ Selecciona (no vincula)
        const item = insumosFiltrados[active];
        setSelInsumo(item.id_insumo);
        setQ(`${item.ins_nombre}${item.ins_unidad ? ` (${item.ins_unidad})` : ""}`);
        setOpen(false);
        setActive(-1);
        // Enfocar precio para que lo cargues y luego vincules
        setTimeout(() => priceRef.current?.focus(), 0);
      } else if (!open) {
        // si la lista está cerrada y ya hay insumo seleccionado, si el precio es válido recién vincula
        if (selInsumo && isValidPrice(priceInput)) {
          handleVincular();
        } else {
          priceRef.current?.focus();
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  // scroll activo visible
  useEffect(() => {
    if (!open || active < 0) return;
    const list = listRef.current;
    const item = list?.children?.[active];
    if (list && item) {
      const itemTop = item.offsetTop;
      const itemBot = itemTop + item.offsetHeight;
      if (itemTop < list.scrollTop) list.scrollTop = itemTop;
      else if (itemBot > list.scrollTop + list.clientHeight)
        list.scrollTop = itemBot - list.clientHeight;
    }
  }, [active, open]);

  if (loading) {
    return (
      <DashboardLayout>
        <p>Cargando…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h2>Insumos del Proveedor #{id}</h2>
          <p className="sub">{prov?.prov_nombre ?? "-"}</p>
        </div>
        <div className="header-actions">
          <Link to="/proveedores" className="btn btn-secondary">Volver</Link>
        </div>
      </div>

      {msg && <p className="notice">{msg}</p>}

      {/* Vincular existente */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Vincular insumo</h3>

        {/* COMBOBOX + PRECIO OBLIGATORIO */}
        <div className="combo">
          <div
            className="combo-input-wrap"
            role="combobox"
            aria-expanded={open}
            aria-controls="insumo-listbox"
            aria-owns="insumo-listbox"
            aria-haspopup="listbox"
          >
            <input
              ref={inputRef}
              type="text"
              className="combo-input"
              placeholder="Buscar insumo por nombre, unidad, código o ID…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
                setActive(0);
                setSelInsumo(""); // si cambiaste el texto, resetea selección previa
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                // cierre suave: si estamos clickeando dentro de la lista, no cerrar
                setTimeout(() => {
                  if (clickingListRef.current) {
                    clickingListRef.current = false;
                  } else {
                    setOpen(false);
                  }
                }, 0);
              }}
              onKeyDown={onKeyDown}
            />
            <input
              ref={priceRef}
              type="number"
              step="0.001"
              min="0"
              className="price-input"
              placeholder="Precio (ej. 123.450)"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              title="Precio unitario (obligatorio)"
            />
            <button
              className="btn btn-primary"
              disabled={!selInsumo || !isValidPrice(priceInput)}
              onClick={handleVincular}
              title="Vincular insumo seleccionado con precio"
            >
              Vincular
            </button>
            <span className="search-count">
              {insumosFiltrados.length} de {insumosDisponibles.length}
            </span>
          </div>

          {open && (
            <div
              id="insumo-listbox"
              ref={listRef}
              role="listbox"
              className="combo-list"
              // marcamos que estamos clickeando en la lista para evitar cerrar por blur
              onMouseDownCapture={() => { clickingListRef.current = true; }}
            >
              {insumosFiltrados.map((i, idx) => (
                <div
                  key={i.id_insumo}
                  role="option"
                  aria-selected={idx === active}
                  className={`combo-option ${idx === active ? "is-active" : ""}`}
                  onMouseEnter={() => setActive(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // evita perder foco del input antes de seleccionar
                    // ✅ Solo selecciona, no vincula
                    setSelInsumo(i.id_insumo);
                    setQ(`${i.ins_nombre}${i.ins_unidad ? ` (${i.ins_unidad})` : ""}`);
                    setOpen(false);
                    setActive(-1);
                    // listo para cargar precio
                    setTimeout(() => priceRef.current?.focus(), 0);
                  }}
                >
                  <div className="opt-title">
                    {i.ins_nombre}
                    {i.ins_unidad ? <span className="opt-unit">({i.ins_unidad})</span> : null}
                  </div>
                  <div className="opt-meta">
                    <span>ID: {i.id_insumo}</span>
                    {typeof i.ins_stock_actual !== "undefined" && (
                      <span>• Stock: {i.ins_stock_actual}</span>
                    )}
                    {i.codigo ? <span>• Cód: {i.codigo}</span> : null}
                  </div>
                </div>
              ))}

              {insumosFiltrados.length === 0 && (
                <div className="combo-empty">
                  <div>No se encontraron insumos que coincidan con “{q}”.</div>
                  <Link
                    to="/inventario/registrar"
                    state={{ backTo: `/proveedores/${id}/insumos` }}
                    className="btn btn-secondary btn-small"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    Crear insumo…
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <small className="muted">
          Elegí un insumo, cargá el <strong>precio</strong> y tocá <strong>Vincular</strong>. Con <strong>↑/↓</strong> navegás y con <strong>Enter</strong> seleccionás.
        </small>
      </div>

      {/* Lista vinculados */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Insumo</th>
              <th>Unidad</th>
              <th>Stock actual</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(relaciones || []).map((r) => {
              const ins = insumoById.get(Number(r.id_insumo)) || {};
              const pk = getRelPk(r);
              const isEditing = editingRow === pk;
              const insumoId = Number(ins.id_insumo ?? r.id_insumo);

              // flags de bloqueo
              const bloqueaQuitar = insumosUsadosEnCompras.has(insumoId);
              const bloqueaEditar = insumosEnProceso.has(insumoId);

              return (
                <tr key={pk}>
                  <td>{ins.id_insumo ?? r.id_insumo}</td>
                  <td>{ins.ins_nombre ?? r.ins_nombre ?? "-"}</td>
                  <td>{ins.ins_unidad ?? "-"}</td>
                  <td>{ins.ins_stock_actual ?? "-"}</td>

                  {/* Precio (con edición en línea, bloquea guardar si hay compras "En proceso") */}
                  <td>
                    {isEditing ? (
                      <div className="edit-price-wrap">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          className="price-input"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
                          disabled={bloqueaEditar}
                          title={bloqueaEditar ? "No se puede editar: hay compras en proceso con este insumo." : "Ingresá el nuevo precio"}
                        />
                        <button
                          className="btn btn-primary btn-xs"
                          disabled={!isValidPrice(editingPrice) || bloqueaEditar}
                          onClick={async () => {
                            if (bloqueaEditar) {
                              setMsg("No se puede editar el precio: este insumo está en compras 'En proceso'.");
                              return;
                            }
                            try {
                              await api.patch(`/api/proveedores-insumos/${pk}/`, {
                                precio_unitario: toPriceStr(editingPrice),
                              });
                              await refreshRel();
                              await refreshComprasBloqueos();
                              setEditingRow(null);
                              setEditingPrice("");
                              setMsg("Precio actualizado ✅");
                            } catch (e) {
                              console.error(e);
                              setMsg("No se pudo actualizar el precio.");
                            }
                          }}
                        >
                          Guardar
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => {
                            setEditingRow(null);
                            setEditingPrice("");
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      (r.precio_unitario ?? null) !== null
                        ? `$ ${Number(r.precio_unitario).toFixed(3)}`
                        : "-"
                    )}
                  </td>

                  <td className="actions-cell">
                    {!isEditing && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          if (bloqueaEditar) {
                            setMsg("No se puede editar el precio: este insumo está en compras 'En proceso'.");
                            return;
                          }
                          setEditingRow(pk);
                          setEditingPrice(
                            (r.precio_unitario ?? "") === "" || r.precio_unitario === null
                              ? ""
                              : Number(r.precio_unitario).toFixed(3)
                          );
                        }}
                        disabled={bloqueaEditar}
                        title={bloqueaEditar ? "No se puede editar: hay compras 'En proceso' con este insumo." : "Editar precio"}
                      >
                        Editar precio
                      </button>
                    )}

                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        if (bloqueaQuitar) {
                          setMsg("No se puede quitar el insumo: está asociado a una o más compras de este proveedor.");
                          return;
                        }
                        handleQuitar(r);
                      }}
                      disabled={bloqueaQuitar}
                      title={bloqueaQuitar ? "No se puede quitar: el insumo figura en compras del proveedor." : "Quitar"}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              );
            })}
            {(!relaciones || relaciones.length === 0) && (
              <tr>
                <td colSpan="6" className="empty-row">
                  Este proveedor aún no tiene insumos vinculados.
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
.page-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:16px; }
.page-header h2 { margin:0; color:#fff; }
.sub { margin:4px 0 0; color:#d1d5db; }
.header-actions { display:flex; gap:8px; }

.notice { background:#1f2937; border:1px solid #374151; color:#e5e7eb; padding:8px 12px; border-radius:8px; }

/* Tarjeta */
.card { background:#2c2c2e; border:1px solid #3a3a3c; border-radius:12px; padding:16px; margin-bottom:16px; }
.muted { color:#d1d5db; display:inline-block; margin-top:6px; }

/* COMBOBOX */
.combo { position: relative; margin-bottom: 8px; }
.combo-input-wrap { display:flex; align-items:center; gap:8px; }
.combo-input {
  flex:1; background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; border-radius:8px; padding:10px 12px; outline:none;
}
.price-input {
  width: 180px; background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; border-radius:8px; padding:10px 12px; outline:none;
}
.search-count { font-size:.875rem; color:#d1d5db; white-space:nowrap; }
.combo-list {
  position:absolute; z-index:30; top:100%; left:0; right:0; margin-top:6px;
  background:#2c2c2e; border:1px solid #3a3a3c; border-radius:10px; max-height:260px; overflow:auto;
  box-shadow: 0 10px 30px rgba(0,0,0,.35);
}
.combo-option { padding:10px 12px; cursor:pointer; display:flex; flex-direction:column; gap:4px; }
.combo-option:hover, .combo-option.is-active { background:#3a3a3c; }
.opt-title { color:#fff; font-weight:600; display:flex; gap:6px; align-items:center; }
.opt-unit { color:#d1d5db; font-weight:500; }
.opt-meta { color:#c7c7c7; font-size:.85rem; display:flex; gap:10px; }
.combo-empty { padding:12px; display:flex; align-items:center; justify-content:space-between; gap:12px; color:#d1d5db; }
.btn-small { padding:6px 10px; font-size:.9rem; }

/* Botones */
.btn { display:inline-flex; align-items:center; gap:8px; padding:8px 14px; border-radius:8px; border:none; cursor:pointer; font-weight:600; text-decoration:none; transition:background-color .2s ease; }
.btn-primary { background:#facc15; color:#111827; }
.btn-primary:hover { background:#eab308; }
.btn-secondary { background:#3a3a3c; color:#eaeaea; }
.btn-secondary:hover { background:#4a4a4e; }
.btn-danger { background:rgba(239,68,68,.2); color:#ef4444; }
.btn-danger:hover { background:rgba(239,68,68,.3); }

/* Tabla */
.table-container { background:#2c2c2e; border:1px solid #3a3a3c; border-radius:12px; overflow:hidden; }
.table { width:100%; border-collapse:collapse; }
.table th, .table td { padding:14px 18px; text-align:left; border-bottom:1px solid #3a3a3c; color:#eaeaea; }
.table th { background:#3a3a3c; color:#d1d5db; font-weight:600; font-size:.875rem; text-transform:uppercase; }
.table tbody tr:last-child td { border-bottom:none; }
.actions-cell { display:flex; gap:8px; }
.empty-row { text-align:center; color:#a0a0a0; padding:32px; }

/* Edición en línea precio */
.edit-price-wrap { display:flex; align-items:center; gap:8px; }
.btn-xs { padding:6px 10px; font-size:.85rem; }
`;





