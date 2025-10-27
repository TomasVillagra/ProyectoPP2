import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

const toDec = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  let s = String(v).replace(/,/g, ".").replace(/[^\d.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts.shift() + "." + parts.join("");
  return s;
};
const blockInvalidDecimal = e => {
  const bad = ["-", "+", "e", "E", " "];
  if (bad.includes(e.key)) e.preventDefault();
};
const norm = (d) => Array.isArray(d) ? d : (d?.results || d?.data || []);

export default function CompraEditar() {
  const { id } = useParams();
  const nav = useNavigate();
  const [empleados, setEmpleados] = useState([]);
  const [estados, setEstados] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]); // ⬅️ NUEVO

  const [form, setForm] = useState({
    id_empleado: "",
    id_estado_compra: "",
    id_proveedor: "",      // ⬅️ NUEVO
    com_descripcion: "",
    com_fecha_hora: "",    // solo visual
  });

  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [emp, est, ins, prov, comp, dets] = await Promise.all([
          api.get("/api/empleados/"),
          api.get("/api/estados-compra/"),
          api.get("/api/insumos/"),
          api.get("/api/proveedores/"),               // ⬅️ NUEVO
          api.get(`/api/compras/${id}/`),
          api.get(`/api/detalle-compras/?id_compra=${id}`),
        ]);
        setEmpleados(norm(emp.data));
        setEstados(norm(est.data));
        setInsumos(norm(ins.data));
        setProveedores(norm(prov.data));             // ⬅️ NUEVO

        const c = comp.data;
        setForm({
          id_empleado: String(c.id_empleado ?? ""),
          id_estado_compra: String(c.id_estado_compra ?? ""),
          id_proveedor: String(c.id_proveedor ?? ""), // ⬅️ NUEVO
          com_descripcion: c.com_descripcion ?? "",
          com_fecha_hora: c.com_fecha_hora ?? "",
        });

        const r = norm(dets.data).map(d => ({
          id_detalle_compra: d.id_detalle_compra,
          id_insumo: String(d.id_insumo),
          detcom_cantidad: String(d.detcom_cantidad),
          detcom_precio_uni: String(d.detcom_precio_uni),
        }));
        setRows(r.length ? r : [{ id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" }]);
      } catch (e) { console.error(e); }
    })();
  }, [id]);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const setRow = (i, k, v) => {
    const n = [...rows];
    n[i] = { ...n[i], [k]: (k.includes("precio") || k.includes("cantidad")) ? toDec(v) : v };
    setRows(n);
  };
  const addRow = () => setRows(p => [...p, { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" }]);
  const removeRow = (i) => setRows(p => p.filter((_, idx) => idx !== i));

  const calcSubtotal = (r) => Number(r.detcom_cantidad || 0) * Number(r.detcom_precio_uni || 0);
  const total = rows.reduce((acc, r) => acc + calcSubtotal(r), 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.id_empleado || !form.id_estado_compra) {
      setMsg("Seleccioná empleado y estado.");
      return;
    }
    if (!form.id_proveedor) { // ⬅️ NUEVO (si querés opcional, quitá esta validación)
      setMsg("Seleccioná un proveedor.");
      return;
    }
    for (const r of rows) {
      if (!r.id_insumo) { setMsg("Completá todos los insumos."); return; }
      if (!(Number(r.detcom_cantidad) > 0)) { setMsg("Cantidad > 0."); return; }
      if (!(Number(r.detcom_precio_uni) > 0)) { setMsg("Precio > 0."); return; }
    }

    try {
      // 1) Actualizar cabecera
      await api.put(`/api/compras/${id}/`, {
        id_empleado: Number(form.id_empleado),
        id_estado_compra: Number(form.id_estado_compra),
        id_proveedor: Number(form.id_proveedor), // ⬅️ NUEVO
        com_monto: Number(total.toFixed(2)),
        com_descripcion: form.com_descripcion || "",
        com_fecha_hora: form.com_fecha_hora || null, // opcional
      });

      // 2) Reemplazar detalles
      const existing = await api.get(`/api/detalle-compras/?id_compra=${id}`);
      for (const d of norm(existing.data)) {
        const detId = d.id_detalle_compra ?? d.id;
        if (detId) await api.delete(`/api/detalle-compras/${detId}/`);
      }
      for (const r of rows) {
        await api.post("/api/detalle-compras/", {
          id_compra: Number(id),
          id_insumo: Number(r.id_insumo),
          detcom_cantidad: Number(r.detcom_cantidad),
          detcom_precio_uni: Number(r.detcom_precio_uni),
          detcom_subtotal: Number(calcSubtotal(r).toFixed(3)),
        });
      }

      setMsg("Compra actualizada");
      setTimeout(() => nav("/compras"), 700);
    } catch (err) {
      console.error(err);
      setMsg("No se pudo actualizar");
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{margin:0, marginBottom:12}}>Editar Compra #{id}</h2>
      {msg && <p>{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <div className="row">
          <label>Empleado =</label>
          <select name="id_empleado" value={form.id_empleado} onChange={onChange} required>
            <option value="">-- Seleccioná --</option>
            {empleados.map(e => (
              <option key={e.id_empleado} value={e.id_empleado}>
                {e.emp_nombre} {e.emp_apellido}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label>Proveedor =</label> {/* ⬅️ NUEVO */}
          <select name="id_proveedor" value={form.id_proveedor} onChange={onChange} required>
            <option value="">-- Seleccioná --</option>
            {proveedores.map(p => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.prov_nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label>Estado =</label>
          <select name="id_estado_compra" value={form.id_estado_compra} onChange={onChange} required>
            <option value="">-- Seleccioná --</option>
            {estados.map(s => (
              <option key={s.id_estado_compra} value={s.id_estado_compra}>{s.estcom_nombre}</option>
            ))}
          </select>
        </div>

        <div className="row">
          <label>Descripción =</label>
          <input name="com_descripcion" value={form.com_descripcion} onChange={onChange} placeholder="Opcional" />
        </div>

        <div className="row">
          <label>Fecha/Hora =</label>
          <input name="com_fecha_hora" value={form.com_fecha_hora} onChange={onChange} placeholder="YYYY-MM-DD HH:MM:SS" />
        </div>

        <h3 style={{marginTop:18, marginBottom:8}}>Detalle</h3>
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Insumo</th>
                <th style={{width:140}}>Cantidad</th>
                <th style={{width:160}}>Precio unit.</th>
                <th style={{width:140}}>Subtotal</th>
                <th style={{width:100}}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <select value={r.id_insumo} onChange={e => setRow(i, "id_insumo", e.target.value)}>
                      <option value="">-- Seleccioná --</option>
                      {insumos.map(ins => (
                        <option key={ins.id_insumo} value={ins.id_insumo}>{ins.ins_nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={r.detcom_cantidad}
                      onChange={e => setRow(i, "detcom_cantidad", e.target.value)}
                      onKeyDown={blockInvalidDecimal}
                      placeholder="0.000"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={r.detcom_precio_uni}
                      onChange={e => setRow(i, "detcom_precio_uni", e.target.value)}
                      onKeyDown={blockInvalidDecimal}
                      placeholder="0.000"
                    />
                  </td>
                  <td>${(Number(r.detcom_cantidad || 0) * Number(r.detcom_precio_uni || 0)).toFixed(2)}</td>
                  <td>
                    <button type="button" className="btn btn-secondary" onClick={() => removeRow(i)} disabled={rows.length===1}>Quitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{marginTop:8, marginBottom:12}}>
          <button type="button" className="btn btn-secondary" onClick={addRow}>Agregar renglón</button>
        </div>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
          <strong>Total = ${total.toFixed(2)}</strong>
        </div>

        <div>
          <button type="submit" className="btn btn-primary">Guardar</button>
          <button type="button" className="btn btn-secondary" onClick={() => nav("/compras")} style={{marginLeft:10}}>Cancelar</button>
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

