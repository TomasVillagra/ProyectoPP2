export default function ProveedorEditarForm({
  form,
  onChange,
  onBlur,
  errors,
  estados,
  categorias,
}) {
  return (
    <>
      <div className="prov-edit-row">
        <label>Nombre</label>
        <input
          name="prov_nombre"
          value={form.prov_nombre}
          onChange={onChange}
          onBlur={onBlur}
        />
        {errors.prov_nombre && (
          <small className="prov-edit-error">{errors.prov_nombre}</small>
        )}
      </div>

      <div className="prov-edit-row">
        <label>Categoría</label>
        <select
          name="id_categoria_prov"
          value={form.id_categoria_prov}
          onChange={onChange}
          onBlur={onBlur}
        >
          <option value="">Elegí una categoría…</option>
          {categorias.map((c) => (
            <option key={c.id_categoria_prov} value={c.id_categoria_prov}>
              {c.catprov_nombre}
            </option>
          ))}
        </select>
        {errors.id_categoria_prov && (
          <small className="prov-edit-error">
            {errors.id_categoria_prov}
          </small>
        )}
      </div>

      <div className="prov-edit-row">
        <label>Teléfono</label>
        <input
          name="prov_tel"
          value={form.prov_tel}
          onChange={onChange}
          onBlur={onBlur}
        />
        {errors.prov_tel && (
          <small className="prov-edit-error">{errors.prov_tel}</small>
        )}
      </div>

      <div className="prov-edit-row">
        <label>Correo (Opcional)</label>
        <input
          type="email"
          name="prov_correo"
          value={form.prov_correo}
          onChange={onChange}
          onBlur={onBlur}
        />
        {errors.prov_correo && (
          <small className="prov-edit-error">{errors.prov_correo}</small>
        )}
      </div>

      <div className="prov-edit-row prov-edit-full">
        <label>Dirección</label>
        <input
          name="prov_direccion"
          value={form.prov_direccion}
          onChange={onChange}
          onBlur={onBlur}
        />
        {errors.prov_direccion && (
          <small className="prov-edit-error">{errors.prov_direccion}</small>
        )}
      </div>

      <div className="prov-edit-row">
        <label>Estado</label>
        <select
          name="id_estado_prov"
          value={form.id_estado_prov}
          onChange={onChange}
          onBlur={onBlur}
        >
          {estados.map((e) => (
            <option
              key={e.id_estado_prov}
              value={e.id_estado_prov}
            >
              {e.estprov_nombre}
            </option>
          ))}
        </select>
        {errors.id_estado_prov && (
          <small className="prov-edit-error">{errors.id_estado_prov}</small>
        )}
      </div>
    </>
  );
}
