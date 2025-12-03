import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import EmpleadoEditarForm from "../../components/empleados/EmpleadoEditarForm";

import "./EmpleadoEditar.css"; // ✅ CSS local (scoped)

export default function EmpleadoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    emp_nombre: "",
    emp_apellido: "",
    emp_tel: "",
    emp_correo: "",
    emp_dni: "",
    id_cargo_emp: "",
    id_estado_empleado: "",
    username: "",
    password: "", // nueva contraseña (opcional)
  });
  const [cargos, setCargos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});

  const norm = (s) => (s ? s.toString().trim().toLowerCase() : "");

  useEffect(() => {
    (async () => {
      try {
        const [emp, carg, est] = await Promise.all([
          api.get(`/api/empleados/${id}/`),
          api.get("/api/cargos/"),
          api.get("/api/estados-empleado/"),
        ]);

        const empData = emp.data || {};
        setForm({
          emp_nombre: empData.emp_nombre || "",
          emp_apellido: empData.emp_apellido || "",
          emp_tel: empData.emp_tel || "",
          emp_correo: empData.emp_correo || "",
          emp_dni: empData.emp_dni ? String(empData.emp_dni) : "",
          id_cargo_emp: empData.id_cargo_emp
            ? String(empData.id_cargo_emp)
            : "",
          id_estado_empleado: empData.id_estado_empleado
            ? String(empData.id_estado_empleado)
            : "",
          // Solo para mostrar, NO se envía en el PUT
          username: empData.username || empData.emp_dni || "",
          password: "", // en edición: nueva contraseña (opcional)
        });

        // Filtramos cocinero y repositor
        const rawCargos = Array.isArray(carg.data?.results)
          ? carg.data.results
          : carg.data;
        const lista = Array.isArray(rawCargos) ? rawCargos : [];
        const filtrados = lista.filter((c) => {
          const name = norm(c.carg_nombre);
          return name !== "cocinero" && name !== "repositor";
        });
        setCargos(filtrados);

        setEstados(
          Array.isArray(est.data?.results) ? est.data.results : est.data
        );
      } catch (err) {
        console.error(err);
        setMsg("No se pudieron cargar los datos del empleado.");
      }
    })();
  }, [id]);

  const validate = (values) => {
    const e = {};
    const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

    const nombre = (values.emp_nombre || "").trim();
    const apellido = (values.emp_apellido || "").trim();
    const dni = (values.emp_dni || "").trim();
    const tel = (values.emp_tel || "").trim();
    const correo = (values.emp_correo || "").trim();
    const pwd = (values.password || "").trim();

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
    
    // 🚫 Nombre y apellido no pueden ser iguales
    if (
      nombre &&
      apellido &&
      nombre.toLowerCase() === apellido.toLowerCase()
    ) {
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

    // Contraseña nueva (opcional)
    if (pwd) {
      if (pwd.length < 6 || pwd.length > 20) {
        e.password = "La contraseña debe tener entre 6 y 20 caracteres.";
      }
    }

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "emp_dni") {
      // ⛔ Ya NO toca username ni password
      const soloNums = value.replace(/\D/g, "");
      setForm((prev) => ({
        ...prev,
        emp_dni: soloNums,
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

    const baseErrors = validate(form);
    setErrors(baseErrors);
    if (Object.keys(baseErrors).length > 0) {
      setMsg("Revisá los errores marcados.");
      return;
    }

    const dni = form.emp_dni.trim();
    const correo = form.emp_correo.trim();
    const tel = form.emp_tel.trim();
    const pwd = form.password.trim();

    try {
      // empleados para duplicados (excluyendo al propio)
      const resp = await api.get("/api/empleados/");
      const data = Array.isArray(resp.data?.results)
        ? resp.data.results
        : resp.data;
      const empleados = Array.isArray(data) ? data : [];

      const dupErrors = {};
      const thisId = String(id);

      const empIdStr = (emp) =>
        String(emp.id_empleado ?? emp.id ?? "");

      // DNI único
      const dniOcupado = empleados.some(
        (emp) =>
          String(emp.emp_dni || "") === dni &&
          empIdStr(emp) !== thisId
      );
      if (dniOcupado) {
        dupErrors.emp_dni = "Ya existe un empleado con ese DNI.";
      }

      // Teléfono único
      const telOcupado = empleados.some(
        (emp) =>
          norm(emp.emp_tel) === norm(tel) && empIdStr(emp) !== thisId
      );
      if (telOcupado) {
        dupErrors.emp_tel =
          "Ya existe un empleado con ese teléfono.";
      }

      // Correo único
      const correoOcupado = empleados.some(
        (emp) =>
          norm(emp.emp_correo) === norm(correo) &&
          empIdStr(emp) !== thisId
      );
      if (correoOcupado) {
        dupErrors.emp_correo =
          "Ya existe un empleado con ese correo.";
      }

      if (Object.keys(dupErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...dupErrors }));
        setMsg("Hay datos duplicados. Revisá los errores marcados.");
        return;
      }

      const dniLogin = dni;

      // Armamos payload SIN username y con password solo si se cambia
      const payload = {
        emp_nombre: form.emp_nombre,
        emp_apellido: form.emp_apellido,
        emp_tel: tel,
        emp_correo: correo,
        emp_dni: dniLogin,
        id_cargo_emp: Number(form.id_cargo_emp),
        id_estado_empleado: Number(form.id_estado_empleado),
      };

      if (pwd) {
        payload.password = pwd; // se cambia contraseña
      }
      // username NO se envía: no se toca el login

      await api.put(`/api/empleados/${id}/`, payload);

      setMsg("Empleado actualizado correctamente ✅");
      setErrors({});
      setTimeout(() => navigate("/empleados"), 1200);
    } catch (err) {
      console.error(err);
      setMsg("Error al actualizar empleado");
    }
  };

  const handleCancel = () => {
    navigate("/empleados");
  };

  return (
    <DashboardLayout>
      <div className="empleado-editar-scope">
        <EmpleadoEditarForm
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


