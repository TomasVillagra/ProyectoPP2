import React from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaLock, FaLockOpen } from "react-icons/fa";

export default function InventarioTable({
  pageRows,
  formatNumber,
  estadoChip,
  onToggleEstado,
}) {
  return (
    <div className="table-wrap">
      <table className="table-dark">
        <thead>
          <tr>
            {/* ❌ Eliminado: <th>ID</th> */}
            <th>Nombre</th>
            <th>Unidad</th>
            {/* ❌ Eliminado: <th>Cantidad</th> */}
            {/* ❌ Eliminado: <th>Capacidad</th> */}
            <th>Stock actual</th>
            <th>Pto. reposición</th>
            <th>Stock min</th>
            <th>Stock max</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {pageRows.map((r) => (
            <tr key={r.id_insumo}>
              {/* ❌ Eliminado: <td>{r.id_insumo}</td> */}

              <td>{r.ins_nombre}</td>
              <td>{r.ins_unidad}</td>

              {/* ❌ Eliminado cantidad (insumos_equivalentes) */}
              {/* <td>{r.insumos_equivalentes ?? "-"}</td> */}

              {/* ❌ Eliminado capacidad */}
              {/* <td>{formatNumber(r.ins_capacidad)} {r.ins_unidad}</td> */}

              <td>{formatNumber(r.ins_stock_actual)}</td>
              <td>{formatNumber(r.ins_punto_reposicion)}</td>
              <td>{formatNumber(r.ins_stock_min)}</td>
              <td>{formatNumber(r.ins_stock_max)}</td>

              <td>{estadoChip(r.id_estado_insumo, r.estado_nombre)}</td>

              <td className="actions-cell">
                <Link
                  to={`/inventario/editar/${r.id_insumo}`}
                  className="btn btn-secondary btn-sm"
                >
                  <FaEdit /> Editar
                </Link>

                <button
                  className={`btn btn-sm ${
                    r.id_estado_insumo === 1 ? "btn-danger" : "btn-success"
                  }`}
                  onClick={() => onToggleEstado(r)}
                >
                  {r.id_estado_insumo === 1 ? (
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

          {pageRows.length === 0 && (
            <tr>
              {/* Ajustado colSpan por columnas eliminadas */}
              <td colSpan="8" className="empty-row">
                No hay insumos que coincidan con la búsqueda / filtro.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

