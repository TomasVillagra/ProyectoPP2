import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";

import DashboardLayout from "../../components/layout/DashboardLayout";
import PlatoRegistrarHeader from "../../components/platos/PlatoRegistrarHeader";
import PlatoRegistrarForm from "../../components/platos/PlatoRegistrarForm";
import PlatoRegistrarButtons from "../../components/platos/PlatoRegistrarButtons";

import "./PlatoRegistrar.css";

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

export default function PlatoRegistrar() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    pla_nombre: "",
    pla_precio: "",
    pla_stock: "0",
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
        return;
      } catch {}
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
    if (!raw && raw !== 0) return "";
    let s = String(raw).replace(/,/g, ".").replace(/[^\d.]/g, "");
    const parts = s.split(".");
    if (parts.length > 2) s = parts.shift() + "." + parts.join("");
    return s;
  };

  const sanitizeInt = (raw) => {
    if (!raw && raw !== 0) return "";
    return String(raw).replace(/[^\d]/g, "");
  };

  const blockInvalidMoney = (e) => {
    if (["-", "+", "e", "E", " "].includes(e.key)) e.preventDefault();
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

  const nombreDuplicado = async (nombre) => {
    try {
      const { data } = await api.get("/api/platos/", { params: { page_size: 1000 } });
      const list = normalizeList(data);
      const target = normalizeName(nombre);
      return list.some((p) => {
        const n = p.pla_nombre ?? p.plt_nombre ?? p.nombre ?? "";
        return normalizeName(n) === target;
      });
    } catch {
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

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const eAll = validateAll(form);
    setErrors(eAll);
    if (Object.keys(eAll).length) return;

    if (await nombreDuplicado(form.pla_nombre)) {
      alert("Ya existe un plato con ese nombre.");
      return;
    }

    try {
      await api.post("/api/platos/", {
        pla_nombre: form.pla_nombre,
        plt_nombre: form.pla_nombre,
        pla_precio: Number(form.pla_precio),
        plt_precio: Number(form.pla_precio),
        pla_stock: 0,
        plt_stock: 0,
        id_categoria_plato: Number(form.id_categoria_plato),
        id_categoria: Number(form.id_categoria_plato),
        categoria_id: Number(form.id_categoria_plato),
        id_estado_plato: Number(form.id_estado_plato),
      });

      setMsg("Plato creado");
      setTimeout(() => navigate("/platos"), 800);
    } catch {
      setMsg("No se pudo crear el plato");
    }
  };

  return (
    <DashboardLayout>
      <PlatoRegistrarHeader />

      {msg && <p className="plato-reg-msg">{msg}</p>}

      <form onSubmit={onSubmit} className="plato-reg-form">
        <PlatoRegistrarForm
          form={form}
          categorias={categorias}
          onChange={onChange}
          errors={errors}
        />

        <PlatoRegistrarButtons navigate={navigate} />
      </form>
    </DashboardLayout>
  );
}



