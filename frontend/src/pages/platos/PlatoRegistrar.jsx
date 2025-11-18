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

// normaliza nombres: minúsculas, sin espacios ni tildes
const normalizeName = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");

export default function PlatoRegistrar() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    pla_nombre: "",
    pla_precio: "",
    // 👇 Stock inicial SIEMPRE 0 al registrar
    pla_stock: "0",
    id_categoria_plato: "",
    id_estado_plato: "1",
  });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchCategorias = async () => {
      // 1) intento singular
      try {
        const { data } = await api.get("/api/categorias-plato/");
        setCategorias(normalizeList(data));
        return;
      } catch {}
      // 2) intento plural
      try {
        const { data } = await api.get("/api/categorias-platos/");
        setCategorias(normalizeList(data));
      } catch (e2) {
        console.error("No se pudo cargar categorías", e2);
      }
    };
    fetchCategorias();
  }, []);

  const sanitizeMoney = (raw) => {
    if (raw === "" || raw === null || raw === undefined) return "";
    let s = String(raw).replace(/,/g, ".").replace(/[^\d.]/g, "");
    const parts = s.split(".");
    if (parts.length > 2) s = parts.shift() + "." + parts.join("");
    return s;
  };
  const sanitizeInt = (raw) => {
    if (raw === "" || raw === null || raw === undefined) return "";
    return String(raw).replace(/[^\d]/g, "");
  };
  const blockInvalidMoney = (e) => {
    const invalid = ["-", "+", "e", "E", " "];
    if (invalid.includes(e.key)) e.preventDefault();
  };
  const blockInvalidInt = (e) => {
    const invalid = ["-", "+", "e", "E", ".", ",", " "];
    if (invalid.includes(e.key)) e.preventDefault();
  };

  const validateField = (name, value) => {
    const num = Number(value);
    switch (name) {
      case "pla_nombre":
        if (!String(value).trim()) return "Ingresá un nombre.";
        return "";
      case "pla_precio":
        if (value === "") return "Ingresá el precio.";
        if (Number.isNaN(num)) return "Debe ser numérico.";
        if (num < 0) return "No puede ser negativo.";
        return "";
      case "pla_stock":
        // El stock inicial siempre es 0, solo validamos que sea entero >= 0
        if (!/^\d+$/.test(String(value))) return "Debe ser un entero (0 o más).";
        return "";
      case "id_categoria_plato":
        if (!String(value).trim()) return "Seleccioná una categoría.";
        return "";
      default:
        return "";
    }
  };

  const validateAll = (v) => {
    const e = {};
    Object.keys(v).forEach((k) => {
      const m = validateField(k, v[k]);
      if (m) e[k] = m;
    });
    return e;
  };

  // Verifica existencia de nombre duplicado (ignora mayúsculas, espacios y tildes)
  const nombreDuplicado = async (nombre) => {
    try {
      // intento 1: buscar todos y filtrar
      const { data } = await api.get("/api/platos/", { params: { page_size: 1000 } });
      const list = normalizeList(data);
      const target = normalizeName(nombre);
      return list.some((p) => {
        const n = p.pla_nombre ?? p.plt_nombre ?? p.nombre ?? "";
        return normalizeName(n) === target;
      });
    } catch {
      // intento 2: search
      try {
        const { data } = await api.get("/api/platos/", { params: { search: nombre } });
        const list = normalizeList(data);
        const target = normalizeName(nombre);
        return list.some((p) => {
          const n = p.pla_nombre ?? p.plt_nombre ?? p.nombre ?? "";
          return normalizeName(n) === target;
        });
      } catch {
        return false;
      }
    }
  };

  const onChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "pla_precio") value = sanitizeMoney(value);
    if (name === "pla_stock") value = sanitizeInt(value);
    const next = { ...form, [name]: value };
    setForm(next);
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const eAll = validateAll(form);
    setErrors(eAll);
    if (Object.keys(eAll).length) return;

    // 🔒 nombre único
    if (await nombreDuplicado(form.pla_nombre)) {
      alert("Ya existe un plato con ese nombre.");
      return;
    }

    try {
      await api.post("/api/platos/", {
        // enviar ambos nombres para máxima compatibilidad con el back
        pla_nombre: form.pla_nombre,
        plt_nombre: form.pla_nombre,
        pla_precio: Number(form.pla_precio),
        plt_precio: Number(form.pla_precio),
        // 👇 stock inicial SIEMPRE 0
        pla_stock: 0,
        plt_stock: 0,
        id_categoria_plato: Number(form.id_categoria_plato),
        id_categoria: Number(form.id_categoria_plato),
        categoria_id: Number(form.id_categoria_plato),
        id_estado_plato: Number(form.id_estado_plato),
      });
      setMsg("Plato creado");
      setTimeout(() => navigate("/platos"), 800);
    } catch (err) {
      console.error(err);
      setMsg("No se pudo crear el plato");
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{margin:0, marginBottom:12}}>Registrar Plato</h2>
      {msg && <p>{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <div className="row">
          <label htmlFor="pla_nombre">Nombre =</label>
          <input
            id="pla_nombre"
            name="pla_nombre"
            value={form.pla_nombre}
            onChange={onChange}
            required
          />
        </div>
        {errors.pla_nombre && <small className="err">{errors.pla_nombre}</small>}

        <div className="row">
          <label htmlFor="pla_precio">Precio =</label>
          <input
            id="pla_precio"
            name="pla_precio"
            type="text"
            inputMode="decimal"
            value={form.pla_precio}
            onChange={onChange}
            onKeyDown={blockInvalidMoney}
            required
          />
        </div>
        {errors.pla_precio && <small className="err">{errors.pla_precio}</small>}

        <div className="row">
          <label htmlFor="pla_stock">
            Stock (inicialmente 0, se mueve con las operaciones) =
          </label>
          <input
            id="pla_stock"
            name="pla_stock"
            type="text"
            inputMode="numeric"
            value={form.pla_stock}
            readOnly // 👈 no se edita al registrar
          />
        </div>
        {errors.pla_stock && <small className="err">{errors.pla_stock}</small>}

        <div className="row">
          <label htmlFor="id_categoria_plato">Categoría =</label>
          <select
            id="id_categoria_plato"
            name="id_categoria_plato"
            value={form.id_categoria_plato}
            onChange={onChange}
            required
          >
            <option value="">-- Seleccioná --</option>
            {categorias.map((c) => {
              const id =
                c.id_categoria_plato ??
                c.id_categoria ??
                c.id ??
                c.categoria_id;
              const nombre =
                c.catplt_nombre ??
                c.categoria_nombre ??
                c.cat_nombre ??
                c.nombre ??
                `#${id}`;
              return (
                <option key={id} value={id}>
                  {nombre}
                </option>
              );
            })}
          </select>
        </div>
        {errors.id_categoria_plato && (
          <small className="err">{errors.id_categoria_plato}</small>
        )}

        <div className="row">
          <label htmlFor="id_estado_plato">Estado =</label>
          <select
            id="id_estado_plato"
            name="id_estado_plato"
            value={form.id_estado_plato}
            onChange={onChange}
            required
          >
            <option value="1">Activo</option>
            <option value="2">Inactivo</option>
          </select>
        </div>

        <div>
          <button type="submit" className="btn btn-primary">
            Registrar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/platos")}
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
.err { color:#fca5a5; font-size:12px; margin-top:-6px; display:block; margin-left:232px; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;


