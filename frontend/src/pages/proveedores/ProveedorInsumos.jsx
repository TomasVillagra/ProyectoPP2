import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  useNavigate,
  useParams,
  Link,
  useLocation,
} from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import ProveedorInsumosHeader from "../../components/proveedores/ProveedorInsumosHeader";
import ProveedorInsumosVincular from "../../components/proveedores/ProveedorInsumosVincular";
import ProveedorInsumosTable from "../../components/proveedores/ProveedorInsumosTable";

import "./ProveedorInsumos.css";

export default function ProveedorInsumos() {
  const { id } = useParams(); // id_proveedor
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

  // === Conjuntos para bloquear acciones ===
  // insumos que aparecen en CUALQUIER compra del proveedor (bloquea QUITAR)
  const [insumosUsadosEnCompras, setInsumosUsadosEnCompras] = useState(
    new Set()
  );
  // insumos que aparecen en compras del proveedor con estado "En proceso" (bloquea EDITAR PRECIO)
  const [insumosEnProceso, setInsumosEnProceso] = useState(new Set());

  const norm = (d) =>
    Array.isArray(d?.results)
      ? d.results
      : Array.isArray(d)
      ? d
      : d?.data || [];

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
        setMsg(
          "No se pudo cargar la información del proveedor."
        );
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

  // ---------- Cargar compras y calcular bloqueos ----------
  const refreshComprasBloqueos = useCallback(async () => {
    try {
      // 1) Traer compras SOLO del proveedor actual
      const comprasRes = await api.get(
        `/api/compras/?id_proveedor=${id}`
      );
      const compras = Array.isArray(comprasRes.data)
        ? comprasRes.data
        : comprasRes.data?.results ||
          comprasRes.data ||
          [];

      if (!compras.length) {
        setInsumosUsadosEnCompras(new Set());
        setInsumosEnProceso(new Set());
        return;
      }

      const usados = new Set();
      const enProceso = new Set();

      await Promise.all(
        compras.map(async (c) => {
          // validar proveedor por seguridad
          const provCompra =
            Number(c.id_proveedor) ||
            Number(c.proveedor_id) ||
            Number(c.id_proveedor_id);

          if (provCompra !== Number(id)) {
            return;
          }

          const idCompra = c.id_compra ?? c.id;
          if (!idCompra) return;

          const detRes = await api.get(
            `/api/detalle-compras/?id_compra=${idCompra}`
          );
          const detalle = Array.isArray(detRes.data)
            ? detRes.data
            : detRes.data?.results ||
              detRes.data ||
              [];

          // Agregar insumos usados
          detalle.forEach((d) => {
            const insumoId =
              Number(d.id_insumo) ||
              Number(d.insumo_id) ||
              Number(d?.id_insumo?.id_insumo) ||
              0;

            if (insumoId) usados.add(insumoId);
          });

          // ¿La compra está EN PROCESO?
          const est = (
            c.estado_nombre || c.estcom_nombre || ""
          ).toLowerCase();
          const esEnProc = est.includes("proceso");

          if (esEnProc) {
            detalle.forEach((d) => {
              const insumoId =
                Number(d.id_insumo) ||
                Number(d.insumo_id) ||
                Number(d?.id_insumo?.id_insumo) ||
                0;

              if (insumoId) enProceso.add(insumoId);
            });
          }
        })
      );

      setInsumosUsadosEnCompras(usados); // bloquea quitar
      setInsumosEnProceso(enProceso); // bloquea editar precio
    } catch (e) {
      console.error(
        "Error bloqueos compras proveedor:",
        e
      );
      setInsumosUsadosEnCompras(new Set());
      setInsumosEnProceso(new Set());
    }
  }, [id]);

  // Cargar bloqueos después de cargar relaciones
  useEffect(() => {
    refreshComprasBloqueos();
  }, [refreshComprasBloqueos, relaciones]);

  const vinculadosIds = new Set(
    (relaciones || []).map((r) => Number(r.id_insumo))
  );

  // solo insumos ACTIVO en el combo
  const isInsumoActivo = (i) => {
    const nombreEstado = String(
      i.estado_nombre ??
        i.estins_nombre ??
        i.estado ??
        i.ins_estado ??
        ""
    ).toLowerCase();

    if (nombreEstado) {
      return nombreEstado.includes("activo");
    }

    const idEstado = Number(
      i.id_estado_insumo ??
        i.estado_insumo_id ??
        i.id_estado ??
        0
    );
    if (idEstado) {
      return idEstado === 1;
    }
    return true;
  };

  const insumosDisponibles = (insumosAll || []).filter(
    (i) =>
      !vinculadosIds.has(Number(i.id_insumo)) &&
      isInsumoActivo(i)
  );

  // filtro del buscador (nombre, unidad, código o id)
  const matchesQuery = useCallback(
    (i) => {
      if (!q) return true;
      const qn = nrmText(q);
      return [i.ins_nombre, i.ins_unidad, i.codigo, i.id_insumo]
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
  const getRelPk = (r) =>
    r.id_prov_x_ins ||
    r.id_proveedor_insumo ||
    r.id ||
    r.pk;

  const isValidPrice = (val) => {
    if (val === "" || val === null || typeof val === "undefined")
      return false;
    const num = Number(String(val).replace(",", "."));
    if (Number.isNaN(num)) return false;
    if (num < 0) return false;
    const parts = String(val).replace(",", ".").split(".");
    return (
      parts.length === 1 || (parts[1]?.length ?? 0) <= 3
    );
  };

  const toPriceStr = (val) => {
    const num = Number(String(val).replace(",", "."));
    if (Number.isNaN(num)) return null;
    return num.toFixed(3); // Decimal(12,3)
  };

  // mínimo de precio > 100
  const MIN_PRICE = 100;

  const isPriceAtLeastMin = (val) => {
    const num = Number(String(val).replace(",", "."));
    if (Number.isNaN(num)) return false;
    return num > MIN_PRICE;
  };

  const refreshRel = async () => {
    const relRes = await api.get(
      `/api/proveedores-insumos/?id_proveedor=${id}`
    );
    setRelaciones(norm(relRes));
  };

  const handleVincular = async () => {
    setMsg("");
    if (!selInsumo) {
      setMsg("Elegí un insumo para vincular.");
      return;
    }
    if (
      !isValidPrice(priceInput) ||
      !isPriceAtLeastMin(priceInput)
    ) {
      setMsg(
        "Ingresá un precio válido (> 100, hasta 3 decimales)."
      );
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
      await refreshComprasBloqueos();
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

  // Quitar relación con bloqueos
  const handleQuitar = async (rel) => {
    setMsg("");
    try {
      const insumoId = Number(rel.id_insumo);
      if (insumosUsadosEnCompras.has(insumoId)) {
        setMsg(
          "No se puede quitar el insumo: está asociado a una o más compras de este proveedor."
        );
        return;
      }

      const pk = getRelPk(rel);
      await api.delete(
        `/api/proveedores-insumos/${pk}/`
      );
      await refreshRel();
      await refreshComprasBloqueos();
      setMsg("Insumo desvinculado del proveedor.");
    } catch (e) {
      console.error(e);
      setMsg(
        "No se pudo quitar el insumo del proveedor."
      );
    }
  };

  // Interacción teclado del combobox
  const onKeyDown = (e) => {
    if (
      !open &&
      (e.key === "ArrowDown" || e.key === "ArrowUp")
    ) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((idx) =>
        Math.min(idx + 1, insumosFiltrados.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((idx) => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && insumosFiltrados[active]) {
        const item = insumosFiltrados[active];
        setSelInsumo(item.id_insumo);
        setQ(
          `${item.ins_nombre}${
            item.ins_unidad ? ` (${item.ins_unidad})` : ""
          }`
        );
        setOpen(false);
        setActive(-1);
        setTimeout(
          () => priceRef.current?.focus(),
          0
        );
      } else if (!open) {
        if (
          selInsumo &&
          isValidPrice(priceInput) &&
          isPriceAtLeastMin(priceInput)
        ) {
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
      else if (
        itemBot >
        list.scrollTop + list.clientHeight
      )
        list.scrollTop =
          itemBot - list.clientHeight;
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
      <div className="prov-ins-container">
        <ProveedorInsumosHeader
          id={id}
          nombre={prov?.prov_nombre ?? "-"}
        />

        {msg && (
          <p className="prov-ins-notice">{msg}</p>
        )}

        <ProveedorInsumosVincular
          id={id}
          q={q}
          setQ={setQ}
          open={open}
          setOpen={setOpen}
          active={active}
          setActive={setActive}
          inputRef={inputRef}
          listRef={listRef}
          clickingListRef={clickingListRef}
          priceInput={priceInput}
          setPriceInput={setPriceInput}
          priceRef={priceRef}
          selInsumo={selInsumo}
          setSelInsumo={setSelInsumo}
          insumosFiltrados={insumosFiltrados}
          insumosDisponibles={insumosDisponibles}
          handleVincular={handleVincular}
          isValidPrice={isValidPrice}
          isPriceAtLeastMin={isPriceAtLeastMin}
          onKeyDown={onKeyDown}
        />

        <ProveedorInsumosTable
          relaciones={relaciones}
          insumoById={insumoById}
          getRelPk={getRelPk}
          editingRow={editingRow}
          setEditingRow={setEditingRow}
          editingPrice={editingPrice}
          setEditingPrice={setEditingPrice}
          isValidPrice={isValidPrice}
          isPriceAtLeastMin={isPriceAtLeastMin}
          toPriceStr={toPriceStr}
          refreshRel={refreshRel}
          refreshComprasBloqueos={refreshComprasBloqueos}
          handleQuitar={handleQuitar}
          insumosUsadosEnCompras={insumosUsadosEnCompras}
          insumosEnProceso={insumosEnProceso}
          setMsg={setMsg}
        />
      </div>
    </DashboardLayout>
  );
}







