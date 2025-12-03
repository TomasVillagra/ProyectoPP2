import React from "react";

export default function EmpleadoRegistrarDatosPersonales({
  form,
  errors,
  onChange,
  onBlur,
  FieldError,
}) {
  return (
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
  );
}
