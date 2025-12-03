import { Link } from "react-router-dom";

export default function PlatosListTable({
  rows,
  catMap,
  recetaPorPlato,
  toggleEstado,
  abrirCargarStock,
}) {
  return (
    <div className="platos-table-wrap">
      <table className="platos-table">
        <thead>
          <tr>
            {/* SIN ID */}
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th style={{ width: 420 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="platos-empty">
                Sin registros
              </td>
            </tr>
          )}

          {rows.map((r, idx) => {
            const idPlato = r.id_plato ?? r.id ?? idx;
            const id = idPlato;

            const nombre =
              r.pla_nombre ??
              r.plt_nombre ??
              r.nombre ??
              "(sin nombre)";

            const precio =
              r.pla_precio ?? r.plt_precio ?? r.precio ?? 0;

            const stock =
              r.plt_stock ??
              r.pla_stock ??
              r.stock ??
              r.stock_actual ??
              "-";

            let categoriaNombre =
              r.categoria_nombre ?? r.cat_nombre ?? null;

            if (
              !categoriaNombre &&
              r.categoria &&
              typeof r.categoria === "object"
            ) {
              categoriaNombre =
                r.categoria.nombre ??
                r.categoria.cat_nombre ??
                r.categoria.categoria_nombre ??
                null;
            }

            const categoriaId =
              r.id_categoria_plato ??
              r.id_categoria ??
              r.categoria_id ??
              (r.categoria && typeof r.categoria === "object"
                ? r.categoria.id ?? r.categoria.id_categoria
                : null);

            const categoria =
              categoriaNombre ??
              (categoriaId != null
                ? catMap[categoriaId] || `#${categoriaId}`
                : "-");

            const idEstado = String(
              r.id_estado_plato ??
                r.id_estado ??
                r.estado ??
                "1"
            );

            const estadoNombre =
              r.estado_nombre ||
              (idEstado === "1" ? "Activo" : "Inactivo");

            const recetaId = recetaPorPlato[Number(idPlato)];

            return (
              <tr key={id}>
                {/* SIN columna ID */}
                <td>{nombre}</td>
                <td>{Number(precio).toFixed(2)}</td>
                <td>{stock}</td>
                <td>{categoria}</td>
                <td>{estadoNombre}</td>
                <td className="platos-actions">
                  <Link
                    to={`/platos/${id}/editar`}
                    className="platos-btn-secondary"
                  >
                    Editar
                  </Link>

                  <button
                    type="button"
                    onClick={() => toggleEstado(r)}
                    className="platos-btn-danger"
                  >
                    {idEstado === "1" ? "Desactivar" : "Activar"}
                  </button>

                  <button
                    type="button"
                    className="platos-btn-primary"
                    onClick={() => abrirCargarStock(r)}
                  >
                    Cargar stock
                  </button>

                  <Link
                    to={`/platos/${id}/receta`}
                    className="platos-btn-secondary"
                  >
                    Ver receta
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

