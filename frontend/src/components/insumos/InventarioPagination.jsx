import React from "react";

export default function InventarioPagination({
  totalItems,
  startIndex,
  endIndex,
  currentPage,
  totalPages,
  goToPage,
}) {
  if (totalItems === 0) return null;

  return (
    <div className="pagination-wrap">
      <div className="pagination-info">
        Mostrando <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong>–
        <strong>{endIndex}</strong> de <strong>{totalItems}</strong> insumos
      </div>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <span className="pagination-page">
          Página {currentPage} de {totalPages}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
