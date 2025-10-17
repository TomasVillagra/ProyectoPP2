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
    emp_nombre: "", emp_apellido: "", emp_tel: "", emp_correo: "", emp_dni: "",
    id_cargo_emp: "", id_estado_empleado: "", username: "", password: "",
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
      <div className="form-container">
        <h2 className="form-title">Registrar Nuevo Empleado</h2>
        {msg && <p className="form-message">{msg}</p>}

        <form onSubmit={onSubmit} className="form">
          <div className="form-section">
            <h3 className="section-title">Datos Personales</h3>
            <div className="form-group">
              <label htmlFor="emp_nombre">Nombre</label>
              <input id="emp_nombre" name="emp_nombre" value={form.emp_nombre} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="emp_apellido">Apellido</label>
              <input id="emp_apellido" name="emp_apellido" value={form.emp_apellido} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="emp_dni">DNI (Opcional)</label>
              <input id="emp_dni" name="emp_dni" value={form.emp_dni} onChange={onChange} />
            </div>
            <div className="form-group">
              <label htmlFor="emp_tel">Teléfono (Opcional)</label>
              <input id="emp_tel" name="emp_tel" value={form.emp_tel} onChange={onChange} />
            </div>
            <div className="form-group span-2">
              <label htmlFor="emp_correo">Correo (Opcional)</label>
              <input id="emp_correo" type="email" name="emp_correo" value={form.emp_correo} onChange={onChange} />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Datos del Sistema</h3>
            <div className="form-group">
              <label htmlFor="id_cargo_emp">Cargo</label>
              <select id="id_cargo_emp" name="id_cargo_emp" value={form.id_cargo_emp} onChange={onChange} required>
                <option value="">Elegí un cargo…</option>
                {cargos.map(c => <option key={c.id_cargo_emp} value={c.id_cargo_emp}>{c.carg_nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="id_estado_empleado">Estado</label>
              <select id="id_estado_empleado" name="id_estado_empleado" value={form.id_estado_empleado} onChange={onChange} required>
                <option value="">Elegí un estado…</option>
                {estados.map(e => <option key={e.id_estado_empleado} value={e.id_estado_empleado}>{e.estemp_nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="username">Usuario (Para login)</label>
              <input id="username" name="username" value={form.username} onChange={onChange} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña (Para login)</label>
              <input id="password" name="password" type="password" value={form.password} onChange={onChange} />
            </div>
          </div>

          <div className="form-actions span-2">
            <button type="submit" className="btn btn-primary">Registrar Empleado</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/empleados")}>Cancelar</button>
          </div>
        </form>
      </div>
      <style>{formStyles}</style>
    </DashboardLayout>
  );
}

const formStyles = `
  .form-container { background-color: #2c2c2e; border: 1px solid #3a3a3c; border-radius: 12px; padding: 24px; max-width: 900px; margin: 0 auto; }
  .form-title { margin: 0 0 24px 0; font-size: 1.5rem; }
  .form-message { margin: 0 0 16px 0; color: #facc15; }
  .form { display: grid; grid-template-columns: 1fr; gap: 24px; }
  .form-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; border-top: 1px solid #3a3a3c; padding-top: 24px; }
  .section-title { grid-column: 1 / -1; margin: 0 0 8px 0; font-size: 1rem; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-group.span-2 { grid-column: 1 / -1; }
  .form-group label { font-weight: 600; color: #d1d5db; }
  .form-group input, .form-group select { background-color: #3a3a3c; color: #fff; border: 1px solid #4a4a4e; border-radius: 8px; padding: 10px 12px; outline: none; transition: border-color 0.2s ease; }
  .form-group input:focus, .form-group select:focus { border-color: #facc15; }
  .form-actions { display: flex; gap: 12px; margin-top: 16px; grid-column: 1 / -1; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; text-decoration: none; transition: background-color 0.2s ease; }
  .btn-primary { background-color: #facc15; color: #111827; }
  .btn-primary:hover { background-color: #eab308; }
  .btn-secondary { background-color: #3a3a3c; color: #eaeaea; }
  .btn-secondary:hover { background-color: #4a4a4e; }
`;