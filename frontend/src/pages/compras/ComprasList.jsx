import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

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
  (s ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const parseDate = (s) => (s ? new Date(s.replace(" ", "T")) : null); // "YYYY-MM-DD HH:MM:SS"

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
  const rows = comprasOrdenadas.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

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
      alert("No podés cancelar una compra en estado terminal (Recibida/Cancelada/Cobrada).");
      return;
    }

    const idCancelada = estadoIdByNombre.get("cancelada");
    if (!idCancelada) {
      alert("No se encontró el estado 'Cancelada'.");
      return;
    }
    if (!window.confirm(`¿Cancelar la compra #${id}? Esta acción es definitiva.`))
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
        const idInsumo = r.id_insumo ?? r.insumo_id ?? r?.id_insumo?.id_insumo;
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Compras</h2>
        <Link to="/compras/registrar" className="btn btn-primary">
          Registrar Compra
        </Link>
      </div>

      {/* Filtros */}
      <div className="filters">
        <input
          className="ctl"
          placeholder="Buscar (ID, desc., empleado, proveedor)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="ctl"
          value={fProv}
          onChange={(e) => setFProv(e.target.value)}
        >
          <option value="">Proveedor (todos)</option>
          {proveedores.map((p) => (
            <option key={p.id_proveedor} value={p.id_proveedor}>
              {p.prov_nombre}
            </option>
          ))}
        </select>
        <select
          className="ctl"
          value={fEstado}
          onChange={(e) => setFEstado(e.target.value)}
        >
          <option value="">Estado (todos)</option>
          {estados.map((e) => (
            <option
              key={e.id_estado_compra ?? e.id}
              value={e.estcom_nombre ?? e.nombre}
            >
              {e.estcom_nombre ?? e.nombre}
            </option>
          ))}
        </select>

        <select
          className="ctl"
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value)}
          title="Ordenar por"
        >
          <option value="fecha_desc">Fecha (más cerca → más lejos)</option>
          <option value="fecha_asc">Fecha (más lejos → más cerca)</option>
          <option value="monto_asc">Monto (menor → mayor)</option>
          <option value="monto_desc">Monto (mayor → menor)</option>
        </select>

        <div className="spacer" />
        <select
          className="ctl"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{ width: 90 }}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}/pág
            </option>
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
                  <th>ID</th>
                  <th>Fecha/Hora</th>
                  <th>Empleado</th>
                  <th>Proveedor</th>
                  <th>Estado</th>
                  <th>Pagado</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                  <th style={{ width: 260 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const id = c.id_compra ?? c.id;
                  const estado = c.estado_nombre ?? "";
                  const estadoKey = lower(estado);
                  const pagado = (c.com_pagado ?? 2) === 1;
                  const isTerminal = TERMINAL.has(estadoKey) || pagado;

                  const puedeCobrar =
                    !pagado && estadoKey === "recibida"; // solo recibida y no pagada

                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{c.com_fecha_hora ?? "-"}</td>
                      <td>{c.empleado_nombre ?? "-"}</td>
                      <td>{c.proveedor_nombre ?? "-"}</td>
                      <td>{estado || "-"}</td>
                      <td>{pagado ? "Sí" : "No"}</td>
                      <td>{fmtMoney(c.com_monto)}</td>
                      <td>{c.com_descripcion ?? "-"}</td>
                      <td
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <Link
                          to={`/compras/detalles/${id}`}
                          className="btn btn-secondary"
                          title="Ver detalle de renglones"
                        >
                          Ver detalles
                        </Link>

                        <Link
                          to={`/compras/editar/${id}`}
                          className="btn btn-secondary"
                          style={{
                            opacity: isTerminal ? 0.5 : 1,
                            pointerEvents: isTerminal ? "none" : "auto",
                          }}
                          title={
                            isTerminal
                              ? "No editable en estado terminal o pagada"
                              : "Editar"
                          }
                        >
                          Editar
                        </Link>

                        {puedeCobrar && (
                          <Link
                            to={`/cobros/registrar/${id}`}
                            className="btn btn-pay"
                            title="Registrar pago/cobro de la compra"
                          >
                            Cobrar
                          </Link>
                        )}

                        <button
                          className="btn btn-receive"
                          onClick={() => handleRecibir(c)}
                          disabled={isTerminal}
                          title="Marcar como Recibida (suma stock)"
                        >
                          Recibir
                        </button>

                        <button
                          className="btn btn-cancel"
                          onClick={() => handleCancelar(c)}
                          disabled={isTerminal}
                          title="Cancelar compra"
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", opacity: 0.7 }}>
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="paginate">
            <button
              className="btn"
              onClick={() => setPage(1)}
              disabled={pageSafe <= 1}
            >
              «
            </button>
            <button
              className="btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageSafe <= 1}
            >
              ‹
            </button>
            <span>
              Página {pageSafe} de {totalPages}
            </span>
            <button
              className="btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageSafe >= totalPages}
            >
              ›
            </button>
            <button
              className="btn"
              onClick={() => setPage(totalPages)}
              disabled={pageSafe >= totalPages}
            >
              »
            </button>
          </div>
        </>
      )}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

/* ===== Estilos ===== */
const styles = `
.table-wrap { overflow:auto; margin-top:8px; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }

.filters { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:10px; }
.filters .ctl { background:#0f0f0f; color:#fff; border:1px solid #2a2a2a; border-radius:8px; padding:8px 10px; }
.filters .spacer { flex:1; }

.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
.btn-receive { background:#16a34a; color:#fff; }
.btn-receive:disabled { opacity:.5; cursor:not-allowed; }
.btn-cancel { background:#dc2626; color:#fff; }
.btn-cancel:disabled { opacity:.5; cursor:not-allowed; }
.btn-pay { background:#fbbf24; color:#111827; }

.paginate { display:flex; gap:8px; align-items:center; justify-content:flex-end; margin-top:10px; }
`;






