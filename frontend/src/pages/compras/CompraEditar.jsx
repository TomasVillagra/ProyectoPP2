import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

// ===== Utils =====
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

const getInsumoId = (d) =>
  d?.id_insumo?.id_insumo ??
  d?.id_insumo_id ??
  d?.id_insumo ??
  "";

// ===== Componente =====
export default function CompraEditar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [empleados, setEmpleados] = useState([]);
  const [estados, setEstados] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [form, setForm] = useState({
    id_empleado: "",
    id_estado_compra: "",
    id_proveedor: "",
    com_descripcion: "",
    com_fecha_hora: "",
    com_pagado: "2", // 1 = Sí, 2 = No
  });

  const [rows, setRows] = useState([
    { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
  ]);

  const [msg, setMsg] = useState("");

  // ===== Carga inicial =====
  useEffect(() => {
    const load = async () => {
      try {
        const [emp, est, ins, prov, comp, det] = await Promise.all([
          api.get("/api/empleados/"),
          api.get("/api/estados-compra/"),
          api.get("/api/insumos/"),
          api.get("/api/proveedores/"),
          api.get(`/api/compras/${id}/`),
          api.get(`/api/detalle-compras/?id_compra=${id}`),
        ]);

        const empleadosArr = norm(emp);
        const estadosArr = norm(est);
        const insumosArr = norm(ins);
        const proveedoresArr = norm(prov);
        const compra = comp.data;
        const detalle = norm(det);

        setEmpleados(empleadosArr);
        setEstados(estadosArr);
        setInsumos(insumosArr);
        setProveedores(proveedoresArr);

        setForm({
          id_empleado: String(compra.id_empleado ?? ""),
          id_estado_compra: String(compra.id_estado_compra ?? ""),
          id_proveedor: String(compra.id_proveedor ?? ""),
          com_descripcion: compra.com_descripcion ?? "",
          com_fecha_hora: compra.com_fecha_hora ?? "",
          com_pagado: String(compra.com_pagado ?? "2"),
        });

        const filas = detalle.map((d) => ({
          id_detalle_compra: d.id_detalle_compra ?? d.id,
          id_insumo: String(getInsumoId(d) ?? ""),
          detcom_cantidad: String(d.detcom_cantidad ?? ""),
          detcom_precio_uni: String(d.detcom_precio_uni ?? ""),
        }));

        setRows(
          filas.length
            ? filas
            : [{ id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" }]
        );
      } catch (err) {
        console.error(err);
        setMsg("No se pudo cargar la compra.");
      }
    };

    load();
  }, [id]);

  // ===== Handlers =====
  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const setRow = (index, field, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]:
          field.includes("cantidad") || field.includes("precio")
            ? toDec(value)
            : value,
      };
      return copy;
    });
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
    ]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const calcSubtotal = (row) =>
    Number(row.detcom_cantidad || 0) * Number(row.detcom_precio_uni || 0);

  const total = useMemo(
    () => rows.reduce((acc, r) => acc + calcSubtotal(r), 0),
    [rows]
  );

  // ===== Guardar =====
  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.id_empleado || !form.id_estado_compra) {
      setMsg("Seleccioná empleado y estado.");
      return;
    }
    if (!form.id_proveedor) {
      setMsg("Seleccioná un proveedor.");
      return;
    }

    for (const r of rows) {
      if (!r.id_insumo) {
        setMsg("Completá todos los insumos.");
        return;
      }
      if (!(Number(r.detcom_cantidad) > 0)) {
        setMsg("La cantidad debe ser mayor a 0.");
        return;
      }
      if (!(Number(r.detcom_precio_uni) > 0)) {
        setMsg("El precio debe ser mayor a 0.");
        return;
      }
    }

    try {
      // 1) Actualizar cabecera
      await api.put(`/api/compras/${id}/`, {
        id_empleado: Number(form.id_empleado),
        id_estado_compra: Number(form.id_estado_compra),
        id_proveedor: Number(form.id_proveedor),
        com_monto: Number(total.toFixed(2)),
        com_descripcion: form.com_descripcion || "",
        com_fecha_hora: form.com_fecha_hora || null,
        com_pagado: Number(form.com_pagado || 2),
      });

      // 2) Borrar detalles existentes
      const detResp = await api.get(`/api/detalle-compras/?id_compra=${id}`);
      for (const d of norm(detResp)) {
        const detId = d.id_detalle_compra ?? d.id;
        if (detId) {
          await api.delete(`/api/detalle-compras/${detId}/`);
        }
      }

      // 3) Crear nuevos detalles
      for (const r of rows) {
        await api.post("/api/detalle-compras/", {
          id_compra: Number(id),
          id_insumo: Number(r.id_insumo),
          detcom_cantidad: Number(r.detcom_cantidad),
          detcom_precio_uni: Number(r.detcom_precio_uni),
        });
      }

      setMsg("Compra actualizada correctamente.");
      setTimeout(() => navigate("/compras"), 800);
    } catch (err) {
      console.error(err);
      setMsg("No se pudo actualizar la compra.");
    }
  };

  // ===== Insumos sin repetir por fila =====
  const opcionesInsumosPorFila = (index) => {
    const selectedId = Number(rows[index]?.id_insumo || 0);
    const usedIds = new Set(
      rows
        .filter((_, i) => i !== index)
        .map((r) => Number(r.id_insumo || 0))
    );

    return insumos.filter((ins) => {
      const idIns = Number(ins.id_insumo ?? ins.id ?? 0);
      if (!idIns) return false;
      if (idIns === selectedId) return true;
      return !usedIds.has(idIns);
    });
  };

  return (
    <DashboardLayout>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Editar Compra #{id}</h2>
      {msg && <p style={{ whiteSpace: "pre-wrap" }}>{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        {/* Empleado */}
        <div className="row">
          <label>Empleado =</label>
          <select
            name="id_empleado"
            value={form.id_empleado}
            onChange={onChange}
            required
          >
            <option value="">-- Seleccioná --</option>
            {empleados.map((e) => (
              <option key={e.id_empleado ?? e.id} value={e.id_empleado ?? e.id}>
                {(e.emp_nombre ?? e.nombre ?? "") +
                  " " +
                  (e.emp_apellido ?? e.apellido ?? "")}
              </option>
            ))}
          </select>
        </div>

        {/* Proveedor (solo activos + el actual) */}
        <div className="row">
          <label>Proveedor =</label>
          <select
            name="id_proveedor"
            value={form.id_proveedor}
            onChange={onChange}
            required
          >
            <option value="">-- Seleccioná --</option>
            {proveedores
              .filter((p) => {
                const est = String(p.estado_nombre ?? p.prov_estado ?? "").toLowerCase();
                const idEst = Number(p.id_estado_proveedor ?? p.estado ?? 0);
                const isActivo = est === "activo" || idEst === 1;
                const idProv = String(p.id_proveedor ?? p.id ?? "");
                return isActivo || idProv === String(form.id_proveedor);
              })
              .map((p) => (
                <option key={p.id_proveedor ?? p.id} value={p.id_proveedor ?? p.id}>
                  {p.prov_nombre ?? p.nombre}
                </option>
              ))}
          </select>
        </div>

        {/* Estado */}
        <div className="row">
          <label>Estado =</label>
          <select
            name="id_estado_compra"
            value={form.id_estado_compra}
            onChange={onChange}
            required
          >
            <option value="">-- Seleccioná --</option>
            {estados.map((s) => (
              <option
                key={s.id_estado_compra ?? s.id}
                value={s.id_estado_compra ?? s.id}
              >
                {s.estcom_nombre ?? s.nombre}
              </option>
            ))}
          </select>
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

        {/* Fecha / Hora */}
        <div className="row">
          <label>Fecha/Hora =</label>
          <input
            name="com_fecha_hora"
            value={form.com_fecha_hora}
            onChange={onChange}
            placeholder="YYYY-MM-DD HH:MM:SS"
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
                <th>Insumo</th>
                <th style={{ width: 140 }}>Cantidad</th>
                <th style={{ width: 160 }}>Precio unit.</th>
                <th style={{ width: 140 }}>Subtotal</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const opciones = opcionesInsumosPorFila(i);
                return (
                  <tr key={i}>
                    <td>
                      <select
                        value={r.id_insumo}
                        onChange={(e) =>
                          setRow(i, "id_insumo", e.target.value)
                        }
                      >
                        <option value="">-- Seleccioná --</option>
                        {opciones.map((ins) => (
                          <option
                            key={ins.id_insumo ?? ins.id}
                            value={ins.id_insumo ?? ins.id}
                          >
                            {ins.ins_nombre ?? ins.nombre}
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
                        value={r.detcom_precio_uni}
                        onChange={(e) =>
                          setRow(i, "detcom_precio_uni", e.target.value)
                        }
                        onKeyDown={blockInvalidDecimal}
                        placeholder="0.000"
                      />
                    </td>
                    <td>${calcSubtotal(r).toFixed(2)}</td>
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
          <button type="button" className="btn btn-secondary" onClick={addRow}>
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
            Guardar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/compras")}
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





