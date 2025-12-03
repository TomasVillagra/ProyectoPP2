import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import ProveedorEditarHeader from "../../components/proveedores/ProveedorEditarHeader";
import ProveedorEditarForm from "../../components/proveedores/ProveedorEditarForm";
import ProveedorEditarActions from "../../components/proveedores/ProveedorEditarActions";

import "./ProveedorEditar.css";

export default function ProveedorEditar() {
  const { id } = useParams();
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
  const [originalName, setOriginalName] = useState("");

  const normPhoneDigits = (v) => (v || "").replace(/[^\d]/g, "");
  const isValidEmail = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  const normalizeName = (s) =>
    (s || "").toLowerCase().replace(/\s+/g, "");

  const validate = (values) => {
    const e = {};
    const nombre = (values.prov_nombre || "").trim();
    const correo = (values.prov_correo || "").trim();
    const telDigits = normPhoneDigits(values.prov_tel);
    const direccion = (values.prov_direccion || "").trim();

    if (!nombre) e.prov_nombre = "El nombre es obligatorio.";
    else if (nombre.length < 2)
      e.prov_nombre = "Debe tener al menos 2 caracteres.";

    if (!values.id_categoria_prov)
      e.id_categoria_prov = "La categoría es obligatoria.";

    if (!values.prov_tel) {
      e.prov_tel = "El teléfono es obligatorio.";
    } else if (!/^\+?\d+$/.test(values.prov_tel.replace(/\s+/g, ""))) {
      e.prov_tel =
        "El teléfono solo puede contener números y opcionalmente +.";
    } else if (telDigits.length < 7 || telDigits.length > 20) {
      e.prov_tel = "Debe tener entre 7 y 20 dígitos.";
    }

    if (correo && !isValidEmail(correo))
      e.prov_correo = "Correo inválido.";

    if (!direccion) e.prov_direccion = "La dirección es obligatoria.";
    else if (direccion.length < 5)
      e.prov_direccion = "Debe tener al menos 5 caracteres.";
    else if (direccion.length > 120)
      e.prov_direccion = "No puede superar 120 caracteres.";

    if (!values.id_estado_prov)
      e.id_estado_prov = "El estado es obligatorio.";

    return e;
  };

  useEffect(() => {
    Promise.all([
      api.get(`/api/proveedores/${id}/`),
      api.get("/api/estados-proveedor/"),
      api.get("/api/categorias-proveedor/"),
    ])
      .then(([provRes, eRes, cRes]) => {
        const prov = provRes.data || {};
        setForm({
          prov_nombre: prov.prov_nombre ?? "",
          prov_tel: prov.prov_tel ?? "",
          prov_correo: prov.prov_correo ?? "",
          prov_direccion: prov.prov_direccion ?? "",
          id_estado_prov: String(prov.id_estado_prov ?? "1"),
          id_categoria_prov: prov.id_categoria_prov
            ? String(prov.id_categoria_prov)
            : "",
        });
        setOriginalName(prov.prov_nombre ?? "");
        setEstados(
          Array.isArray(eRes.data?.results)
            ? eRes.data.results
            : eRes.data
        );
        setCategorias(
          Array.isArray(cRes.data?.results)
            ? cRes.data.results
            : cRes.data
        );
      })
      .catch((e) => console.error(e));
  }, [id]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onBlur = () => setErrors(validate(form));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    {
      const wanted = normalizeName(form.prov_nombre);
      const original = normalizeName(originalName);
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
      if (duplicated && wanted !== original) {
        setErrors((prev) => ({
          ...prev,
          prov_nombre: "Ya existe un proveedor con ese nombre.",
        }));
        return;
      }
    }

    try {
      await api.put(`/api/proveedores/${id}/`, {
        ...form,
        id_estado_prov: Number(form.id_estado_prov),
        id_categoria_prov: form.id_categoria_prov
          ? Number(form.id_categoria_prov)
          : null,
      });

      setMsg("Proveedor actualizado correctamente ✅");
      setTimeout(() => navigate("/proveedores"), 1100);
    } catch (err) {
      console.error(err);
      setMsg(
        err?.response?.data?.detail || "Error al actualizar proveedor"
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="prov-edit-container">
        <ProveedorEditarHeader />

        {msg && <p className="prov-edit-msg">{msg}</p>}

        <form onSubmit={onSubmit} className="prov-edit-form">
          <ProveedorEditarForm
            form={form}
            onChange={onChange}
            onBlur={onBlur}
            errors={errors}
            estados={estados}
            categorias={categorias}
          />

          <ProveedorEditarActions navigate={navigate} />
        </form>
      </div>
    </DashboardLayout>
  );
}

