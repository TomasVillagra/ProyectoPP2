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
    emp_nombre: "", emp_apellido: "",
    emp_tel: "", emp_correo: "", emp_dni: "",
    id_cargo_emp: "", id_estado_empleado: "",
    username: "", password: "",
  });

  useEffect(() => {
    Promise.all([api.get("/api/cargos/"), api.get("/api/estados-empleado/")]).then(
      ([cargosRes, estadosRes]) => {
        setCargos(cargosRes.data);
        setEstados(estadosRes.data);
      }
    );
  }, []);

  const onChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    try {
      await api.post("/api/empleados/", {
        ...form,
        id_cargo_emp: Number(form.id_cargo_emp),
        id_estado_empleado: Number(form.id_estado_empleado),
      });
      setMsg("Empleado registrado correctamente ✅");
      setTimeout(() => navigate("/empleados"), 1200);
    } catch (err) {
      console.error(err);
      setMsg("Error al registrar empleado");
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Registrar Empleado</h2>
      {msg && <p style={{ marginBottom: 12 }}>{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <div className="row">
          <label htmlFor="emp_nombre">Nombre =</label>
          <input id="emp_nombre" name="emp_nombre" value={form.emp_nombre} onChange={onChange} required />
        </div>
        <div className="row">
          <label htmlFor="emp_apellido">Apellido =</label>
          <input id="emp_apellido" name="emp_apellido" value={form.emp_apellido} onChange={onChange} required />
        </div>
        <div className="row">
          <label htmlFor="emp_tel">Teléfono =</label>
          <input id="emp_tel" name="emp_tel" value={form.emp_tel} onChange={onChange} placeholder="(opcional)" />
        </div>
        <div className="row">
          <label htmlFor="emp_correo">Correo =</label>
          <input id="emp_correo" name="emp_correo" value={form.emp_correo} onChange={onChange} placeholder="(opcional)" />
        </div>
        <div className="row">
          <label htmlFor="emp_dni">DNI =</label>
          <input id="emp_dni" name="emp_dni" value={form.emp_dni} onChange={onChange} placeholder="(opcional)" />
        </div>

        <div className="row">
          <label htmlFor="id_cargo_emp">Cargo =</label>
          <select id="id_cargo_emp" name="id_cargo_emp" value={form.id_cargo_emp} onChange={onChange} required>
            <option value="">Elegí un cargo…</option>
            {cargos.map(c => <option key={c.id_cargo_emp} value={c.id_cargo_emp}>{c.carg_nombre}</option>)}
          </select>
        </div>

        <div className="row">
          <label htmlFor="id_estado_empleado">Estado =</label>
          <select id="id_estado_empleado" name="id_estado_empleado" value={form.id_estado_empleado} onChange={onChange} required>
            <option value="">Elegí un estado…</option>
            {estados.map(e => <option key={e.id_estado_empleado} value={e.id_estado_empleado}>{e.estemp_nombre}</option>)}
          </select>
        </div>

        <div className="row">
          <label htmlFor="username">Usuario =</label>
          <input id="username" name="username" value={form.username} onChange={onChange} placeholder="" />
        </div>
        <div className="row">
          <label htmlFor="password">Contraseña =</label>
          <input id="password" name="password" type="password" value={form.password} onChange={onChange} placeholder="" />
        </div>

        <div className="actions">
          <button type="submit" className="btn primary">Registrar empleado</button>
          <button type="button" className="btn ghost" onClick={() => navigate("/empleados")}>Cancelar</button>
        </div>
      </form>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

/* --- estilos compartidos --- */
const styles = `
  .form {
    display: grid;
    gap: 12px;
    max-width: 980px;
  }
  .row {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 12px;
    align-items: center;
    background: #121212;
    border: 1px solid #232323;
    border-radius: 12px;
    padding: 12px 14px;
  }
  label {
    color: #bdbdbd;
    font-weight: 600;
    letter-spacing: .2px;
    justify-self: end;
  }
  input, select {
    width: 100%;
    background: #0f0f0f;
    color: #fff;
    border: 1px solid #2a2a2a;
    border-radius: 10px;
    padding: 10px 12px;
    outline: none;
  }
  input:focus, select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,.2);
  }
  .actions {
    display: flex;
    gap: 10px;
    margin-top: 6px;
  }
  .btn {
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid #2a2a2a;
    cursor: pointer;
  }
  .btn.primary {
    background: #2563eb;
    border-color: #2563eb;
    color: #fff;
    font-weight: 700;
  }
  .btn.primary:hover { filter: brightness(1.05); }
  .btn.ghost {
    background: transparent;
    color: #eaeaea;
  }
  .btn.ghost:hover {
    background: #1b1b1b;
  }
`;
