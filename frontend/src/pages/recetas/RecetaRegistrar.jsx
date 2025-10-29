import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalizeList(respData) {
  if (Array.isArray(respData)) return respData;
  if (respData?.results && Array.isArray(respData.results)) return respData.results;
  if (respData?.data && Array.isArray(respData.data)) return respData.data;
  return [];
}

export default function RecetaRegistrar() {
  const navigate = useNavigate();
  const [platos, setPlatos] = useState([]);
  const [insumos, setInsumos] = useState([]);

  const [form, setForm] = useState({
    rec_nombre: "",
    id_plato: "",
    rec_descripcion: "",
    id_estado_receta: "1",
  });

  const [detalles, setDetalles] = useState([
    { id_insumo: "", detr_cant_unid: "" }
  ]);

  const [errors, setErrors] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchBase = async () => {
      try {
        const [plRes, insRes] = await Promise.all([
          api.get("/api/platos/"),
          api.get("/api/insumos/")
        ]);
        setPlatos(normalizeList(plRes.data));
        setInsumos(normalizeList(insRes.data));
      } catch (e) {
        console.error(e);
      }
    };
    fetchBase();
  }, []);

  // —— helpers
  const sanitizeDecimal = (raw) => {
    if (raw === "" || raw === null || raw === undefined) return "";
    let s = String(raw).replace(/,/g, ".").replace(/[^\d.]/g, "");
    const parts = s.split(".");
    if (parts.length > 2) s = parts.shift() + "." + parts.join("");
    return s;
  };
  const blockInvalidDecimal = (e) => {
    const invalid = ["-", "+", "e", "E", " "];
    if (invalid.includes(e.key)) e.preventDefault();
  };

  const validateField = (name, value) => {
    switch (name) {
      case "rec_nombre":
        if (!String(value).trim()) return "Ingresá un nombre.";
        return "";
      case "id_plato":
        if (!String(value).trim()) return "Seleccioná un plato.";
        return "";
      default:
        return "";
    }
  };

  const validateDetalles = (rows) => {
    const errs = {};
    rows.forEach((r, idx) => {
      const e = {};
      if (!String(r.id_insumo).trim()) e.id_insumo = "Seleccioná un insumo.";
      const num = Number(r.detr_cant_unid);
      if (r.detr_cant_unid === "" || Number.isNaN(num) || num <= 0) {
        e.detr_cant_unid = "Cantidad debe ser > 0.";
      }
      if (Object.keys(e).length) errs[idx] = e;
    });
    return errs;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const onChangeDetalle = (idx, name, value) => {
    const rows = [...detalles];
    let v = value;
    if (name === "detr_cant_unid") v = sanitizeDecimal(value);
    rows[idx] = { ...rows[idx], [name]: v };
    setDetalles(rows);

    const re = validateDetalles(rows);
    setRowErrors(re);
  };

  const addRow = () => {
    setDetalles((p) => [...p, { id_insumo: "", detr_cant_unid: "" }]);
  };

  const removeRow = (idx) => {
    setDetalles((p) => p.filter((_, i) => i !== idx));
    setRowErrors((prev) => {
      const n = { ...prev };
      delete n[idx];
      return n;
    });
  };

  // ── REGLA 1: un plato no puede tener más de una receta
  const platoYaTieneReceta = async (platoId) => {
    try {
      const { data } = await api.get("/api/recetas/", { params: { id_plato: Number(platoId), page_size: 1 } });
      const list = normalizeList(data);
      // Si viene id_plato o estructura embebida, comparamos
      return list.some(r => {
        const rp = r.id_plato ?? r?.plato?.id_plato ?? r?.plato;
        return Number(rp) === Number(platoId);
      });
    } catch (e) {
      // fallback: si tu API no filtra por id_plato, chequeamos todos (limit razonable)
      try {
        const all = await api.get("/api/recetas/", { params: { page_size: 1000 } });
        const list = normalizeList(all.data);
        return list.some(r => {
          const rp = r.id_plato ?? r?.plato?.id_plato ?? r?.plato;
          return Number(rp) === Number(platoId);
        });
      } catch {
        return false;
      }
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    // validar cabecera
    const eAll = {};
    Object.keys(form).forEach((k) => {
      const m = validateField(k, form[k]);
      if (m) eAll[k] = m;
    });
    setErrors(eAll);

    // validar detalles
    const detErrs = validateDetalles(detalles);
    setRowErrors(detErrs);

    if (Object.keys(eAll).length || Object.keys(detErrs).length) return;

    // REGLA 1 (crear): si el plato ya tiene receta, alert y cancelar
    if (await platoYaTieneReceta(form.id_plato)) {
      alert("Este plato ya tiene una receta. No se puede crear otra.");
      return;
    }

    try {
      // 1) Crear receta
      const createBody = {
        rec_nombre: form.rec_nombre,
        id_plato: Number(form.id_plato),
        rec_desc: form.rec_descripcion,
        id_estado_receta: Number(form.id_estado_receta),
      };
      const created = await api.post("/api/recetas/", createBody);
      const recId = created?.data?.id_receta ?? created?.data?.id ?? null;
      if (!recId) throw new Error("No se obtuvo id de la receta creada");

      // 2) Crear detalles
      for (const d of detalles) {
        await api.post("/api/detalle-recetas/", {
          id_receta: Number(recId),
          id_insumo: Number(d.id_insumo),
          detr_cant_unid: Number(d.detr_cant_unid),
        });
      }

      setMsg("Receta creada");
      setTimeout(() => navigate("/recetas"), 800);
    } catch (err) {
      console.error(err);
      setMsg("No se pudo crear la receta");
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{margin:0, marginBottom:12}}>Registrar Receta</h2>
      {msg && <p>{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        {/* Cabecera */}
        <div className="row">
          <label htmlFor="rec_nombre">Nombre =</label>
          <input id="rec_nombre" name="rec_nombre" value={form.rec_nombre} onChange={onChange} required />
        </div>
        {errors.rec_nombre && <small className="err">{errors.rec_nombre}</small>}

        <div className="row">
          <label htmlFor="id_plato">Plato =</label>
          <select id="id_plato" name="id_plato" value={form.id_plato} onChange={onChange} required>
            <option value="">-- Seleccioná --</option>
            {platos.map((p) => {
              const id = p.id_plato ?? p.id;
              const nombre = p.pla_nombre ?? p.plt_nombre ?? p.nombre ?? `#${id}`;
              return <option key={id} value={id}>{nombre}</option>;
            })}
          </select>
        </div>
        {errors.id_plato && <small className="err">{errors.id_plato}</small>}

        <div className="row">
          <label htmlFor="rec_descripcion">Descripción =</label>
          <textarea id="rec_descripcion" name="rec_descripcion" rows={4} value={form.rec_descripcion} onChange={onChange} />
        </div>

        <div className="row">
          <label htmlFor="id_estado_receta">Estado =</label>
          <select id="id_estado_receta" name="id_estado_receta" value={form.id_estado_receta} onChange={onChange} required>
            <option value="1">Activo</option>
            <option value="2">Inactivo</option>
          </select>
        </div>

        {/* Detalles */}
        <h3 style={{marginTop:18, marginBottom:8, color:"#fff"}}>Detalles de la Receta</h3>
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th style={{width:"55%"}}>Insumo</th>
                <th style={{width:"25%"}}>Cantidad</th>
                <th style={{width:"20%"}}></th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((row, idx) => {
                const e = rowErrors[idx] || {};
                return (
                  <tr key={idx}>
                    <td>
                      <select
                        value={row.id_insumo}
                        onChange={(ev) => onChangeDetalle(idx, "id_insumo", ev.target.value)}
                      >
                        <option value="">-- Seleccioná insumo --</option>
                        {insumos.map((i) => {
                          const id = i.id_insumo ?? i.id;
                          const nombre = i.ins_nombre ?? i.nombre ?? `#${id}`;
                          const unidad = i.ins_unidad ?? i.unidad ?? "";
                          return (
                            <option key={id} value={id}>
                              {nombre}{unidad ? ` (${unidad})` : ""}
                            </option>
                          );
                        })}
                      </select>
                      {e.id_insumo && <small className="err-inline">{e.id_insumo}</small>}
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.detr_cant_unid}
                        onChange={(ev) => onChangeDetalle(idx, "detr_cant_unid", ev.target.value)}
                        onKeyDown={blockInvalidDecimal}
                        placeholder="0.00"
                      />
                      {e.detr_cant_unid && <small className="err-inline">{e.detr_cant_unid}</small>}
                    </td>
                    <td style={{textAlign:"right"}}>
                      <button type="button" className="btn btn-secondary" onClick={() => removeRow(idx)} disabled={detalles.length === 1}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{marginTop:8, marginBottom:14}}>
          <button type="button" className="btn btn-secondary" onClick={addRow}>Agregar renglón</button>
        </div>

        <div>
          <button type="submit" className="btn btn-primary">Registrar</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/recetas")} style={{marginLeft:10}}>Cancelar</button>
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
.err { color:#fca5a5; font-size:12px; margin-top:-6px; display:block; margin-left:232px; }
.err-inline { color:#fca5a5; font-size:12px; display:block; margin-top:6px; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;


