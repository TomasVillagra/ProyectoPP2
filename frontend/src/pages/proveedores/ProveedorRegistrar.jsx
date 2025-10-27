import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function ProveedorRegistrar() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [estados, setEstados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    prov_nombre: "", prov_tel: "", prov_correo: "", prov_direccion: "",
    id_estado_prov: "1", id_categoria_prov: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      api.get("/api/estados-proveedor/"),
      api.get("/api/categorias-proveedor/"),
    ]).then(([eRes, cRes]) => {
      setEstados(Array.isArray(eRes.data?.results) ? eRes.data.results : eRes.data);
      setCategorias(Array.isArray(cRes.data?.results) ? cRes.data.results : cRes.data);
    });
  }, []);

  const normPhoneDigits = (v) => (v || "").replace(/[^\d]/g, "");
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  const normalizeName = (s) => (s || "").toLowerCase().replace(/\s+/g, "");

  // ⬇️ Misma validate que en EDITAR
  const validate = (values) => {
    const e = {};
    const nombre = (values.prov_nombre || "").trim();
    const correo = (values.prov_correo || "").trim();
    const telDigits = normPhoneDigits(values.prov_tel);
    const direccion = (values.prov_direccion || "").trim();

    // NOMBRE
    if (!nombre) e.prov_nombre = "El nombre es obligatorio.";
    else if (nombre.length < 2)
      e.prov_nombre = "El nombre debe tener al menos 2 caracteres.";

    // CATEGORÍA
    if (!values.id_categoria_prov)
      e.id_categoria_prov = "La categoría es obligatoria.";

    // TELÉFONO (obligatorio + formato)
    if (!values.prov_tel) {
      e.prov_tel = "El teléfono es obligatorio.";
    } else if (!/^\+?\d+$/.test(values.prov_tel.replace(/\s+/g, ""))) {
      e.prov_tel = "El teléfono solo puede contener números y opcionalmente +.";
    } else if (telDigits.length < 7 || telDigits.length > 20) {
      e.prov_tel = "El teléfono debe tener entre 7 y 20 dígitos.";
    }

    // CORREO (opcional pero válido)
    if (correo) {
      if (!isValidEmail(correo))
        e.prov_correo = "Correo inválido (ej: nombre@dominio.com).";
    }

    // DIRECCIÓN (obligatoria + longitud)
    if (!direccion) {
      e.prov_direccion = "La dirección es obligatoria.";
    } else if (direccion.length < 5) {
      e.prov_direccion = "La dirección debe tener al menos 5 caracteres.";
    } else if (direccion.length > 120) {
      e.prov_direccion = "La dirección no puede superar los 120 caracteres.";
    }

    // ESTADO
    if (!values.id_estado_prov)
      e.id_estado_prov = "El estado es obligatorio.";

    return e;
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onBlur = () => setErrors(validate(form));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // 🔎 Duplicado (ignora mayúsculas y espacios) ANTES del POST
    {
      const wanted = normalizeName(form.prov_nombre);
      const { data } = await api.get(`/api/proveedores/?search=${encodeURIComponent(form.prov_nombre)}`);
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const duplicated = list.some(it => normalizeName(it.prov_nombre) === wanted);
      if (duplicated) {
        setErrors(prev => ({ ...prev, prov_nombre: "Ya existe un proveedor con ese nombre." }));
        return;
      }
    }

    try {
      await api.post("/api/proveedores/", {
        ...form,
        id_estado_prov: Number(form.id_estado_prov),
        id_categoria_prov: form.id_categoria_prov ? Number(form.id_categoria_prov) : null,
      });
      setMsg("Proveedor registrado correctamente ✅");
      setTimeout(() => navigate("/proveedores"), 1100);
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.detail || "Error al registrar proveedor");
    }
  };

  return (
    <DashboardLayout>
      <div className="form-container">
        <h2 className="form-title">Registrar Nuevo Proveedor</h2>
        {msg && <p className="form-message">{msg}</p>}

        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label htmlFor="prov_nombre">Nombre</label>
            <input id="prov_nombre" name="prov_nombre" value={form.prov_nombre} onChange={onChange} onBlur={onBlur} required />
            {errors.prov_nombre && <small className="field-error">{errors.prov_nombre}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="id_categoria_prov">Categoría</label>
            <select id="id_categoria_prov" name="id_categoria_prov" value={form.id_categoria_prov} onChange={onChange} onBlur={onBlur} required>
              <option value="">Elegí una categoría…</option>
              {categorias.map((c) => (
                <option key={c.id_categoria_prov} value={c.id_categoria_prov}>{c.catprov_nombre}</option>
              ))}
            </select>
            {errors.id_categoria_prov && <small className="field-error">{errors.id_categoria_prov}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="prov_tel">Teléfono </label>
            <input id="prov_tel" name="prov_tel" value={form.prov_tel} onChange={onChange} onBlur={onBlur} required />
            {errors.prov_tel && <small className="field-error">{errors.prov_tel}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="prov_correo">Correo (Opcional)</label>
            <input id="prov_correo" name="prov_correo" type="email" value={form.prov_correo} onChange={onChange} onBlur={onBlur} />
            {errors.prov_correo && <small className="field-error">{errors.prov_correo}</small>}
          </div>

          <div className="form-group span-2">
            <label htmlFor="prov_direccion">Dirección </label>
            <input id="prov_direccion" name="prov_direccion" value={form.prov_direccion} onChange={onChange} onBlur={onBlur} required />
            {errors.prov_direccion && <small className="field-error">{errors.prov_direccion}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="id_estado_prov">Estado</label>
            <select id="id_estado_prov" name="id_estado_prov" value={form.id_estado_prov} onChange={onChange} onBlur={onBlur} required>
              {estados.map((e) => (
                <option key={e.id_estado_prov} value={e.id_estado_prov}>{e.estprov_nombre}</option>
              ))}
            </select>
            {errors.id_estado_prov && <small className="field-error">{errors.id_estado_prov}</small>}
          </div>

          <div className="form-actions span-2">
            <button type="submit" className="btn btn-primary">Registrar Proveedor</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/proveedores")}>Cancelar</button>
          </div>
        </form>
      </div>
      <style>{formStyles}</style>
      <style>{`.field-error{color:#fca5a5;font-size:.85rem}`}</style>
    </DashboardLayout>
  );
}

const formStyles = `
  .form-container { background-color: #2c2c2e; border: 1px solid #3a3a3c; border-radius: 12px; padding: 24px; max-width: 800px; margin: 0 auto; }
  .form-title { margin: 0 0 24px 0; font-size: 1.5rem; }
  .form-message { margin: 0 0 16px 0; color: #facc15; }
  .form { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-group.span-2 { grid-column: 1 / -1; }
  .form-group label { font-weight: 600; color: #d1d5db; }
  .form-group input, .form-group select { background-color: #3a3a3c; color: #fff; border: 1px solid #4a4a4e; border-radius: 8px; padding: 10px 12px; outline: none; transition: border-color 0.2s ease; }
  .form-group input:focus, .form-group select:focus { border-color: #facc15; }
  .form-actions { display: flex; gap: 12px; margin-top: 16px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; text-decoration: none; transition: background-color 0.2s ease; }
  .btn-primary { background-color: #facc15; color: #111827; }
  .btn-primary:hover { background-color: #eab308; }
  .btn-secondary { background-color: #3a3a3c; color: #eaeaea; }
  .btn-secondary:hover { background-color: #4a4a4e; }
`;

