import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import PlatoEditarHeader from "../../components/platos/PlatoEditarHeader";
import PlatoEditarForm from "../../components/platos/PlatoEditarForm";
import PlatoEditarButtons from "../../components/platos/PlatoEditarButtons";

import "./PlatoEditar.css";

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
      try {
        const { data } = await api.get("/api/categorias-plato/");
        setCategorias(normalizeList(data));
      } catch {
        try {
          const { data } = await api.get("/api/categorias-platos/");
          setCategorias(normalizeList(data));
        } catch {}
      }
    };

    const fetchPlato = async () => {
      try {
        const { data } = await api.get(`/api/platos/${id}/`);
        setForm({
          pla_nombre: data.pla_nombre ?? data.plt_nombre ?? data.nombre ?? "",
          pla_precio: String(data.pla_precio ?? data.precio ?? ""),
          pla_stock: String(data.pla_stock ?? data.stock ?? ""),
          id_categoria_plato: String(
            data.id_categoria_plato ?? data.id_categoria ?? data.categoria_id ?? ""
          ),
          id_estado_plato: String(data.id_estado_plato ?? data.estado ?? "1"),
        });
      } catch {}
    };

    fetchCategorias();
    fetchPlato();
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const eAll = {};
    Object.keys(form).forEach((k) => {
      if (!String(form[k]).trim()) eAll[k] = "Campo obligatorio.";
    });
    setErrors(eAll);
    if (Object.keys(eAll).length) return;

    try {
      await api.put(`/api/platos/${id}/`, {
        pla_nombre: form.pla_nombre,
        pla_precio: Number(form.pla_precio),
        pla_stock: Number(form.pla_stock),
        id_categoria_plato: Number(form.id_categoria_plato),
        id_estado_plato: Number(form.id_estado_plato),
      });

      setMsg("Plato actualizado");
      setTimeout(() => navigate("/platos"), 800);
    } catch {
      setMsg("No se pudo actualizar el plato");
    }
  };

  return (
    <DashboardLayout>
      <PlatoEditarHeader />

      {msg && <p className="plato-edit-msg">{msg}</p>}

      <form onSubmit={onSubmit} className="plato-edit-form">
        <PlatoEditarForm
          form={form}
          categorias={categorias}
          onChange={setForm}
          errors={errors}
        />

        <PlatoEditarButtons navigate={navigate} />
      </form>
    </DashboardLayout>
  );
}




