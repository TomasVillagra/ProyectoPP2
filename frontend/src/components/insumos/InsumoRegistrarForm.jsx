import React from "react";

function FieldError({ error }) {
  if (!error) return null;
  return <small className="field-error">{error}</small>;
}

export default function InsumoRegistrarForm({
  form,
  errors,
  msg,
  onChange,
  onBlur,
  onSubmit,
  onCancel,
  estados,
  unidades,
  capMin,
  capMax,
  capStep,
}) {
  return (
    <div className="form-container">
      <h2 className="form-title">Registrar Nuevo Insumo</h2>
      {msg && <p className="form-message">{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <div className="form-group">
          <label htmlFor="ins_nombre">Nombre</label>
          <input
            id="ins_nombre"
            name="ins_nombre"
            value={form.ins_nombre}
            onChange={onChange}
            onBlur={onBlur}
            required
            placeholder="Ej. Queso mozzarella"
          />
          <FieldError error={errors.ins_nombre} />
        </div>

        <div className="form-group">
          <label htmlFor="ins_unidad">Unidad</label>
          <select
            id="ins_unidad"
            name="ins_unidad"
            value={form.ins_unidad}
            onChange={onChange}
            onBlur={onBlur}
            required
          >
            <option value="">-- Seleccioná --</option>
            {unidades.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <FieldError error={errors.ins_unidad} />
        </div>

        {/* Cantidad inicial / stock actual NO se muestran, quedan 0 */}

        <div className="form-group">
          <label htmlFor="ins_capacidad">
            Capacidad por unidad ({form.ins_unidad || "unidad"})
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
            placeholder="Ej. 6 (botellas por fardo, 2 kg por bolsa...)"
          />
          <FieldError error={errors.ins_capacidad} />
        </div>

        <div className="form-group">
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

        <div className="form-group">
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

        <div className="form-group">
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

        <div className="form-group">
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

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Registrar insumo
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
