export default function PlatoEditarForm({ form, categorias, onChange, errors }) {
  const update = (name, value) => {
    onChange((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div className="plato-edit-row">
        <label>Nombre =</label>
        <input
          name="pla_nombre"
          value={form.pla_nombre}
          onChange={(e) => update("pla_nombre", e.target.value)}
        />
      </div>
      {errors.pla_nombre && <small className="plato-edit-err">{errors.pla_nombre}</small>}

      <div className="plato-edit-row">
        <label>Precio =</label>
        <input
          name="pla_precio"
          value={form.pla_precio}
          onChange={(e) => update("pla_precio", e.target.value)}
        />
      </div>
      {errors.pla_precio && <small className="plato-edit-err">{errors.pla_precio}</small>}

      <div className="plato-edit-row">
        <label>Stock =</label>
        <input name="pla_stock" value={form.pla_stock} readOnly />
      </div>

    <div className="plato-edit-row">
    <label>Categoría =</label>
    <select
        name="id_categoria_plato"
        value={form.id_categoria_plato}
        onChange={(e) => update("id_categoria_plato", e.target.value)}
    >
        <option value="">-- Seleccioná --</option>
        {categorias.map((c) => {
        const id =
            c.id_categoria_plato ??
            c.id_categoria ??
            c.id ??
            c.categoria_id;

        const nombre =
            c.catplt_nombre ??       // ✅ ESTE ES EL QUE FALTABA
            c.categoria_nombre ??
            c.cat_nombre ??
            c.nombre ??
            `#${id}`;

        return (
            <option key={id} value={id}>
            {nombre}
            </option>
        );
        })}
    </select>
    </div>

    {errors.id_categoria_plato && (
    <small className="plato-edit-err">{errors.id_categoria_plato}</small>
    )}


      <div className="plato-edit-row">
        <label>Estado =</label>
        <select
          name="id_estado_plato"
          value={form.id_estado_plato}
          onChange={(e) => update("id_estado_plato", e.target.value)}
        >
          <option value="1">Activo</option>
          <option value="2">Inactivo</option>
        </select>
      </div>
    </>
  );
}
