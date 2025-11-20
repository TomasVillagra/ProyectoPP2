import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

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

export default function InsumoRegistrar() {
  const location = useLocation();
  const navigate = useNavigate();
  const backTo = location.state?.backTo || null;

  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    ins_nombre: "",
    ins_unidad: "kg", // default
    ins_cantidad: "0",     // 👈 SIEMPRE 0 AL REGISTRAR (NO SE MUESTRA)
    ins_capacidad: "",
    ins_stock_actual: "0", // 👈 STOCK INICIAL 0 (NO SE MUESTRA)
    ins_punto_reposicion: "",
    ins_stock_min: "",
    ins_stock_max: "",
    id_estado_insumo: "1",
  });
  const [errors, setErrors] = useState({});

  const num = (v) =>
    v === "" || v === null || v === undefined ? null : Number(v);

  const validate = (values) => {
    const e = {};
    const nombre = (values.ins_nombre || "").trim();
    const unidad = (values.ins_unidad || "").trim();

    const capacidad = num(values.ins_capacidad);
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

    // ▶ Punto de reposición / stock mínimo / stock máximo (obligatorios)
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

    // ▶ Reglas de orden estricto:
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

    return e;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    // ✅ Chequeo de duplicado (ignora mayúsculas y espacios) ANTES del POST
    {
      const wanted = normalizeName(form.ins_nombre);
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
      if (duplicated) {
        setErrors((prev) => ({
          ...prev,
          ins_nombre: "Ya existe un insumo con ese nombre.",
        }));
        return;
      }
    }

    // 👇 Stock inicial SIEMPRE 0 al registrar
    const stockCalc = 0;

    try {
      await api.post("/api/insumos/", {
        ...form,
        id_estado_insumo: Number(form.id_estado_insumo),
        ins_cantidad: 0, // cantidad inicial 0
        ins_capacidad: form.ins_capacidad
          ? Number(form.ins_capacidad)
          : null,
        ins_stock_actual: stockCalc,
        ins_punto_reposicion: form.ins_punto_reposicion
          ? Number(form.ins_punto_reposicion)
          : 0,
        ins_stock_min: form.ins_stock_min
          ? Number(form.ins_stock_min)
          : 0,
        ins_stock_max:
          form.ins_stock_max === "" ? null : Number(form.ins_stock_max),
      });
      setMsg("Insumo creado correctamente ✅");

      setTimeout(() => {
        if (backTo) {
          navigate(backTo, {
            replace: true,
            state: { flash: "Insumo creado correctamente ✅" },
          });
        } else {
          navigate("/inventario", { replace: true });
        }
      }, 800);
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.detail || "Error al registrar insumo");
    }
  };

  const { min: capMin, max: capMax, step: capStep } = getCapacidadConstraints(
    form.ins_unidad
  );

  return (
    <DashboardLayout>
      <div className="form-container">
        <h2 className="form-title">Registrar Nuevo Insumo</h2>
        {msg && <p className="form-message">{msg}</p>}

        <form onSubmit={onSubmit} className="form">
          <div className="form-group">
            <label htmlFor="ins_nombre">Nombre</label>
            <input
              id="ins_nombre"
              name="ins_nombre"
              value={form.ins_nombre}
              onChange={onChange}
              onBlur={onBlur}
              required
              placeholder="Ej. Queso mozzarella"
            />
            {errors.ins_nombre && (
              <small className="field-error">{errors.ins_nombre}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ins_unidad">Unidad</label>
            <select
              id="ins_unidad"
              name="ins_unidad"
              value={form.ins_unidad}
              onChange={onChange}
              onBlur={onBlur}
              required
            >
              <option value="">-- Seleccioná --</option>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {errors.ins_unidad && (
              <small className="field-error">{errors.ins_unidad}</small>
            )}
          </div>

          {/* ✅ CANTIDAD INICIAL / STOCK ACTUAL YA NO SE MUESTRAN
              (quedan siempre en 0 al registrar)
           */}

          <div className="form-group">
            <label htmlFor="ins_capacidad">
              Capacidad por unidad ({form.ins_unidad || "unidad"})
            </label>
            <input
              id="ins_capacidad"
              name="ins_capacidad"
              type="number"
              value={form.ins_capacidad}
              onChange={onChange}
              onBlur={onBlur}
              required
              min={capMin !== undefined ? capMin : undefined}
              max={capMax !== undefined ? capMax : undefined}
              step={capStep !== undefined ? capStep : "0.01"}
              placeholder="Ej. 6 (botellas por fardo, 2 kg por bolsa...)"
            />
            {errors.ins_capacidad && (
              <small className="field-error">{errors.ins_capacidad}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ins_punto_reposicion">
              Punto de reposición
            </label>
            <input
              id="ins_punto_reposicion"
              name="ins_punto_reposicion"
              type="number"
              step="0.01"
              min="0"
              value={form.ins_punto_reposicion}
              onChange={onChange}
              onBlur={onBlur}
              required
            />
            {errors.ins_punto_reposicion && (
              <small className="field-error">
                {errors.ins_punto_reposicion}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ins_stock_min">Stock mínimo</label>
            <input
              id="ins_stock_min"
              name="ins_stock_min"
              type="number"
              step="0.01"
              min="0"
              value={form.ins_stock_min}
              onChange={onChange}
              onBlur={onBlur}
              required
            />
            {errors.ins_stock_min && (
              <small className="field-error">{errors.ins_stock_min}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ins_stock_max">Stock máximo </label>
            <input
              id="ins_stock_max"
              name="ins_stock_max"
              type="number"
              step="0.01"
              min="0"
              value={form.ins_stock_max}
              onChange={onChange}
              onBlur={onBlur}
            />
            {errors.ins_stock_max && (
              <small className="field-error">{errors.ins_stock_max}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="id_estado_insumo">Estado</label>
            <select
              id="id_estado_insumo"
              name="id_estado_insumo"
              value={form.id_estado_insumo}
              onChange={onChange}
              onBlur={onBlur}
              required
            >
              {ESTADOS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Registrar insumo
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (backTo) navigate(backTo, { replace: true });
                else navigate("/inventario");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <style>{formStyles}</style>
      <style>
        {`
          .field-error{color:#fca5a5;font-size:.85rem}
          .hint{color:#d4d4d8;font-size:.8rem;}
        `}
      </style>
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
    gap: 20px;
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





