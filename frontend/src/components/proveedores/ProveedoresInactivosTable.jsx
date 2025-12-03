import { Link } from "react-router-dom";
import { FaEdit, FaLockOpen } from "react-icons/fa";

export default function ProveedoresInactivosTable({ filteredRows, handleActivate }) {
  return (
    <div className="prov-inactivos-table-wrap">
      <table className="prov-inactivos-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {filteredRows.map((r) => (
            <tr key={r.id_proveedor}>
              <td>{r.id_proveedor}</td>
              <td>{r.prov_nombre}</td>
              <td>{r.prov_tel || "-"}</td>
              <td>{r.prov_correo || "-"}</td>
              <td>{r.prov_direccion || "-"}</td>
              <td>
                <span className="prov-inactivos-status">Inactivo</span>
              </td>
              <td className="prov-inactivos-actions">
                <Link
                  to={`/proveedores/editar/${r.id_proveedor}`}
                  className="prov-inactivos-btn-secondary"
                >
                  <FaEdit /> Editar
                </Link>

                <button
                  className="prov-inactivos-btn-success"
                  onClick={() => handleActivate(r)}
                >
                  <FaLockOpen /> Activar
                </button>
              </td>
            </tr>
          ))}

          {filteredRows.length === 0 && (
            <tr>
              <td colSpan="7" className="prov-inactivos-empty">
                No hay proveedores inactivos o no coinciden con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
