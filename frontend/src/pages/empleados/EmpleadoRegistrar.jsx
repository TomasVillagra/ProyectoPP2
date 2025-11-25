import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function EmpleadoRegistrar() {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    emp_nombre: "",
    emp_apellido: "",
    emp_tel: "",
    emp_correo: "",
    emp_dni: "",
    id_cargo_emp: "",
    id_estado_empleado: "",
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      api.get("/api/cargos/"),
      api.get("/api/estados-empleado/"),
    ])
      .then(([cargosRes, estadosRes]) => {
        setCargos(
          Array.isArray(cargosRes.data?.results)
            ? cargosRes.data.results
            : cargosRes.data
        );
        setEstados(
          Array.isArray(estadosRes.data?.results)
            ? estadosRes.data.results
            : estadosRes.data
        );
      })
      .catch((err) => {
        console.error(err);
        setMsg("No se pudieron cargar cargos/estados.");
      });
  }, []);

  const norm = (s) => (s ? s.toString().trim().toLowerCase() : "");

  const validate = (values) => {
    const e = {};
    const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

    const nombre = (values.emp_nombre || "").trim();
    const apellido = (values.emp_apellido || "").trim();
    const dni = (values.emp_dni || "").trim();
    const tel = (values.emp_tel || "").trim();
    const correo = (values.emp_correo || "").trim();

    // Nombre
    if (!nombre) {
      e.emp_nombre = "El nombre es obligatorio.";
    } else if (nombre.length < 3 || nombre.length > 20) {
      e.emp_nombre = "El nombre debe tener entre 3 y 20 caracteres.";
    } else if (!nameRegex.test(nombre)) {
      e.emp_nombre = "El nombre solo puede contener letras y espacios.";
    }

    // Apellido
    if (!apellido) {
      e.emp_apellido = "El apellido es obligatorio.";
    } else if (apellido.length < 3 || apellido.length > 20) {
      e.emp_apellido = "El apellido debe tener entre 3 y 20 caracteres.";
    } else if (!nameRegex.test(apellido)) {
      e.emp_apellido = "El apellido solo puede contener letras y espacios.";
    }

    // DNI
    if (!dni) {
      e.emp_dni = "El DNI es obligatorio.";
    } else if (!/^\d{8}$/.test(dni)) {
      e.emp_dni = "El DNI debe tener exactamente 8 dígitos numéricos.";
    }

    // Teléfono
    const telDigits = tel.replace(/\D/g, "");
    if (!tel) {
      e.emp_tel = "El teléfono es obligatorio.";
    } else if (!/^[0-9+\s-]+$/.test(tel)) {
      e.emp_tel =
        "El teléfono solo puede contener números, espacios, + y guiones.";
    } else if (telDigits.length < 7 || telDigits.length > 20) {
      e.emp_tel = "El teléfono debe tener entre 7 y 20 dígitos.";
    }

    // Correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo) {
      e.emp_correo = "El correo es obligatorio.";
    } else if (!emailRegex.test(correo)) {
      e.emp_correo = "Correo inválido (ej: nombre@dominio.com).";
    }

    // Cargo
    if (!values.id_cargo_emp) {
      e.id_cargo_emp = "El cargo es obligatorio.";
    }

    // Estado
    if (!values.id_estado_empleado) {
      e.id_estado_empleado = "El estado es obligatorio.";
    }

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // DNI: solo números y sincroniza username/password
    if (name === "emp_dni") {
      const soloNums = value.replace(/\D/g, "");
      setForm((prev) => ({
        ...prev,
        emp_dni: soloNums,
        username: soloNums,
        password: soloNums,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleBlur = () => {
    setErrors(validate(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    // Validaciones básicas
    const baseErrors = validate(form);
    setErrors(baseErrors);
    if (Object.keys(baseErrors).length > 0) {
      setMsg("Revisá los errores marcados.");
      return;
    }

    const dni = form.emp_dni.trim();
    const correo = form.emp_correo.trim();
    const tel = form.emp_tel.trim();

    try {
      // Traer empleados para chequear duplicados
      const resp = await api.get("/api/empleados/");
      const data = Array.isArray(resp.data?.results)
        ? resp.data.results
        : resp.data;
      const empleados = Array.isArray(data) ? data : [];

      const dupErrors = {};

      // DNI único
      const dniOcupado = empleados.some(
        (emp) => String(emp.emp_dni || "") === dni
      );
      if (dniOcupado) {
        dupErrors.emp_dni = "Ya existe un empleado con ese DNI.";
      }

      // Teléfono único
      const telOcupado = empleados.some(
        (emp) => norm(emp.emp_tel) === norm(tel)
      );
      if (telOcupado) {
        dupErrors.emp_tel = "Ya existe un empleado con ese teléfono.";
      }

      // Correo único
      const correoOcupado = empleados.some(
        (emp) => norm(emp.emp_correo) === norm(correo)
      );
      if (correoOcupado) {
        dupErrors.emp_correo = "Ya existe un empleado con ese correo.";
      }

      if (Object.keys(dupErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...dupErrors }));
        setMsg("Hay datos duplicados. Revisá los errores marcados.");
        return;
      }

      // DNI como usuario y contraseña
      const dniLogin = dni;

      await api.post("/api/empleados/", {
        ...form,
        emp_dni: dniLogin,
        emp_tel: tel,
        emp_correo: correo,
        id_cargo_emp: Number(form.id_cargo_emp),
        id_estado_empleado: Number(form.id_estado_empleado),
        username: dniLogin,
        password: dniLogin,
      });

      setMsg("Empleado registrado correctamente ✅");
      setErrors({});
      setTimeout(() => navigate("/empleados"), 1200);
    } catch (err) {
      console.error(err);
      setMsg("Error al registrar empleado");
    }
  };

  return (
    <DashboardLayout>
      <div className="form-container">
        <h2 className="form-title">Registrar Nuevo Empleado</h2>
        {msg && <p className="form-message">{msg}</p>}

        <form onSubmit={handleSubmit} className="form">
          {/* DATOS PERSONALES */}
          <div className="form-section">
            <h3 className="section-title">Datos personales</h3>

            <div className="form-group">
              <label htmlFor="emp_nombre">Nombre</label>
              <input
                id="emp_nombre"
                name="emp_nombre"
                value={form.emp_nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {errors.emp_nombre && (
                <small className="field-error">{errors.emp_nombre}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="emp_apellido">Apellido</label>
              <input
                id="emp_apellido"
                name="emp_apellido"
                value={form.emp_apellido}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {errors.emp_apellido && (
                <small className="field-error">{errors.emp_apellido}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="emp_dni">DNI</label>
              <input
                id="emp_dni"
                name="emp_dni"
                value={form.emp_dni}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={8}
                placeholder="8 dígitos"
              />
              {errors.emp_dni && (
                <small className="field-error">{errors.emp_dni}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="emp_tel">Teléfono</label>
              <input
                id="emp_tel"
                name="emp_tel"
                value={form.emp_tel}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej: +54 387 1234567"
              />
              {errors.emp_tel && (
                <small className="field-error">{errors.emp_tel}</small>
              )}
            </div>

            <div className="form-group span-2">
              <label htmlFor="emp_correo">Correo</label>
              <input
                id="emp_correo"
                name="emp_correo"
                type="email"
                value={form.emp_correo}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ejemplo@correo.com"
              />
              {errors.emp_correo && (
                <small className="field-error">{errors.emp_correo}</small>
              )}
            </div>
          </div>

          {/* DATOS DEL SISTEMA */}
          <div className="form-section">
            <h3 className="section-title">Datos del sistema</h3>

            <div className="form-group">
              <label htmlFor="id_cargo_emp">Cargo</label>
              <select
                id="id_cargo_emp"
                name="id_cargo_emp"
                value={form.id_cargo_emp}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              >
                <option value="">Elegí un cargo…</option>
                {cargos.map((c) => (
                  <option key={c.id_cargo_emp} value={c.id_cargo_emp}>
                    {c.carg_nombre}
                  </option>
                ))}
              </select>
              {errors.id_cargo_emp && (
                <small className="field-error">{errors.id_cargo_emp}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="id_estado_empleado">Estado</label>
              <select
                id="id_estado_empleado"
                name="id_estado_empleado"
                value={form.id_estado_empleado}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              >
                <option value="">Elegí un estado…</option>
                {estados.map((e) => (
                  <option
                    key={e.id_estado_empleado}
                    value={e.id_estado_empleado}
                  >
                    {e.estemp_nombre}
                  </option>
                ))}
              </select>
              {errors.id_estado_empleado && (
                <small className="field-error">
                  {errors.id_estado_empleado}
                </small>
              )}
            </div>

            {/* Usuario / contraseña solo informativos */}
            <div className="form-group">
              <label htmlFor="username">
                Usuario (para login - se usa el DNI)
              </label>
              <input
                id="username"
                name="username"
                value={form.emp_dni}
                readOnly
                placeholder="Se completará con el DNI"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Contraseña (para login - se usa el DNI)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.emp_dni}
                readOnly
                placeholder="Se completará con el DNI"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Registrar Empleado
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/empleados")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
  .form-container {
    background-color: #2c2c2e;
    border: 1px solid #3a3a3c;
    border-radius: 12px;
    padding: 24px;
    max-width: 900px;
    margin: 0 auto;
  }
  .form-title {
    margin: 0 0 24px 0;
    font-size: 1.5rem;
  }
  .form-message {
    margin: 0 0 16px 0;
    color: #facc15;
    white-space: pre-wrap;
  }
  .form {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .form-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    border-top: 1px solid #3a3a3c;
    padding-top: 24px;
  }
  .section-title {
    grid-column: 1 / -1;
    margin: 0 0 8px 0;
    font-size: 1rem;
    color: #a0a0a0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .form-group.span-2 {
    grid-column: 1 / -1;
  }
  .form-group label {
    font-weight: 600;
    color: #d1d5db;
  }
  .form-group input,
  .form-group select {
    background-color: #3a3a3c;
    color: #fff;
    border: 1px solid #4a4a4e;
    border-radius: 8px;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .form-group input:focus,
  .form-group select:focus {
    border-color: #facc15;
  }
  .form-actions {
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
  .field-error {
    color: #fca5a5;
    font-size: 0.85rem;
  }
`;

