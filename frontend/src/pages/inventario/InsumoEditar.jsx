import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

const ESTADOS = [ { id: 1, label: "Activo" }, { id: 2, label: "Inactivo" } ];
const UNIDADES = ["u", "kg", "g", "l", "ml"];

// 👉 helper nuevo para normalizar (ignorar mayúsculas y espacios)
const normalizeName = (s) => (s || "").toLowerCase().replace(/\s+/g, "");

export default function InsumoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    ins_nombre: "",
    ins_unidad: "",
    ins_stock_actual: "",
    ins_punto_reposicion: "",
    ins_stock_min: "",
    ins_stock_max: "",
    id_estado_insumo: "1",
  });
  const [errors, setErrors] = useState({});
  const [originalName, setOriginalName] = useState(""); // ← para permitir el mismo nombre

  const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

  const validate = (values) => {
    const e = {};
    const nombre = (values.ins_nombre || "").trim();
    const unidad = (values.ins_unidad || "").trim();

    const stockActual = num(values.ins_stock_actual);
    const puntoRepo   = num(values.ins_punto_reposicion);
    const stockMin    = num(values.ins_stock_min);
    const stockMax    = num(values.ins_stock_max);

    if (!nombre) e.ins_nombre = "El nombre es obligatorio.";

    if (!unidad) {
      e.ins_unidad = "La unidad es obligatoria.";
    } else if (!UNIDADES.includes(unidad)) {
      e.ins_unidad = "Elegí una unidad válida (u, kg, g, l, ml).";
    }

    if (stockActual === null) e.ins_stock_actual = "El stock actual es obligatorio.";
    else if (isNaN(stockActual) || stockActual < 0) e.ins_stock_actual = "No puede ser negativo.";

    if (puntoRepo === null) e.ins_punto_reposicion = "El punto de reposición es obligatorio.";
    else if (isNaN(puntoRepo) || puntoRepo < 0) e.ins_punto_reposicion = "No puede ser negativo.";

    if (stockMin === null) e.ins_stock_min = "El stock mínimo es obligatorio.";
    else if (isNaN(stockMin) || stockMin < 0) e.ins_stock_min = "No puede ser negativo.";

    if (values.ins_stock_max !== "" && values.ins_stock_max !== null) {
      if (stockMax === null || isNaN(stockMax)) e.ins_stock_max = "Debe ser un número.";
      else if (stockMax < 0) e.ins_stock_max = "No puede ser negativo.";
      else if (stockMin !== null && !e.ins_stock_min && stockMin > stockMax)
        e.ins_stock_min = "El mínimo no puede superar al máximo.";
    }

    if (puntoRepo !== null && !isNaN(puntoRepo)) {
      if (stockMin !== null && !isNaN(stockMin) && puntoRepo < stockMin) {
        e.ins_punto_reposicion = "Debe ser ≥ al stock mínimo.";
      }
      if (values.ins_stock_max !== "" && stockMax !== null && !isNaN(stockMax) && puntoRepo > stockMax) {
        e.ins_punto_reposicion = "Debe ser ≤ al stock máximo.";
      }
    }
    if (values.ins_stock_max !== "" && stockMax !== null && !isNaN(stockMax) && stockActual !== null && !isNaN(stockActual)) {
      if (stockActual > stockMax) e.ins_stock_actual = "El stock actual no puede superar al stock máximo.";
    }

    return e;
  };

  useEffect(() => {
    api.get(`/api/insumos/${id}/`).then(({ data }) => {
      setForm({
        ins_nombre: data.ins_nombre ?? "",
        ins_unidad: data.ins_unidad ?? "",
        ins_stock_actual: data.ins_stock_actual ?? "",
        ins_punto_reposicion: data.ins_punto_reposicion ?? "",
        ins_stock_min: data.ins_stock_min ?? "",
        ins_stock_max: data.ins_stock_max ?? "",
        id_estado_insumo: String(data.id_estado_insumo ?? 1),
      });
      setOriginalName(data.ins_nombre ?? ""); // ← guardo el original
    }).catch((e) => console.error(e));
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onBlur = () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // ✅ Chequeo de duplicado (ignora mayúsculas y espacios) ANTES del PUT
    {
      const wanted = normalizeName(form.ins_nombre);
      const original = normalizeName(originalName);
      const { data } = await api.get(`/api/insumos/?search=${encodeURIComponent(form.ins_nombre)}`);
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const duplicated = list.some(it => normalizeName(it.ins_nombre) === wanted);
      if (duplicated && wanted !== original) {
        setErrors(prev => ({ ...prev, ins_nombre: "Ya existe un insumo con ese nombre." }));
        return;
      }
    }

    try {
      await api.put(`/api/insumos/${id}/`, {
        ...form,
        id_estado_insumo: Number(form.id_estado_insumo),
        ins_stock_actual: form.ins_stock_actual ? Number(form.ins_stock_actual) : 0,
        ins_punto_reposicion: form.ins_punto_reposicion ? Number(form.ins_punto_reposicion) : 0,
        ins_stock_min: form.ins_stock_min ? Number(form.ins_stock_min) : 0,
        ins_stock_max: form.ins_stock_max === "" ? null : Number(form.ins_stock_max),
      });
      setMsg("Insumo actualizado correctamente ✅");
      setTimeout(() => navigate("/inventario"), 1200);
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.detail || "Error al actualizar insumo");
    }
  };

  const valueUnidad = UNIDADES.includes(form.ins_unidad) ? form.ins_unidad : "";

  return (
    <DashboardLayout>
      <div className="form-container">
        <h2 className="form-title">Editar Insumo</h2>
        {msg && <p className="form-message">{msg}</p>}

        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label htmlFor="ins_nombre">Nombre</label>
            <input id="ins_nombre" name="ins_nombre" value={form.ins_nombre} onChange={onChange} onBlur={onBlur} required />
            {errors.ins_nombre && <small className="field-error">{errors.ins_nombre}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="ins_unidad">Unidad</label>
            <select
              id="ins_unidad"
              name="ins_unidad"
              value={valueUnidad}
              onChange={onChange}
              onBlur={onBlur}
              required
            >
              {form.ins_unidad && !UNIDADES.includes(form.ins_unidad) && (
                <option value="" disabled>
                  {form.ins_unidad} (no estándar) — seleccioná una válida
                </option>
              )}
              <option value="">-- Seleccioná --</option>
              {UNIDADES.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {errors.ins_unidad && <small className="field-error">{errors.ins_unidad}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="ins_stock_actual">Stock actual</label>
            <input
              id="ins_stock_actual" name="ins_stock_actual" type="number" step="0.01" min="0"
              value={form.ins_stock_actual} onChange={onChange} onBlur={onBlur} required
            />
            {errors.ins_stock_actual && <small className="field-error">{errors.ins_stock_actual}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="ins_punto_reposicion">Punto de reposición</label>
            <input
              id="ins_punto_reposicion" name="ins_punto_reposicion" type="number" step="0.01" min="0"
              value={form.ins_punto_reposicion} onChange={onChange} onBlur={onBlur} required
            />
            {errors.ins_punto_reposicion && <small className="field-error">{errors.ins_punto_reposicion}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="ins_stock_min">Stock mínimo</label>
            <input
              id="ins_stock_min" name="ins_stock_min" type="number" step="0.01" min="0"
              value={form.ins_stock_min} onChange={onChange} onBlur={onBlur} required
            />
            {errors.ins_stock_min && <small className="field-error">{errors.ins_stock_min}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="ins_stock_max">Stock máximo </label>
            <input
              id="ins_stock_max" name="ins_stock_max" type="number" step="0.01" min="0"
              value={form.ins_stock_max} onChange={onChange} onBlur={onBlur}
            />
            {errors.ins_stock_max && <small className="field-error">{errors.ins_stock_max}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="id_estado_insumo">Estado</label>
            <select id="id_estado_insumo" name="id_estado_insumo" value={form.id_estado_insumo} onChange={onChange} onBlur={onBlur} required>
              {ESTADOS.map((e) => (<option key={e.id} value={e.id}>{e.label}</option>))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/inventario")}>Cancelar</button>
          </div>
        </form>
      </div>

      <style>{formStyles}</style>
      <style>{`.field-error{color:#fca5a5;font-size:.85rem}`}</style>
    </DashboardLayout>
  );
}

const formStyles = `
  .form-container {
    background-color: #2c2c2e;
    border: 1px solid #3a3a3c;
    border-radius: 12px;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }
  .form-title {
    margin: 0 0 24px 0;
    font-size: 1.5rem;
  }
  .form-message {
    margin: 0 0 16px 0;
    color: #facc15;
  }
  .form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px.
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .form-group label {
    font-weight: 600;
    color: #d1d5db;
  }
  .form-group input, .form-group select {
    background-color: #3a3a3c;
    color: #fff;
    border: 1px solid #4a4a4e;
    border-radius: 8px;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .form-group input:focus, .form-group select:focus {
    border-color: #facc15;
  }
  .form-actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    text-decoration: none;
    transition: background-color 0.2s ease;
  }
  .btn-primary {
    background-color: #facc15;
    color: #111827;
  }
  .btn-primary:hover {
    background-color: #eab308;
  }
  .btn-secondary {
    background-color: #3a3a3c;
    color: #eaeaea;
  }
  .btn-secondary:hover {
    background-color: #4a4a4e;
  }
`;
