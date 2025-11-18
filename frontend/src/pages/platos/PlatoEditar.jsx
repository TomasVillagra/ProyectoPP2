import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalizeList(respData) {
  if (Array.isArray(respData)) return respData;
  if (respData?.results && Array.isArray(respData.results)) return respData.results;
  if (respData?.data && Array.isArray(respData.data)) return respData.data;
  return [];
}

const normalizeName = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");

// intenta detectar si el plato aparece en pedidos
async function platoEstaEnPedidos(idPlato) {
  const tryEndpoints = [
    "/api/pedido-detalles/",
    "/api/detalle-pedidos/",
    "/api/detalles-pedido/",
    "/api/pedidos-detalle/",
  ];
  for (const ep of tryEndpoints) {
    try {
      const { data } = await api.get(ep, { params: { id_plato: Number(idPlato), page_size: 1 } });
      const list = normalizeList(data);
      if (list.length > 0) return true;
    } catch {}
  }
  // fallback: recorrer pedidos e items embebidos
  try {
    const { data } = await api.get("/api/pedidos/", { params: { page_size: 1000 } });
    const pedidos = normalizeList(data);
    for (const p of pedidos) {
      const items = p.detalles || p.items || p.lineas || [];
      if (Array.isArray(items) && items.some((it) => Number(it.id_plato ?? it.plato) === Number(idPlato))) {
        return true;
      }
    }
  } catch {}
  return false;
}

export default function PlatoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    pla_nombre: "",
    pla_precio: "",
    pla_stock: "",
    id_categoria_plato: "",
    id_estado_plato: "1",
  });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchCategorias = async () => {
      // 1) singular
      try {
        const { data } = await api.get("/api/categorias-plato/");
        setCategorias(normalizeList(data));
      } catch {
        // 2) plural
        try {
          const { data } = await api.get("/api/categorias-platos/");
          setCategorias(normalizeList(data));
        } catch (e2) {
          console.error("No se pudo cargar categorías", e2);
        }
      }
    };

    const fetchPlato = async () => {
      try {
        const { data } = await api.get(`/api/platos/${id}/`);
        setForm({
          pla_nombre: data.pla_nombre ?? data.plt_nombre ?? data.nombre ?? "",
          pla_precio: String(data.pla_precio ?? data.plt_precio ?? data.precio ?? ""),
          pla_stock: String(data.pla_stock ?? data.plt_stock ?? data.stock ?? ""),
          id_categoria_plato: String(
            data.id_categoria_plato ?? data.id_categoria ?? data.categoria_id ?? ""
          ),
          id_estado_plato: String(data.id_estado_plato ?? data.id_estado ?? data.estado ?? "1"),
        });
      } catch (e) {
        console.error(e);
      }
    };

    fetchCategorias();
    fetchPlato();
  }, [id]);

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
        // El stock se muestra pero no se edita, sólo validamos que sea entero si viene algo
        if (value !== "" && !/^\d+$/.test(String(value)))
          return "Debe ser un entero (0 o más).";
        return "";
      case "id_categoria_plato":
        if (!String(value).trim()) return "Seleccioná una categoría.";
        return "";
      default:
        return "";
    }
  };

  const onChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "pla_precio") value = sanitizeMoney(value);
    if (name === "pla_stock") value = sanitizeInt(value);
    const next = { ...form, [name]: value };
    setForm(next);
    setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  // Nombre duplicado (excluyendo el propio plato)
  const nombreDuplicado = async (nombre, selfId) => {
    try {
      const { data } = await api.get("/api/platos/", { params: { page_size: 1000 } });
      const list = normalizeList(data);
      const target = normalizeName(nombre);
      return list.some((p) => {
        const pid = p.id_plato ?? p.id;
        const n = p.pla_nombre ?? p.plt_nombre ?? p.nombre ?? "";
        return Number(pid) !== Number(selfId) && normalizeName(n) === target;
      });
    } catch {
      try {
        const { data } = await api.get("/api/platos/", { params: { search: nombre } });
        const list = normalizeList(data);
        const target = normalizeName(nombre);
        return list.some((p) => {
          const pid = p.id_plato ?? p.id;
          const n = p.pla_nombre ?? p.plt_nombre ?? p.nombre ?? "";
          return Number(pid) !== Number(selfId) && normalizeName(n) === target;
        });
      } catch {
        return false;
      }
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const eAll = {};
    Object.keys(form).forEach((k) => {
      const m = validateField(k, form[k]);
      if (m) eAll[k] = m;
    });
    setErrors(eAll);
    if (Object.keys(eAll).length) return;

    // 🔒 nombre único
    if (await nombreDuplicado(form.pla_nombre, id)) {
      alert("Ya existe un plato con ese nombre.");
      return;
    }

    // ⛔ bloqueo de desactivación si está en pedidos
    if (String(form.id_estado_plato) === "2") {
      const enPedidos = await platoEstaEnPedidos(id);
      if (enPedidos) {
        alert("No se puede desactivar el plato: está asociado a uno o más pedidos.");
        return;
      }
    }

    try {
      await api.put(`/api/platos/${id}/`, {
        // enviar ambos nombres para máxima compatibilidad
        pla_nombre: form.pla_nombre,
        plt_nombre: form.pla_nombre,
        pla_precio: Number(form.pla_precio),
        plt_precio: Number(form.pla_precio),
        // 👇 Se envía el stock actual que vino del back, pero el usuario no lo puede cambiar
        pla_stock: Number(form.pla_stock),
        plt_stock: Number(form.pla_stock),
        id_categoria_plato: Number(form.id_categoria_plato),
        id_categoria: Number(form.id_categoria_plato),
        categoria_id: Number(form.id_categoria_plato),
        id_estado_plato: Number(form.id_estado_plato),
      });
      setMsg("Plato actualizado");
      setTimeout(() => navigate("/platos"), 800);
    } catch (err) {
      console.error(err);
      setMsg("No se pudo actualizar el plato");
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{margin:0, marginBottom:12}}>Editar Plato</h2>
      {msg && <p>{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <div className="row">
          <label htmlFor="pla_nombre">Nombre =</label>
          <input id="pla_nombre" name="pla_nombre" value={form.pla_nombre} onChange={onChange} required />
        </div>
        {errors.pla_nombre && <small className="err">{errors.pla_nombre}</small>}

        <div className="row">
          <label htmlFor="pla_precio">Precio =</label>
          <input
            id="pla_precio" name="pla_precio" type="text" inputMode="decimal"
            value={form.pla_precio} onChange={onChange} onKeyDown={blockInvalidMoney} required
          />
        </div>
        {errors.pla_precio && <small className="err">{errors.pla_precio}</small>}

        <div className="row">
          <label htmlFor="pla_stock">Stock =</label>
          <input
            id="pla_stock"
            name="pla_stock"
            type="text"
            inputMode="numeric"
            value={form.pla_stock}
            readOnly   // 👈 AHORA NO SE PUEDE CAMBIAR
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
              const idc = c.id_categoria_plato ?? c.id_categoria ?? c.id ?? c.categoria_id;
              const nombre = c.catplt_nombre ?? c.categoria_nombre ?? c.cat_nombre ?? c.nombre ?? `#${idc}`;
              return (
                <option key={idc} value={idc}>{nombre}</option>
              );
            })}
          </select>
        </div>
        {errors.id_categoria_plato && <small className="err">{errors.id_categoria_plato}</small>}

        <div className="row">
          <label htmlFor="id_estado_plato">Estado =</label>
          <select id="id_estado_plato" name="id_estado_plato" value={form.id_estado_plato} onChange={onChange} required>
            <option value="1">Activo</option>
            <option value="2">Inactivo</option>
          </select>
        </div>

        <div>
          <button type="submit" className="btn btn-primary">Guardar cambios</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/platos")} style={{marginLeft:10}}>Cancelar</button>
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



