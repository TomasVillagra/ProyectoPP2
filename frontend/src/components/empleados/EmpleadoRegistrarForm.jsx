import React from "react";
import EmpleadoRegistrarDatosPersonales from "./EmpleadoRegistrarDatosPersonales";
import EmpleadoRegistrarDatosSistema from "./EmpleadoRegistrarDatosSistema";

function FieldError({ error }) {
  if (!error) return null;
  return <small className="field-error">{error}</small>;
}

export default function EmpleadoRegistrarForm({
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
      <h2 className="form-title">Registrar Nuevo Empleado</h2>
      {msg && <p className="form-message">{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <EmpleadoRegistrarDatosPersonales
          form={form}
          errors={errors}
          onChange={onChange}
          onBlur={onBlur}
          FieldError={FieldError}
        />

        <EmpleadoRegistrarDatosSistema
          form={form}
          cargos={cargos}
          estados={estados}
          errors={errors}
          onChange={onChange}
          onBlur={onBlur}
          FieldError={FieldError}
        />

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Registrar Empleado
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
