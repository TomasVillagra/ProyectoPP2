export default function PlatosListFilters({
  qNombre,
  setQNombre,
  fCategoria,
  setFCategoria,
  fEstado,
  setFEstado,
  categorias,
}) {
  return (
    <div className="platos-filters">
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={qNombre}
        onChange={(e) => setQNombre(e.target.value)}
      />

      <select
        value={fCategoria}
        onChange={(e) => setFCategoria(e.target.value)}
      >
        <option value="">Todas las categorías</option>
        {categorias.map((c) => {
          const id =
            c.id_categoria_plato ??
            c.id_categoria ??
            c.id ??
            c.categoria_id;
          const nombre =
            c.catplt_nombre ??
            c.categoria_nombre ??
            c.cat_nombre ??
            c.nombre ??
            (id != null ? `#${id}` : "-");
          return (
            <option key={id} value={id}>
              {nombre}
            </option>
          );
        })}
      </select>

      <select
        value={fEstado}
        onChange={(e) => setFEstado(e.target.value)}
      >
        <option value="">Todos los estados</option>
        <option value="1">Activos</option>
        <option value="2">Inactivos</option>
      </select>
    </div>
  );
}

