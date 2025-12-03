import React from "react";

export default function EmpleadoRegistrarDatosSistema({
  form,
  cargos,
  estados,
  errors,
  onChange,
  onBlur,
  FieldError,
}) {
  return (
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
  );
}
