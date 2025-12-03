import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import InsumoEditarForm from "../../components/insumos/InsumoEditarForm";

// ✅ importa el CSS local de la página
import "./InsumoEditar.css";

const ESTADOS = [
  { id: 1, label: "Activo" },
  { id: 2, label: "Inactivo" },
];

const UNIDADES = ["u", "kg", "g", "l", "ml"];

// 👉 helper para normalizar (ignorar mayúsculas y espacios)
const normalizeName = (s) => (s || "").toLowerCase().replace(/\s+/g, "");

// 👉 helper para límites de capacidad según unidad
const getCapacidadConstraints = (unidad) => {
  switch (unidad) {
    case "kg":
      return { min: 1, max: 60, step: 0.01 };
    case "g":
      return { min: 100, max: 100000, step: 1 };
    case "u":
      return { min: 1, max: 100, step: 1 };
    case "l":
      return { min: 1, max: 60, step: 0.01 };
    case "ml":
      return { min: 100, max: 100000, step: 1 };
    default:
      return { min: 0.01, max: undefined, step: 0.01 };
  }
};

export default function InsumoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    ins_nombre: "",
    ins_unidad: "",
    ins_cantidad: "", // se mantiene en estado pero NO se edita ni se muestra
    ins_capacidad: "",
    ins_stock_actual: "", // idem
    ins_punto_reposicion: "",
    ins_stock_min: "",
    ins_stock_max: "",
    id_estado_insumo: "1",
  });
  const [errors, setErrors] = useState({});
  const [originalName, setOriginalName] = useState(""); // para permitir el mismo nombre

  const num = (v) =>
    v === "" || v === null || v === undefined ? null : Number(v);

  const validate = (values) => {
    const e = {};
    const nombre = (values.ins_nombre || "").trim();
    const unidad = (values.ins_unidad || "").trim();

    const capacidad = num(values.ins_capacidad);
    const stockActual = num(values.ins_stock_actual);
    const puntoRepo = num(values.ins_punto_reposicion);
    const stockMin = num(values.ins_stock_min);
    const stockMax = num(values.ins_stock_max);

    if (!nombre) e.ins_nombre = "El nombre es obligatorio.";

    if (!unidad) {
      e.ins_unidad = "La unidad es obligatoria.";
    } else if (!UNIDADES.includes(unidad)) {
      e.ins_unidad = "Elegí una unidad válida (u, kg, g, l, ml).";
    }

    // ▶ Validar capacidad según unidad
    if (capacidad === null) {
      e.ins_capacidad = "La capacidad es obligatoria.";
    } else if (isNaN(capacidad)) {
      e.ins_capacidad = "La capacidad debe ser un número.";
    } else if (unidad) {
      const { min, max } = getCapacidadConstraints(unidad);

      if (min !== undefined && capacidad < min) {
        e.ins_capacidad = `La capacidad mínima para ${unidad} es ${min}.`;
      } else if (max !== undefined && capacidad > max) {
        e.ins_capacidad = `La capacidad máxima para ${unidad} es ${max}.`;
      }

      if (unidad === "u" && !Number.isInteger(capacidad)) {
        e.ins_capacidad = "Para unidad 'u' la capacidad debe ser un número entero.";
      }
    }

    // ▶ Punto de reposición / stock min / stock max (obligatorios)
    if (puntoRepo === null) {
      e.ins_punto_reposicion = "El punto de reposición es obligatorio.";
    } else if (isNaN(puntoRepo) || puntoRepo < 0) {
      e.ins_punto_reposicion = "No puede ser negativo.";
    }

    if (stockMin === null) {
      e.ins_stock_min = "El stock mínimo es obligatorio.";
    } else if (isNaN(stockMin) || stockMin < 0) {
      e.ins_stock_min = "No puede ser negativo.";
    }

    if (stockMax === null) {
      e.ins_stock_max = "El stock máximo es obligatorio.";
    } else if (isNaN(stockMax) || stockMax < 0) {
      e.ins_stock_max = "No puede ser negativo.";
    }

    // ▶ Orden estricto:
    // stock_min < stock_max
    // stock_min < punto_repo < stock_max
    if (
      stockMin !== null &&
      stockMax !== null &&
      !isNaN(stockMin) &&
      !isNaN(stockMax)
    ) {
      if (!(stockMin < stockMax)) {
        e.ins_stock_min = "El stock mínimo debe ser menor que el stock máximo.";
        e.ins_stock_max = "El stock máximo debe ser mayor que el stock mínimo.";
      }
    }

    if (
      stockMin !== null &&
      stockMax !== null &&
      puntoRepo !== null &&
      !isNaN(stockMin) &&
      !isNaN(stockMax) &&
      !isNaN(puntoRepo)
    ) {
      if (!(stockMin < puntoRepo && puntoRepo < stockMax)) {
        if (puntoRepo <= stockMin) {
          e.ins_punto_reposicion =
            "El punto de reposición debe ser mayor que el stock mínimo.";
        } else if (puntoRepo >= stockMax) {
          e.ins_punto_reposicion =
            "El punto de reposición debe ser menor que el stock máximo.";
        }
      }
    }

    // (Opcional) validación de stock_actual
    if (stockActual !== null && !isNaN(stockActual) && stockActual < 0) {
      e.ins_stock_actual = "El stock actual no puede ser negativo.";
    }

    return e;
  };

  useEffect(() => {
    api
      .get(`/api/insumos/${id}/`)
      .then(({ data }) => {
        setForm({
          ins_nombre: data.ins_nombre ?? "",
          ins_unidad: data.ins_unidad ?? "",
          ins_cantidad: data.ins_cantidad ?? "",
          ins_capacidad: data.ins_capacidad ?? "",
          ins_stock_actual: data.ins_stock_actual ?? "",
          ins_punto_reposicion: data.ins_punto_reposicion ?? "",
          ins_stock_min: data.ins_stock_min ?? "",
          ins_stock_max: data.ins_stock_max ?? "",
          id_estado_insumo: String(data.id_estado_insumo ?? 1),
        });
        setOriginalName(data.ins_nombre ?? "");
      })
      .catch((e) => console.error(e));
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
      const { data } = await api.get(
        `/api/insumos/?search=${encodeURIComponent(form.ins_nombre)}`
      );
      const list = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];
      const duplicated = list.some(
        (it) => normalizeName(it.ins_nombre) === wanted
      );
      if (duplicated && wanted !== original) {
        setErrors((prev) => ({
          ...prev,
          ins_nombre: "Ya existe un insumo con ese nombre.",
        }));
        return;
      }
    }

    try {
      await api.put(`/api/insumos/${id}/`, {
        ...form,
        id_estado_insumo: Number(form.id_estado_insumo),
        // cantidad y stock_actual se mandan tal como están, pero no los puede tocar el usuario
        ins_cantidad: form.ins_cantidad ? Number(form.ins_cantidad) : null,
        ins_capacidad: form.ins_capacidad ? Number(form.ins_capacidad) : null,
        ins_stock_actual: form.ins_stock_actual
          ? Number(form.ins_stock_actual)
          : 0,
        ins_punto_reposicion: form.ins_punto_reposicion
          ? Number(form.ins_punto_reposicion)
          : 0,
        ins_stock_min: form.ins_stock_min ? Number(form.ins_stock_min) : 0,
        ins_stock_max:
          form.ins_stock_max === "" ? null : Number(form.ins_stock_max),
      });
      setMsg("Insumo actualizado correctamente ✅");
      setTimeout(() => navigate("/inventario"), 1200);
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.detail || "Error al actualizar insumo");
    }
  };

  const valueUnidad = UNIDADES.includes(form.ins_unidad) ? form.ins_unidad : "";
  const { min: capMin, max: capMax, step: capStep } =
    getCapacidadConstraints(valueUnidad);

  const handleCancel = () => {
    navigate("/inventario");
  };

  return (
    <DashboardLayout>
      {/* ✅ Scope para que el CSS no sea global */}
      <div className="insumo-editar-scope">
        <InsumoEditarForm
          form={form}
          errors={errors}
          msg={msg}
          onChange={onChange}
          onBlur={onBlur}
          onSubmit={onSubmit}
          onCancel={handleCancel}
          estados={ESTADOS}
          valueUnidad={valueUnidad}
          capMin={capMin}
          capMax={capMax}
          capStep={capStep}
        />
      </div>
    </DashboardLayout>
  );
}




