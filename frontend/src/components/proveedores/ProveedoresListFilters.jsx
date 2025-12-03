export default function ProveedoresListFilters({
  categorias,
  categoriaFiltro,
  setCategoriaFiltro,
}) {
  return (
    <div className="prov-list-filters-bar">
      <label htmlFor="prov-list-filtroCategoria">
        Categoría:
      </label>
      <select
        id="prov-list-filtroCategoria"
        value={categoriaFiltro}
        onChange={(e) => setCategoriaFiltro(e.target.value)}
      >
        <option value="">Todas</option>
        {categorias.map((c) => (
          <option
            key={c.id_categoria_prov}
            value={c.id_categoria_prov}
          >
            {c.catprov_nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
