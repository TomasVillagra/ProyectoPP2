import React from "react";

function FieldError({ error }) {
  if (!error) return null;
  return <small className="field-error">{error}</small>;
}

export default function EmpleadoEditarForm({
  form,
  cargos,
  estados,
  msg,
  errors,
  onChange,
  onBlur,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="form-container">
      <h2 className="form-title">Editar Empleado</h2>
      {msg && <p className="form-message">{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        {/* DATOS PERSONALES */}
        <div className="form-section">
          <h3 className="section-title">Datos personales</h3>

          <div className="form-group">
            <label htmlFor="emp_nombre">Nombre</label>
            <input
              id="emp_nombre"
              name="emp_nombre"
              value={form.emp_nombre}
              onChange={onChange}
              onBlur={onBlur}
              required
            />
            <FieldError error={errors.emp_nombre} />
          </div>

          <div className="form-group">
            <label htmlFor="emp_apellido">Apellido</label>
            <input
              id="emp_apellido"
              name="emp_apellido"
              value={form.emp_apellido}
              onChange={onChange}
              onBlur={onBlur}
              required
            />
            <FieldError error={errors.emp_apellido} />
          </div>

          <div className="form-group">
            <label htmlFor="emp_dni">DNI</label>
            <input
              id="emp_dni"
              name="emp_dni"
              value={form.emp_dni}
              onChange={onChange}
              onBlur={onBlur}
              maxLength={8}
              placeholder="8 dígitos"
            />
            <FieldError error={errors.emp_dni} />
          </div>

          <div className="form-group">
            <label htmlFor="emp_tel">Teléfono</label>
            <input
              id="emp_tel"
              name="emp_tel"
              value={form.emp_tel}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Ej: +54 387 1234567"
            />
            <FieldError error={errors.emp_tel} />
          </div>

          <div className="form-group span-2">
            <label htmlFor="emp_correo">Correo</label>
            <input
              id="emp_correo"
              name="emp_correo"
              type="email"
              value={form.emp_correo}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="ejemplo@correo.com"
            />
            <FieldError error={errors.emp_correo} />
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
              onChange={onChange}
              onBlur={onBlur}
              required
            >
              <option value="">Elegí un cargo…</option>
              {cargos.map((c) => (
                <option key={c.id_cargo_emp} value={c.id_cargo_emp}>
                  {c.carg_nombre}
                </option>
              ))}
            </select>
            <FieldError error={errors.id_cargo_emp} />
          </div>

          <div className="form-group">
            <label htmlFor="id_estado_empleado">Estado</label>
            <select
              id="id_estado_empleado"
              name="id_estado_empleado"
              value={form.id_estado_empleado}
              onChange={onChange}
              onBlur={onBlur}
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
            <FieldError error={errors.id_estado_empleado} />
          </div>

          <div className="form-group">
            <label htmlFor="username">Usuario (no se modifica al editar)</label>
            <input
              id="username"
              name="username"
              value={form.username}
              readOnly
              placeholder="Se mantiene el usuario actual"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Nueva contraseña (opcional)</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              onBlur={onBlur}
              maxLength={20}
              placeholder="Dejar vacío para no cambiar"
            />
            <FieldError error={errors.password} />
          </div>
        </div>

        <div className="form-actions span-2">
          <button type="submit" className="btn btn-primary">
            Guardar cambios
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
