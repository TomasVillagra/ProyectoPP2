import React from "react";

export default function MovCajaListPagination({
  page,
  totalPages,
  setPage,
}) {
  return (
    <div className="mov-paginate">
      <button
        className="btn btn-secondary"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page <= 1}
      >
        ◀
      </button>
      <div className="btn btn-secondary mov-page-label">
        Página {page} / {totalPages}
      </div>
      <button
        className="btn btn-secondary"
        onClick={() =>
          setPage((p) => Math.min(totalPages, p + 1))
        }
        disabled={page >= totalPages}
      >
        ▶
      </button>
    </div>
  );
}
