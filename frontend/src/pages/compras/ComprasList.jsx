import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import ComprasListHeader from "../../components/compras/ComprasListHeader";
import ComprasListFilters from "../../components/compras/ComprasListFilters";
import ComprasListTable from "../../components/compras/ComprasListTable";
import ComprasListPagination from "../../components/compras/ComprasListPagination";

import "./ComprasList.css";

/* ===== Helpers ===== */
function normalizeList(d) {
  if (Array.isArray(d)) return d;
  if (d?.results) return d.results;
  if (d?.data) return d.data;
  return [];
}
const toNumber = (v, def = 0) =>
  v === "" || v === null || v === undefined ? def : Number(v);
const fmtMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`;
const lower = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Intenta parsear distintos formatos:
 *  - "YYYY-MM-DD HH:MM:SS"
 *  - "YYYY-MM-DDTHH:MM:SS"
 *  - ISO con o sin "Z"
 */
const parseDate = (s) => {
  if (!s) return null;
  try {
    const normalized = s.replace(" ", "T");
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
};

/** Muestra la fecha para el usuario (tabla) */
const fmtDateTime = (s) => {
  const d = parseDate(s);
  if (!d) return "-";
  return d.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* Estados terminales de la compra */
const TERMINAL = new Set(["recibida", "cancelada", "cobrada"]);

export default function ComprasList() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  // catálogos
  const [estados, setEstados] = useState([]); // {id_estado_compra, estcom_nombre}
  const [proveedores, setProveedores] = useState([]); // {id_proveedor, prov_nombre}

  // filtros
  const [q, setQ] = useState("");
  const [fProv, setFProv] = useState("");
  const [fEstado, setFEstado] = useState("");

  // orden
  const [orderBy, setOrderBy] = useState("fecha_desc");

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [resC, resE, resP] = await Promise.all([
        api.get("/api/compras/"),
        api.get("/api/estados-compra/"),
        api.get("/api/proveedores/"),
      ]);
      setCompras(normalizeList(resC));
      setEstados(normalizeList(resE));
      setProveedores(normalizeList(resP));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // mapa nombre->id estados
  const estadoIdByNombre = useMemo(() => {
    const m = new Map();
    estados.forEach((e) => {
      const name = lower(e.estcom_nombre ?? e.nombre ?? "");
      const id = e.id_estado_compra ?? e.id;
      if (name) m.set(name, id);
    });
    return m;
  }, [estados]);

  // filtrar
  const comprasFiltradas = useMemo(() => {
    const qn = lower(q);

    return (compras || []).filter((c) => {
      const id = c.id_compra ?? c.id;
      const provId = String(c.id_proveedor ?? c.proveedor_id ?? "");
      const provNom = lower(c.proveedor_nombre ?? "");
      const estNom = lower(c.estado_nombre ?? "");

      // texto
      const passQ =
        !qn ||
        lower(String(id)).includes(qn) ||
        lower(c.com_descripcion ?? "").includes(qn) ||
        lower(c.empleado_nombre ?? "").includes(qn) ||
        provNom.includes(qn);

      if (!passQ) return false;

      // proveedor
      if (fProv && provId !== String(fProv)) return false;

      // estado
      if (fEstado && estNom !== lower(fEstado)) return false;

      return true;
    });
  }, [compras, q, fProv, fEstado]);

  // ordenar
  const comprasOrdenadas = useMemo(() => {
    const arr = [...comprasFiltradas];
    if (orderBy === "fecha_desc") {
      arr.sort(
        (a, b) =>
          (parseDate(b.com_fecha_hora)?.getTime() ?? 0) -
          (parseDate(a.com_fecha_hora)?.getTime() ?? 0)
      );
    } else if (orderBy === "fecha_asc") {
      arr.sort(
        (a, b) =>
          (parseDate(a.com_fecha_hora)?.getTime() ?? 0) -
          (parseDate(b.com_fecha_hora)?.getTime() ?? 0)
      );
    } else if (orderBy === "monto_asc") {
      arr.sort((a, b) => toNumber(a.com_monto, 0) - toNumber(b.com_monto, 0));
    } else if (orderBy === "monto_desc") {
      arr.sort((a, b) => toNumber(b.com_monto, 0) - toNumber(a.com_monto, 0));
    }
    return arr;
  }, [comprasFiltradas, orderBy]);

  // paginar
  const totalRows = comprasOrdenadas.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const rows = comprasOrdenadas.slice(
    (pageSafe - 1) * pageSize,
    pageSafe * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [q, fProv, fEstado, orderBy, pageSize]);

  /* ===== Acciones: refrescar una compra ===== */
  const refreshOne = async (idCompra) => {
    try {
      const { data } = await api.get(`/api/compras/${idCompra}/`);
      setCompras((prev) =>
        prev.map((x) =>
          String(x.id_compra ?? x.id) === String(idCompra) ? data : x
        )
      );
    } catch (e) {
      console.error(e);
      fetchAll();
    }
  };

  /* ===== Cancelar ===== */
  const handleCancelar = async (compra) => {
    const id = compra.id_compra ?? compra.id;
    const estadoActual = lower(compra.estado_nombre ?? "");
    const pagado = (compra.com_pagado ?? 2) === 1;

    if (pagado) {
      alert("No podés cancelar una compra que ya está cobrada/pagada.");
      return;
    }
    if (TERMINAL.has(estadoActual)) {
      alert(
        "No podés cancelar una compra en estado terminal (Recibida/Cancelada/Cobrada)."
      );
      return;
    }

    const idCancelada = estadoIdByNombre.get("cancelada");
    if (!idCancelada) {
      alert("No se encontró el estado 'Cancelada'.");
      return;
    }
    if (
      !window.confirm(
        `¿Cancelar la compra #${id}? Esta acción es definitiva.`
      )
    )
      return;

    try {
      await api.patch(`/api/compras/${id}/`, {
        id_estado_compra: Number(idCancelada),
      });
      await refreshOne(id);
    } catch (e) {
      console.error(e);
      alert("No se pudo cancelar la compra.");
    }
  };

  /* ===== Recibir (suma stock usando capacidad) ===== */
  const handleRecibir = async (compra) => {
    const id = compra.id_compra ?? compra.id;
    const estadoActual = lower(compra.estado_nombre ?? "");
    const pagado = (compra.com_pagado ?? 2) === 1;

    if (TERMINAL.has(estadoActual) || pagado) return;

    const idRecibida = estadoIdByNombre.get("recibida");
    if (!idRecibida) {
      alert("No se encontró el estado 'Recibida'.");
      return;
    }
    if (
      !window.confirm(
        `¿Marcar como RECIBIDA la compra #${id}? Esto sumará stock al inventario.`
      )
    )
      return;

    try {
      const det = await api.get(`/api/detalle-compras/?id_compra=${id}`);
      const detalle = normalizeList(det);

      for (const r of detalle) {
        const idInsumo =
          r.id_insumo ?? r.insumo_id ?? r?.id_insumo?.id_insumo;
        const cantFardos = toNumber(r.detcom_cantidad, 0); // cantidad de fardos / unidades compradas
        if (!idInsumo || !(cantFardos > 0)) continue;

        const ins = await api.get(`/api/insumos/${idInsumo}/`);
        const actual = toNumber(ins?.data?.ins_stock_actual, 0);
        const capacidad = toNumber(ins?.data?.ins_capacidad, 0) || 1; // capacidad por fardo
        const incremento = cantFardos * capacidad; // ej: 1 fardo * 6 = 6 unidades

        const nuevo = actual + incremento;
        await api.patch(`/api/insumos/${idInsumo}/`, {
          ins_stock_actual: Number(nuevo),
        });
      }

      await api.patch(`/api/compras/${id}/`, {
        id_estado_compra: Number(idRecibida),
      });

      await refreshOne(id);
      alert("Compra recibida y stock actualizado según capacidad.");
    } catch (e) {
      console.error(e);
      alert("No se pudo recibir la compra. Ver consola para más detalles.");
    }
  };

  return (
    <DashboardLayout>
      {/* ✅ Scope para que el CSS no sea global */}
      <div className="compras-list-scope">
        <ComprasListHeader />

        <ComprasListFilters
          q={q}
          setQ={setQ}
          fProv={fProv}
          setFProv={setFProv}
          fEstado={fEstado}
          setFEstado={setFEstado}
          orderBy={orderBy}
          setOrderBy={setOrderBy}
          pageSize={pageSize}
          setPageSize={setPageSize}
          estados={estados}
          proveedores={proveedores}
        />

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <ComprasListTable
              rows={rows}
              fmtMoney={fmtMoney}
              lower={lower}
              TERMINAL={TERMINAL}
              onRecibir={handleRecibir}
              onCancelar={handleCancelar}
              /* 🔹 NUEVO: formateador de fecha para la tabla */
              fmtDateTime={fmtDateTime}
            />

            <ComprasListPagination
              pageSafe={pageSafe}
              totalPages={totalPages}
              setPage={setPage}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}








