export default function MesaEditarForm({
  form,
  errors,
  estados,
  bloqueada,
  onChange,
  blockInvalidInt,
}) {
  return (
    <>
      <div className="mesa-edit-row">
        <label htmlFor="ms_numero">Número</label>
        <input
          id="ms_numero"
          name="ms_numero"
          type="text"
          inputMode="numeric"
          value={form.ms_numero}
          onChange={onChange}
          onKeyDown={blockInvalidInt}
          required
          disabled={bloqueada}
        />
        {errors.ms_numero && (
          <small className="mesa-edit-error">{errors.ms_numero}</small>
        )}
      </div>

      <div className="mesa-edit-row">
        <label htmlFor="id_estado_mesa">Estado</label>
        <select
          id="id_estado_mesa"
          name="id_estado_mesa"
          value={form.id_estado_mesa}
          onChange={onChange}
          required
          disabled={bloqueada}
        >
          <option value="">-- Seleccioná --</option>
          {estados.map((e) => (
            <option key={e.id_estado_mesa} value={e.id_estado_mesa}>
              {e.estms_nombre}
            </option>
          ))}
        </select>
        {errors.id_estado_mesa && (
          <small className="mesa-edit-error">{errors.id_estado_mesa}</small>
        )}
      </div>
    </>
  );
}
