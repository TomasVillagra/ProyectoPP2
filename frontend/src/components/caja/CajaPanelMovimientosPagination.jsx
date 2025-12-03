import React from "react";

export default function CajaPanelMovimientosPagination({
  page,
  totalPages,
  setPage,
}) {
  return (
    <div className="caja-panel-paginate">
      <button
        className="btn btn-secondary"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        ◀
      </button>
      <div className="btn btn-secondary caja-panel-page-label">
        Página {page} / {totalPages}
      </div>
      <button
        className="btn btn-secondary"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      >
        ▶
      </button>
    </div>
  );
}
