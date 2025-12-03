import { Link } from "react-router-dom";
import {
  FaEdit,
  FaLock,
  FaLockOpen,
  FaBoxes,
} from "react-icons/fa";

export default function ProveedoresListTable({
  rows,
  estadoChip,
  handleToggleEstado,
}) {
  return (
    <table className="prov-list-table">
      <thead>
        <tr>
          {/* SIN columna ID */}
          <th>Nombre</th>
          <th>Teléfono</th>
          <th>Correo</th>
          <th>Dirección</th>
          <th>Categoría</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id_proveedor}>
            {/* SIN ID */}
            <td>{r.prov_nombre}</td>
            <td>{r.prov_tel || "-"}</td>
            <td>{r.prov_correo || "-"}</td>
            <td>{r.prov_direccion || "-"}</td>
            <td>
              {r.categoria_nombre ||
                r.catprov_nombre ||
                "-"}
            </td>
            <td>
              {estadoChip(
                r.id_estado_prov,
                r.estado_nombre
              )}
            </td>
            <td className="prov-list-actions-cell">
              <Link
                to={`/proveedores/${r.id_proveedor}/insumos`}
                className="prov-list-btn prov-list-btn-secondary"
                title="Ver/Vincular insumos"
              >
                <FaBoxes /> Insumos
              </Link>
              <Link
                to={`/proveedores/editar/${r.id_proveedor}`}
                className="prov-list-btn prov-list-btn-secondary"
              >
                <FaEdit /> Editar
              </Link>
              <button
                type="button"
                className={`prov-list-btn ${
                  r.id_estado_prov === 1
                    ? "prov-list-btn-danger"
                    : "prov-list-btn-success"
                }`}
                onClick={() => handleToggleEstado(r)}
              >
                {r.id_estado_prov === 1 ? (
                  <>
                    <FaLock /> Desactivar
                  </>
                ) : (
                  <>
                    <FaLockOpen /> Activar
                  </>
                )}
              </button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td
              colSpan="7"
              className="prov-list-empty-row"
            >
              No hay proveedores que coincidan con la
              búsqueda.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
