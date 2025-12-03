import React from "react";

export default function EmpleadosPagination({
  totalRows,
  startIndex,
  endIndex,
  page,
  totalPages,
  gotoPage,
}) {
  return (
    <div className="datatable-footer">
      <span className="datatable-info">
        Mostrando{" "}
        {totalRows === 0 ? "0" : `${startIndex}–${endIndex}`} de {totalRows}{" "}
        empleados
      </span>
      <div className="datatable-pagination">
        <button
          className="page-btn"
          onClick={() => gotoPage(1)}
          disabled={page === 1}
        >
          {"<<"}
        </button>
        <button
          className="page-btn"
          onClick={() => gotoPage(page - 1)}
          disabled={page === 1}
        >
          {"<"}
        </button>
        <span className="page-indicator">
          Página {page} de {totalPages}
        </span>
        <button
          className="page-btn"
          onClick={() => gotoPage(page + 1)}
          disabled={page === totalPages}
        >
          {">"}
        </button>
        <button
          className="page-btn"
          onClick={() => gotoPage(totalPages)}
          disabled={page === totalPages}
        >
          {">>"}
        </button>
      </div>
    </div>
  );
}
