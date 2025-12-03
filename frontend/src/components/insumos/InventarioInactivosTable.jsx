import React from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaLockOpen, FaSearch, FaArrowLeft } from "react-icons/fa";

export default function InventarioInactivosTable({
  rows,
  search,
  onSearchChange,
  formatNumber,
  onActivate,
}) {
  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };

  return (
    <>
      <div className="page-header">
        <h2>Insumos Inactivos</h2>
        {/* Volver a Inventario (activos) */}
        <Link to="/inventario" className="btn btn-secondary">
          <FaArrowLeft /> Volver a activos
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar insumo inactivo..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Cantidad</th> {/* NUEVO */}
              <th>Capacidad</th> {/* NUEVO */}
              <th>Stock actual</th>
              <th>Pto. reposición</th>
              <th>Stock min</th>
              <th>Stock max</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id_insumo}>
                <td>{r.id_insumo}</td>
                <td>{r.ins_nombre}</td>
                <td>{r.ins_unidad}</td>
                <td>{formatNumber(r.ins_cantidad)}</td>
                <td>
                  {formatNumber(r.ins_capacidad)} {r.ins_unidad}
                </td>
                <td>{formatNumber(r.ins_stock_actual)}</td>
                <td>{formatNumber(r.ins_punto_reposicion)}</td>
                <td>{formatNumber(r.ins_stock_min)}</td>
                <td>{formatNumber(r.ins_stock_max)}</td>
                <td>
                  <span className="status-chip inactive">Inactivo</span>
                </td>
                <td className="actions-cell">
                  <Link
                    to={`/inventario/editar/${r.id_insumo}`}
                    className="btn btn-secondary"
                  >
                    <FaEdit /> Editar
                  </Link>
                  <button
                    className="btn btn-success"
                    onClick={() => onActivate(r)}
                  >
                    <FaLockOpen /> Activar
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="11" className="empty-row">
                  No hay insumos inactivos o no coinciden con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
