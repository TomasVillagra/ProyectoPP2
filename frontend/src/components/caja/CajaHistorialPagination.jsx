import React from "react";

export default function CajaHistorialPagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  goToPage,
  loading,
}) {
  return (
    <div className="pagination-wrap">
      <div className="pagination-info">
        Mostrando <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong>–
        <strong>{endIndex}</strong> de <strong>{totalItems}</strong>{" "}
        cierres
      </div>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || loading}
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
          disabled={currentPage === totalPages || loading}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
