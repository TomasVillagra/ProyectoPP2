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
    prov_nombre: "",
    prov_tel: "",
    prov_correo: "",
    prov_direccion: "",
    id_estado_prov: "1",
    id_categoria_prov: "",
  });
  const [errors, setErrors] = useState({});

  // --- ESTADOS PARA CREAR CATEGORÍA ---
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [catMsg, setCatMsg] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/api/estados-proveedor/"),
      api.get("/api/categorias-proveedor/"),
    ]).then(([eRes, cRes]) => {
      const dataEst = Array.isArray(eRes.data?.results) ? eRes.data.results : eRes.data;
      setEstados(Array.isArray(dataEst) ? dataEst : []);

      const dataCat = Array.isArray(cRes.data?.results) ? cRes.data.results : cRes.data;
      setCategorias(Array.isArray(dataCat) ? dataCat : []);
    });
  }, []);

  // Helpers de validación
  const normPhoneDigits = (v) => (v || "").replace(/[^\d+]/g, ""); 
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  const normalizeName = (s) => (s || "").toLowerCase().replace(/\s+/g, "");

  const validate = (values) => {
    const e = {};
    const nombre = (values.prov_nombre || "").trim();
    const correo = (values.prov_correo || "").trim();
    const telefono = (values.prov_tel || "").trim();
    const direccion = (values.prov_direccion || "").trim();

    // NOMBRE
    if (!nombre) e.prov_nombre = "El nombre es obligatorio.";
    else if (nombre.length < 2) e.prov_nombre = "El nombre debe tener al menos 2 caracteres.";

    // CATEGORÍA
    if (!values.id_categoria_prov) e.id_categoria_prov = "La categoría es obligatoria.";

    // TELÉFONO: Permitir +, solo números, máx 14 caracteres
    if (!telefono) {
      e.prov_tel = "El teléfono es obligatorio.";
    } else if (!/^\+?\d+$/.test(telefono)) {
      e.prov_tel = "Solo números y el signo + al inicio.";
    } else if (telefono.length < 7 || telefono.length > 14) { // 🔥 CORRECCIÓN AQUÍ
      e.prov_tel = "Debe tener entre 7 y 14 caracteres.";
    }

    // CORREO
    if (correo) {
      if (correo.length > 30) {
        e.prov_correo = "El correo no puede superar los 30 caracteres.";
      } else if (!isValidEmail(correo)) {
        e.prov_correo = "Formato de correo inválido.";
      }
    }

    // DIRECCIÓN
    if (!direccion) {
      e.prov_direccion = "La dirección es obligatoria.";
    } else if (direccion.length < 5) {
      e.prov_direccion = "Mínimo 5 caracteres.";
    } else if (direccion.length > 120) {
      e.prov_direccion = "Máximo 120 caracteres.";
    }

    // ESTADO
    if (!values.id_estado_prov) e.id_estado_prov = "El estado es obligatorio.";

    return e;
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  
  const onBlur = (e) => {
    const { name } = e.target;
    const errs = validate(form);
    setErrors(prev => ({ ...prev, [name]: errs[name] }));
  };

  // --- CREAR NUEVA CATEGORÍA ---
  const handleCrearCategoria = async () => {
    setCatMsg("");
    const nombre = (nuevaCategoria || "").trim();

    if (!nombre) {
      setCatMsg("Ingresá un nombre para la nueva categoría.");
      return;
    }

    const buscado = normalizeName(nombre);
    const yaExiste = categorias.some(c => normalizeName(c.catprov_nombre) === buscado);
    if (yaExiste) {
      setCatMsg("Ya existe una categoría con ese nombre.");
      return;
    }

    try {
      setCatLoading(true);
      // Intentamos crear la categoría en el backend
      const res = await api.post("/api/categorias-proveedor/", { catprov_nombre: nombre });
      
      const nueva = res.data;
      const idNueva = nueva.id_categoria_prov ?? nueva.id ?? nueva.pk;

      setCategorias(prev => [...prev, nueva]);
      if (idNueva) {
        setForm(f => ({ ...f, id_categoria_prov: String(idNueva) }));
      }
      
      setNuevaCategoria("");
      setCatMsg("Categoría creada y seleccionada.");
    } catch (err) {
      console.error(err);
      // Si falla (error 405), mostramos el mensaje
      if (err.response && err.response.status === 405) {
        setCatMsg("Error: El servidor no permite crear categorías (Error 405).");
      } else {
        setCatMsg(err?.response?.data?.detail || "No se pudo crear la categoría.");
      }
    } finally {
      setCatLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Chequeo de duplicados
    try {
      const wanted = normalizeName(form.prov_nombre);
      const { data } = await api.get(`/api/proveedores/?search=${encodeURIComponent(form.prov_nombre)}`);
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      
      const duplicated = list.some(it => normalizeName(it.prov_nombre) === wanted);
      if (duplicated) {
        setErrors(prev => ({ ...prev, prov_nombre: "Ya existe un proveedor con ese nombre." }));
        return;
      }

      // Crear proveedor
      await api.post("/api/proveedores/", {
        ...form,
        id_estado_prov: Number(form.id_estado_prov),
        id_categoria_prov: Number(form.id_categoria_prov),
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
            <input
              id="prov_nombre"
              name="prov_nombre"
              value={form.prov_nombre}
              onChange={onChange}
              onBlur={onBlur}
              required
              maxLength={120}
            />
            {errors.prov_nombre && <small className="field-error">{errors.prov_nombre}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="id_categoria_prov">Categoría</label>
            <select
              id="id_categoria_prov"
              name="id_categoria_prov"
              value={form.id_categoria_prov}
              onChange={onChange}
              onBlur={onBlur}
              required
            >
              <option value="">Elegí una categoría…</option>
              {categorias.map((c) => (
                <option key={c.id_categoria_prov ?? c.id} value={c.id_categoria_prov ?? c.id}>
                  {c.catprov_nombre ?? c.nombre}
                </option>
              ))}
            </select>
            {errors.id_categoria_prov && <small className="field-error">{errors.id_categoria_prov}</small>}

            {/* SECCIÓN DE CREAR NUEVA CATEGORÍA */}
            <div className="new-cat-wrap">
              <label className="new-cat-label">O crear nueva categoría</label>
              <div className="new-cat-row">
                <input
                  type="text"
                  placeholder="Nombre nueva categoría"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  disabled={catLoading}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCrearCategoria}
                  disabled={catLoading}
                >
                  {catLoading ? "Creando..." : "Agregar"}
                </button>
              </div>
              {catMsg && <small className="field-info" style={{color: catMsg.includes("Error") ? "#fca5a5" : "#e5e7eb"}}>{catMsg}</small>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="prov_tel">Teléfono</label>
            <input
              id="prov_tel"
              name="prov_tel"
              value={form.prov_tel}
              onChange={onChange}
              onBlur={onBlur}
              required
              maxLength={14} /* 🔥 CORRECCIÓN AQUÍ */
              placeholder="+549..."
            />
            {errors.prov_tel && <small className="field-error">{errors.prov_tel}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="prov_correo">Correo (Opcional)</label>
            <input
              id="prov_correo"
              name="prov_correo"
              type="email"
              value={form.prov_correo}
              onChange={onChange}
              onBlur={onBlur}
              maxLength={30}
            />
            {errors.prov_correo && <small className="field-error">{errors.prov_correo}</small>}
          </div>

          <div className="form-group span-2">
            <label htmlFor="prov_direccion">Dirección</label>
            <input
              id="prov_direccion"
              name="prov_direccion"
              value={form.prov_direccion}
              onChange={onChange}
              onBlur={onBlur}
              required
              maxLength={120}
            />
            {errors.prov_direccion && <small className="field-error">{errors.prov_direccion}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="id_estado_prov">Estado</label>
            <select
              id="id_estado_prov"
              name="id_estado_prov"
              value={form.id_estado_prov}
              onChange={onChange}
              onBlur={onBlur}
              required
            >
              {estados.map((e) => (
                <option key={e.id_estado_prov ?? e.id} value={e.id_estado_prov ?? e.id}>
                  {e.estprov_nombre ?? e.nombre}
                </option>
              ))}
            </select>
            {errors.id_estado_prov && <small className="field-error">{errors.id_estado_prov}</small>}
          </div>

          <div className="form-actions span-2">
            <button type="submit" className="btn btn-primary">Registrar Proveedor</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/proveedores")}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
      <style>{formStyles}</style>
      <style>{extraStyles}</style>
    </DashboardLayout>
  );
}

const formStyles = `
  .form-container { background-color: #2c2c2e; border: 1px solid #3a3a3c; border-radius: 12px; padding: 24px; max-width: 800px; margin: 0 auto; }
  .form-title { margin: 0 0 24px 0; font-size: 1.5rem; color: #fff; }
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
  .btn-sm { padding: 6px 12px; font-size: 0.9rem; }
`;

const extraStyles = `
  .field-error { color: #fca5a5; font-size: .85rem; display: block; margin-top: 4px; }
  .field-info { font-size: .85rem; display: block; margin-top: 4px; }
  .new-cat-wrap { margin-top: 12px; padding: 10px; background: #323234; border-radius: 8px; }
  .new-cat-label { font-size: 0.85rem; color: #d1d5db; margin-bottom: 6px; display: block; }
  .new-cat-row { display: flex; gap: 8px; }
  .new-cat-row input { flex: 1; font-size: 0.9rem; }
`;


