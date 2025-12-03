// src/components/ventas/VentasPagination.jsx
export default function VentasPagination({
  pageSafe,
  totalPages,
  setPage,
}) {
  return (
    <div className="ventas-pagination">
      <button onClick={() => setPage(1)} disabled={pageSafe <= 1}>
        «
      </button>
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={pageSafe <= 1}
      >
        ‹
      </button>

      <span>Página {pageSafe} de {totalPages}</span>

      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={pageSafe >= totalPages}
      >
        ›
      </button>
      <button
        onClick={() => setPage(totalPages)}
        disabled={pageSafe >= totalPages}
      >
        »
      </button>
    </div>
  );
}
