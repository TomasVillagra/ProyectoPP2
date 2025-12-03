import React from "react";

function FieldError({ error }) {
  if (!error) return null;
  return <small className="fieldError">{error}</small>;
}

export default function InsumoEditarForm({
  form,
  errors,
  msg,
  onChange,
  onBlur,
  onSubmit,
  onCancel,
  estados,
  valueUnidad,
  capMin,
  capMax,
  capStep,
}) {
  return (
    <div className="formContainer">
      <h2 className="formTitle">Editar Insumo</h2>
      {msg && <p className="formMessage">{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <div className="formGroup">
          <label htmlFor="ins_nombre">Nombre</label>
          <input
            id="ins_nombre"
            name="ins_nombre"
            value={form.ins_nombre}
            onChange={onChange}
            onBlur={onBlur}
            required
          />
          <FieldError error={errors.ins_nombre} />
        </div>

        <div className="formGroup">
          <label htmlFor="ins_unidad">Unidad</label>
          <select
            id="ins_unidad"
            name="ins_unidad"
            value={valueUnidad}
            onChange={onChange}
            onBlur={onBlur}
            required
          >
            {form.ins_unidad &&
              !["u", "kg", "g", "l", "ml"].includes(form.ins_unidad) && (
                <option value="" disabled>
                  {form.ins_unidad} (no estándar) — seleccioná una válida
                </option>
              )}
            <option value="">-- Seleccioná --</option>
            {["u", "kg", "g", "l", "ml"].map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <FieldError error={errors.ins_unidad} />
        </div>

        {/* ❌ No mostramos ins_cantidad ni ins_stock_actual */}

        <div className="formGroup">
          <label htmlFor="ins_capacidad">
            Capacidad por unidad ({valueUnidad || "unidad"})
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
          />
          <FieldError error={errors.ins_capacidad} />
        </div>

        <div className="formGroup">
          <label htmlFor="ins_punto_reposicion">Punto de reposición</label>
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
          <FieldError error={errors.ins_punto_reposicion} />
        </div>

        <div className="formGroup">
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
          <FieldError error={errors.ins_stock_min} />
        </div>

        <div className="formGroup">
          <label htmlFor="ins_stock_max">Stock máximo</label>
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
          <FieldError error={errors.ins_stock_max} />
        </div>

        <div className="formGroup">
          <label htmlFor="id_estado_insumo">Estado</label>
          <select
            id="id_estado_insumo"
            name="id_estado_insumo"
            value={form.id_estado_insumo}
            onChange={onChange}
            onBlur={onBlur}
            required
          >
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="formActions">
          <button type="submit" className="btn btnPrimary">
            Guardar Cambios
          </button>
          <button
            type="button"
            className="btn btnSecondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

