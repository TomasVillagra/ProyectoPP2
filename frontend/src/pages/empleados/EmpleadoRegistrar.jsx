import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import EmpleadoRegistrarForm from "../../components/empleados/EmpleadoRegistrarForm";

// ✅ CSS local de la página (NO global)
import "./EmpleadoRegistrar.css";

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

  const norm = (s) => (s ? s.toString().trim().toLowerCase() : "");

  useEffect(() => {
    Promise.all([api.get("/api/cargos/"), api.get("/api/estados-empleado/")])
      .then(([cargosRes, estadosRes]) => {
        // 🔹 Tomamos los cargos del backend
        const rawCargos = Array.isArray(cargosRes.data?.results)
          ? cargosRes.data.results
          : cargosRes.data;
        const lista = Array.isArray(rawCargos) ? rawCargos : [];

        // 🔒 SOLO permitir Administrador, Mozo o Cajero
        const filtrados = lista.filter((c) => {
          const name = norm(c.carg_nombre);
          return (
            name === "administrador" ||
            name === "mozo" ||
            name === "cajero"
          );
        });

        setCargos(filtrados);

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

    // ❌ Nombre y apellido no pueden ser iguales
    if (nombre.toLowerCase() === apellido.toLowerCase()) {
      e.emp_nombre = "El nombre y apellido no pueden ser iguales.";
      e.emp_apellido = "El nombre y apellido no pueden ser iguales.";
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

  const handleCancel = () => {
    navigate("/empleados");
  };

  return (
    <DashboardLayout>
      {/* ✅ scope para que el CSS no sea global */}
      <div className="empleado-registrar-scope">
        <EmpleadoRegistrarForm
          form={form}
          cargos={cargos}
          estados={estados}
          msg={msg}
          errors={errors}
          onChange={handleChange}
          onBlur={handleBlur}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
}



