import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import ProveedorRegistrarHeader from "../../components/proveedores/ProveedorRegistrarHeader";
import ProveedorRegistrarForm from "../../components/proveedores/ProveedorRegistrarForm";
import ProveedorRegistrarActions from "../../components/proveedores/ProveedorRegistrarActions";

import "./ProveedorRegistrar.css";

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
      const dataEst = Array.isArray(eRes.data?.results)
        ? eRes.data.results
        : eRes.data;
      setEstados(Array.isArray(dataEst) ? dataEst : []);

      const dataCat = Array.isArray(cRes.data?.results)
        ? cRes.data.results
        : cRes.data;
      setCategorias(Array.isArray(dataCat) ? dataCat : []);
    });
  }, []);

  // Helpers de validación (igual que tenías)
  const normPhoneDigits = (v) => (v || "").replace(/[^\d+]/g, "");
  const isValidEmail = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  const normalizeName = (s) =>
    (s || "").toLowerCase().replace(/\s+/g, "");

  const validate = (values) => {
    const e = {};
    const nombre = (values.prov_nombre || "").trim();
    const correo = (values.prov_correo || "").trim();
    const telefono = (values.prov_tel || "").trim();
    const direccion = (values.prov_direccion || "").trim();

    // NOMBRE
    if (!nombre) e.prov_nombre = "El nombre es obligatorio.";
    else if (nombre.length < 2)
      e.prov_nombre =
        "El nombre debe tener al menos 2 caracteres.";

    // CATEGORÍA
    if (!values.id_categoria_prov)
      e.id_categoria_prov = "La categoría es obligatoria.";

    // TELÉFONO: Permitir +, solo números, máx 14 caracteres
    if (!telefono) {
      e.prov_tel = "El teléfono es obligatorio.";
    } else if (!/^\+?\d+$/.test(telefono)) {
      e.prov_tel = "Solo números y el signo + al inicio.";
    } else if (telefono.length < 7 || telefono.length > 14) {
      e.prov_tel = "Debe tener entre 7 y 14 caracteres.";
    }

    // CORREO
    if (correo) {
      if (correo.length > 30) {
        e.prov_correo =
          "El correo no puede superar los 30 caracteres.";
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
    if (!values.id_estado_prov)
      e.id_estado_prov = "El estado es obligatorio.";

    return e;
  };

  const onChange = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));

  const onBlur = (e) => {
    const { name } = e.target;
    const errs = validate(form);
    setErrors((prev) => ({ ...prev, [name]: errs[name] }));
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
    const yaExiste = categorias.some(
      (c) => normalizeName(c.catprov_nombre) === buscado
    );
    if (yaExiste) {
      setCatMsg("Ya existe una categoría con ese nombre.");
      return;
    }

    try {
      setCatLoading(true);
      const res = await api.post(
        "/api/categorias-proveedor/",
        { catprov_nombre: nombre }
      );

      const nueva = res.data;
      const idNueva =
        nueva.id_categoria_prov ?? nueva.id ?? nueva.pk;

      setCategorias((prev) => [...prev, nueva]);
      if (idNueva) {
        setForm((f) => ({
          ...f,
          id_categoria_prov: String(idNueva),
        }));
      }

      setNuevaCategoria("");
      setCatMsg("Categoría creada y seleccionada.");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 405) {
        setCatMsg(
          "Error: El servidor no permite crear categorías (Error 405)."
        );
      } else {
        setCatMsg(
          err?.response?.data?.detail ||
            "No se pudo crear la categoría."
        );
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

    try {
      const wanted = normalizeName(form.prov_nombre);
      const { data } = await api.get(
        `/api/proveedores/?search=${encodeURIComponent(
          form.prov_nombre
        )}`
      );
      const list = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

      const duplicated = list.some(
        (it) => normalizeName(it.prov_nombre) === wanted
      );
      if (duplicated) {
        setErrors((prev) => ({
          ...prev,
          prov_nombre:
            "Ya existe un proveedor con ese nombre.",
        }));
        return;
      }

      await api.post("/api/proveedores/", {
        ...form,
        id_estado_prov: Number(form.id_estado_prov),
        id_categoria_prov: Number(form.id_categoria_prov),
      });

      setMsg("Proveedor registrado correctamente ✅");
      setTimeout(() => navigate("/proveedores"), 1100);
    } catch (err) {
      console.error(err);
      setMsg(
        err?.response?.data?.detail ||
          "Error al registrar proveedor"
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="prov-reg-container">
        <ProveedorRegistrarHeader />

        {msg && <p className="prov-reg-msg">{msg}</p>}

        <form onSubmit={onSubmit} className="prov-reg-form">
          <ProveedorRegistrarForm
            form={form}
            errors={errors}
            estados={estados}
            categorias={categorias}
            nuevaCategoria={nuevaCategoria}
            catMsg={catMsg}
            catLoading={catLoading}
            onChange={onChange}
            onBlur={onBlur}
            setNuevaCategoria={setNuevaCategoria}
            handleCrearCategoria={handleCrearCategoria}
          />

          <ProveedorRegistrarActions navigate={navigate} />
        </form>
      </div>
    </DashboardLayout>
  );
}



