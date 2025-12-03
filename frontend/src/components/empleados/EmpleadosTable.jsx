import React from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaLock, FaLockOpen } from "react-icons/fa";

export default function EmpleadosTable({
  paginatedRows,
  estadoChip,
  cargoPill,
  onToggleEstado,
}) {
  return (
    <table className="table">
      <thead>
        <tr>
          {/* ❌ Se sacó la columna ID */}
          <th>Nombre</th>
          <th>Apellido</th>
          <th>Cargo</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {paginatedRows.map((e) => (
          <tr key={e.id_empleado}>
            {/* ❌ Ya no mostramos el id_empleado */}
            <td>{e.emp_nombre}</td>
            <td>{e.emp_apellido}</td>
            <td>{cargoPill(e.cargo_nombre)}</td>
            <td>{estadoChip(e.id_estado_empleado, e.estado_nombre)}</td>
            <td className="actions-cell">
              <Link
                to={`/empleados/editar/${e.id_empleado}`}
                className="btn btn-secondary"
              >
                <FaEdit /> Editar
              </Link>
              <button
                className={`btn ${
                  e.id_estado_empleado === 1 ? "btn-danger" : "btn-success"
                }`}
                onClick={() => onToggleEstado(e)}
              >
                {e.id_estado_empleado === 1 ? (
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
        {paginatedRows.length === 0 && (
          <tr>
            {/* antes era colSpan={6} → ahora 5 columnas */}
            <td colSpan={5} className="empty-row">
              No hay empleados cargados todavía.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
