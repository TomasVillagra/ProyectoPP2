export default function PlatoRegistrarForm({ form, categorias, onChange, errors }) {
  return (
    <>
      <div className="plato-reg-row">
        <label>Nombre =</label>
        <input
          name="pla_nombre"
          value={form.pla_nombre}
          onChange={onChange}
        />
      </div>
      {errors.pla_nombre && <small className="plato-reg-err">{errors.pla_nombre}</small>}

      <div className="plato-reg-row">
        <label>Precio =</label>
        <input
          name="pla_precio"
          value={form.pla_precio}
          inputMode="decimal"
          onChange={onChange}
        />
      </div>
      {errors.pla_precio && <small className="plato-reg-err">{errors.pla_precio}</small>}

      <div className="plato-reg-row">
        <label>Stock inicial =</label>
        <input name="pla_stock" value={form.pla_stock} readOnly />
      </div>

    <div className="plato-reg-row">
    <label>Categoría =</label>
    <select
        name="id_categoria_plato"
        value={form.id_categoria_plato}
        onChange={onChange}
    >
        <option value="">-- Seleccioná --</option>
        {categorias.map((c) => {
        const id =
            c.id_categoria_plato ??
            c.id_categoria ??
            c.id ??
            c.categoria_id;

        const nombre =
            c.catplt_nombre ??      // 👈 ESTE FALTABA
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
    <small className="plato-reg-err">{errors.id_categoria_plato}</small>
    )}


      <div className="plato-reg-row">
        <label>Estado =</label>
        <select
          name="id_estado_plato"
          value={form.id_estado_plato}
          onChange={onChange}
        >
          <option value="1">Activo</option>
          <option value="2">Inactivo</option>
        </select>
      </div>
    </>
  );
}
