export default function PlatosListPagination({
  totalItems,
  startIndex,
  endIndex,
  currentPage,
  totalPages,
  goToPage,
}) {
  return (
    <div className="platos-pagination-wrap">
      <div className="platos-pagination-info">
        Mostrando{" "}
          <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong>–
          <strong>{endIndex}</strong> de{" "}
          <strong>{totalItems}</strong> platos
      </div>
      <div className="platos-pagination-controls">
        <button
          type="button"
          className="platos-btn-secondary platos-btn-sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <span className="platos-pagination-page">
          Página {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          className="platos-btn-secondary platos-btn-sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

