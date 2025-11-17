import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ===== util comunes ===== */
const toDec = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  let s = String(v).replace(/,/g, ".").replace(/[^\d.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts.shift() + "." + parts.join("");
  return s;
};
const blockInvalidDecimal = (e) => {
  const bad = ["-", "+", "e", "E", " "];
  if (bad.includes(e.key)) e.preventDefault();
};
const norm = (d) => (Array.isArray(d) ? d : d?.results || d?.data || []);
const nowSQL = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const empleadoLabel = (e) => {
  const nom = [e?.emp_nombre ?? e?.nombre, e?.emp_apellido ?? e?.apellido]
    .filter(Boolean)
    .join(" ");
  return nom || `Empleado #${e?.id_empleado ?? e?.id ?? "?"}`;
};

export default function CompraRegistrar() {
  const nav = useNavigate();

  // catálogos
  const [empleadoActual, setEmpleadoActual] = useState(null);
  const [estados, setEstados] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [insumosAll, setInsumosAll] = useState([]);

  // vínculo proveedor<->insumo (con precio_unitario)
  const [linksProvInsumo, setLinksProvInsumo] = useState([]); // [{id_insumo, precio_unitario, ...}]
  const precioByInsumo = useMemo(() => {
    const m = new Map();
    linksProvInsumo.forEach((r) =>
      m.set(Number(r.id_insumo), Number(r.precio_unitario ?? 0))
    );
    return m;
  }, [linksProvInsumo]);

  const [form, setForm] = useState({
    id_empleado: "",        // se completa con /empleados/me/
    id_estado_compra: "",   // “En Proceso” (bloqueado)
    id_proveedor: "",
    com_descripcion: "",
    com_pagado: "2",        // 1 = Sí, 2 = No (por defecto NO)
  });

  // renglones del detalle
  const [rows, setRows] = useState([
    { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
  ]);
  const [msg, setMsg] = useState("");

  // ====== carga inicial ======
  useEffect(() => {
    (async () => {
      try {
        // Empleado actual (bloqueado, no select)
        try {
          const { data } = await api.get("/api/empleados/me/");
          const id = data.id_empleado ?? data.id;
          setEmpleadoActual(data);
          setForm((p) => ({ ...p, id_empleado: String(id || "") }));
        } catch (e) {
          console.error("empleados/me", e);
        }

        // Estados compra + proveedores + insumos
        const [est, prov, ins] = await Promise.all([
          api.get("/api/estados-compra/"),
          api.get("/api/proveedores/"),
          api.get("/api/insumos/"),
        ]);
        const estadosArr = norm(est);
        const proveedoresArr = norm(prov);
        const insArr = norm(ins);

        // 👉 proveedores SOLO activos
        const proveedoresActivos = proveedoresArr.filter((p) => {
          const est = String(p.estado_nombre ?? p.prov_estado ?? "").toLowerCase();
          const idEst = Number(p.id_estado_proveedor ?? p.estado ?? 0);
          return est === "activo" || idEst === 1;
        });

        setEstados(estadosArr);
        setProveedores(proveedoresActivos);
        setInsumosAll(insArr);

        // fijar estado “En Proceso”
        const enProc =
          estadosArr.find(
            (s) =>
              String(s.estcom_nombre ?? s.nombre ?? "").toLowerCase() ===
              "en proceso"
          ) ||
          estadosArr.find(
            (s) => String(s.nombre ?? "").toLowerCase() === "en proceso"
          );
        if (enProc) {
          setForm((p) => ({
            ...p,
            id_estado_compra: String(
              enProc.id_estado_compra ?? enProc.id
            ),
          }));
        } else {
          setMsg((m) =>
            (m ? m + "\n" : "") + "No se encontró estado 'En Proceso'."
          );
        }
      } catch (e) {
        console.error(e);
        setMsg("No se pudieron cargar catálogos.");
      }
    })();
  }, []);

  // ====== cuando cambia proveedor: traer vínculos proveedor-insumo ======
  useEffect(() => {
    (async () => {
      if (!form.id_proveedor) {
        setLinksProvInsumo([]);
        return;
      }
      try {
        const res = await api.get(
          `/api/proveedores-insumos/?id_proveedor=${form.id_proveedor}`
        );
        const arr = norm(res);
        setLinksProvInsumo(arr);
        setRows([
          { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
        ]);
      } catch (e) {
        console.error(e);
        setLinksProvInsumo([]);
        setMsg("No se pudieron cargar insumos del proveedor.");
      }
    })();
  }, [form.id_proveedor]);

  // insumos disponibles = solo los vinculados al proveedor elegido
  const insumosDisponibles = useMemo(() => {
    if (!linksProvInsumo.length) return [];
    const ids = new Set(linksProvInsumo.map((l) => Number(l.id_insumo)));
    return (insumosAll || []).filter((i) => ids.has(Number(i.id_insumo)));
  }, [linksProvInsumo, insumosAll]);

  // ====== handlers ======
  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const setRow = (i, k, v) => {
    const n = [...rows];
    n[i] = {
      ...n[i],
      [k]: k.includes("cantidad") ? toDec(v) : v,
    };

    // si cambió el insumo: autocompletar precio con el guardado
    if (k === "id_insumo") {
      const pid = Number(v || 0);
      const precio = Number(precioByInsumo.get(pid) || 0);
      n[i].detcom_precio_uni = precio > 0 ? String(precio) : "";
    }

    setRows(n);
  };

  const addRow = () =>
    setRows((p) => [
      ...p,
      { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
    ]);
  const removeRow = (i) => setRows((p) => p.filter((_, idx) => idx !== i));

  const calcSubtotal = (r) => {
    const c = Number(r.detcom_cantidad || 0);
    const p = Number(r.detcom_precio_uni || 0);
    return c * p;
  };
  const total = rows.reduce((acc, r) => acc + calcSubtotal(r), 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.id_empleado) {
      setMsg("No se reconoció el empleado actual.");
      return;
    }
    if (!form.id_estado_compra) {
      setMsg("No se pudo fijar el estado 'En Proceso'.");
      return;
    }
    if (!form.id_proveedor) {
      setMsg("Seleccioná un proveedor.");
      return;
    }
    if (!linksProvInsumo.length) {
      setMsg("El proveedor no tiene insumos vinculados.");
      return;
    }
    for (const r of rows) {
      if (!r.id_insumo) {
        setMsg("Completá todos los insumos del detalle.");
        return;
      }
      if (!(Number(r.detcom_cantidad) > 0)) {
        setMsg("La cantidad debe ser > 0.");
        return;
      }
      const precioRel = Number(precioByInsumo.get(Number(r.id_insumo)) || 0);
      if (!(precioRel > 0)) {
        setMsg(
          "El precio guardado en el proveedor para ese insumo debe ser > 0."
        );
        return;
      }
    }

    try {
      // 1) cabecera (fecha/hora = ahora)
      const body = {
        id_empleado: Number(form.id_empleado),
        id_estado_compra: Number(form.id_estado_compra),
        id_proveedor: Number(form.id_proveedor),
        com_fecha_hora: nowSQL(),
        com_monto: Number(total.toFixed(2)),
        com_descripcion: form.com_descripcion || "",
        com_pagado: Number(form.com_pagado || 2), // 1 = Sí, 2 = No
      };
      const created = await api.post("/api/compras/", body);
      const compraId = created?.data?.id_compra ?? created?.data?.id;

      // 2) detalle (NO enviar detcom_subtotal)
      for (const r of rows) {
        const pid = Number(r.id_insumo);
        const precio = Number(precioByInsumo.get(pid) || 0);
        await api.post("/api/detalle-compras/", {
          id_compra: Number(compraId),
          id_insumo: pid,
          detcom_cantidad: Number(r.detcom_cantidad),
          detcom_precio_uni: Number(precio.toFixed(3)),
        });
      }

      setMsg("Compra registrada");
      setTimeout(() => nav("/compras"), 700);
    } catch (err) {
      console.error(err);
      const apiMsg = err?.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : "No se pudo registrar.";
      setMsg(apiMsg);
    }
  };

  const estadoNombre = useMemo(() => {
    const it = estados.find(
      (s) =>
        String(s.id_estado_compra ?? s.id) ===
        String(form.id_estado_compra)
    );
    return it?.estcom_nombre ?? it?.nombre ?? "";
  }, [estados, form.id_estado_compra]);

  return (
    <DashboardLayout>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Registrar Compra</h2>
      {msg && <pre style={{ whiteSpace: "pre-wrap" }}>{msg}</pre>}

      <form onSubmit={onSubmit} className="form">
        {/* Empleado actual */}
        <div className="row">
          <label>Empleado =</label>
          <input
            value={empleadoActual ? empleadoLabel(empleadoActual) : "—"}
            disabled
          />
        </div>

        {/* Proveedor (solo activos) */}
        <div className="row">
          <label>Proveedor =</label>
          <select
            name="id_proveedor"
            value={form.id_proveedor}
            onChange={onChange}
            required
          >
            <option value="">-- Seleccioná --</option>
            {proveedores.map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.prov_nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="row">
          <label>Estado =</label>
          <input value={estadoNombre || "En Proceso"} disabled />
        </div>

        {/* Fecha/hora */}
        <div className="row">
          <label>Fecha y hora =</label>
          <input value="Se tomará la del momento de registro" disabled />
        </div>

        {/* Descripción */}
        <div className="row">
          <label>Descripción =</label>
          <input
            name="com_descripcion"
            value={form.com_descripcion}
            onChange={onChange}
            placeholder="Opcional"
          />
        </div>

        {/* Pagado */}
        <div className="row">
          <label>Pagado =</label>
          <select
            name="com_pagado"
            value={form.com_pagado}
            onChange={onChange}
          >
            <option value="2">No</option>
            <option value="1">Sí</option>
          </select>
        </div>

        {/* Detalle */}
        <h3 style={{ marginTop: 18, marginBottom: 8 }}>Detalle</h3>
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Insumo (vinculado al proveedor)</th>
                <th style={{ width: 140 }}>Cantidad</th>
                <th style={{ width: 160 }}>Precio unit. (fijado)</th>
                <th style={{ width: 140 }}>Subtotal</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const selectedId = Number(r.id_insumo || 0);
                const usedIds = new Set(
                  rows
                    .filter((_, idx) => idx !== i)
                    .map((rr) => Number(rr.id_insumo || 0))
                );

                // insumos sin repetir entre renglones
                const opcionesInsumos = insumosDisponibles.filter((ins) => {
                  const idIns = Number(ins.id_insumo || 0);
                  if (!idIns) return false;
                  if (idIns === selectedId) return true; // mantener el actual
                  return !usedIds.has(idIns);           // ocultar si ya está elegido en otro renglón
                });

                return (
                  <tr key={i}>
                    <td>
                      <select
                        value={r.id_insumo}
                        onChange={(e) =>
                          setRow(i, "id_insumo", e.target.value)
                        }
                        disabled={
                          !form.id_proveedor || !insumosDisponibles.length
                        }
                      >
                        <option value="">-- Seleccioná --</option>
                        {opcionesInsumos.map((ins) => (
                          <option
                            key={ins.id_insumo}
                            value={ins.id_insumo}
                          >
                            {ins.ins_nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={r.detcom_cantidad}
                        onChange={(e) =>
                          setRow(i, "detcom_cantidad", e.target.value)
                        }
                        onKeyDown={blockInvalidDecimal}
                        placeholder="0.000"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={
                          r.id_insumo
                            ? String(
                                precioByInsumo.get(Number(r.id_insumo)) ?? ""
                              )
                            : ""
                        }
                        readOnly
                        placeholder="—"
                        style={{ opacity: 0.75 }}
                        title="Precio desde proveedor-insumo"
                      />
                    </td>
                    <td>
                      $
                      {calcSubtotal({
                        ...r,
                        detcom_precio_uni:
                          precioByInsumo.get(Number(r.id_insumo)) ?? 0,
                      }).toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => removeRow(i)}
                        disabled={rows.length === 1}
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

        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addRow}
            disabled={!form.id_proveedor || !insumosDisponibles.length}
          >
            Agregar renglón
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <strong>Total = ${total.toFixed(2)}</strong>
        </div>

        <div>
          <button type="submit" className="btn btn-primary">
            Registrar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => nav("/compras")}
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
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;




