export default function ProveedoresListPagination({
  filteredCount,
  startIndex,
  endIndex,
  page,
  totalPages,
  gotoPage,
}) {
  return (
    <div className="prov-list-datatable-footer">
      <span className="prov-list-datatable-info">
        Mostrando{" "}
        {filteredCount === 0 ? 0 : startIndex + 1}–{endIndex} de{" "}
        {filteredCount} proveedores
      </span>
      <div className="prov-list-datatable-pagination">
        <button
          type="button"
          className="prov-list-page-btn"
          onClick={() => gotoPage(1)}
          disabled={page === 1}
        >
          {"<<"}
        </button>
        <button
          type="button"
          className="prov-list-page-btn"
          onClick={() => gotoPage(page - 1)}
          disabled={page === 1}
        >
          {"<"}
        </button>
        <span className="prov-list-page-indicator">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          className="prov-list-page-btn"
          onClick={() => gotoPage(page + 1)}
          disabled={page === totalPages}
        >
          {">"}
        </button>
        <button
          type="button"
          className="prov-list-page-btn"
          onClick={() => gotoPage(totalPages)}
          disabled={page === totalPages}
        >
          {">>"}
        </button>
      </div>
    </div>
  );
}
