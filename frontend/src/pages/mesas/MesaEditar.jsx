import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalize(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp?.results) return resp.results;
  if (resp?.data) return resp.data;
  return [];
}

export default function MesaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estados, setEstados] = useState([]);
  const [form, setForm] = useState({
    ms_numero: "",
    id_estado_mesa: "",
  });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/api/estados-mesa/").then(({data}) => setEstados(normalize(data))).catch(()=>{});
    api.get(`/api/mesas/${id}/`).then(({data}) => {
      setForm({
        ms_numero: String(data.ms_numero ?? ""),
        id_estado_mesa: String(
          data.id_estado_mesa?.id_estado_mesa ?? data.id_estado_mesa ?? ""
        ),
      });
    }).catch(e => {
      console.error(e);
      setMsg("No se pudo cargar la mesa.");
    });
  }, [id]);

  const sanitizeInt = (raw) => (raw ?? "").toString().replace(/[^\d]/g, "");
  const blockInvalidInt = (e) => {
    if (["-","+","e","E",".",","," "].includes(e.key)) e.preventDefault();
  };

  const validateField = (name, value) => {
    switch (name) {
      case "ms_numero":
        if (!value) return "Ingresá el número de mesa.";
        if (!/^\d+$/.test(String(value))) return "Debe ser entero (1+).";
        if (Number(value) < 1) return "Debe ser 1 o mayor.";
        return "";
      case "id_estado_mesa":
        if (!String(value).trim()) return "Seleccioná estado.";
        return "";
      default:
        return "";
    }
  };

  const onChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "ms_numero") value = sanitizeInt(value);
    const next = { ...form, [name]: value };
    setForm(next);
    setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const eAll = {};
    Object.keys(form).forEach(k => {
      const m = validateField(k, form[k]); if (m) eAll[k] = m;
    });
    setErrors(eAll);
    if (Object.keys(eAll).length) return;

    try {
      await api.put(`/api/mesas/${id}/`, {
        ms_numero: Number(form.ms_numero),
        id_estado_mesa: Number(form.id_estado_mesa),
      });
      setMsg("Mesa actualizada");
      setTimeout(() => navigate("/mesas"), 700);
    } catch (err) {
      console.error(err);
      setMsg("No se pudo actualizar la mesa.");
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{margin:0, marginBottom:12}}>Editar Mesa</h2>
      {msg && <p>{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <div className="row">
          <label htmlFor="ms_numero">Número =</label>
          <input
            id="ms_numero"
            name="ms_numero"
            type="text"
            inputMode="numeric"
            value={form.ms_numero}
            onChange={onChange}
            onKeyDown={blockInvalidInt}
            required
          />
        </div>
        {errors.ms_numero && <small className="err">{errors.ms_numero}</small>}

        <div className="row">
          <label htmlFor="id_estado_mesa">Estado =</label>
          <select
            id="id_estado_mesa"
            name="id_estado_mesa"
            value={form.id_estado_mesa}
            onChange={onChange}
            required
          >
            <option value="">-- Seleccioná --</option>
            {estados.map(e => (
              <option key={e.id_estado_mesa} value={e.id_estado_mesa}>{e.estms_nombre}</option>
            ))}
          </select>
        </div>
        {errors.id_estado_mesa && <small className="err">{errors.id_estado_mesa}</small>}

        <div>
          <button type="submit" className="btn btn-primary">Guardar cambios</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/mesas")} style={{marginLeft:10}}>Cancelar</button>
        </div>
      </form>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.form .row { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
.form label { min-width:220px; text-align:right; color:#d1d5db; }
.err { color:#fca5a5; font-size:12px; margin-top:-6px; display:block; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;

