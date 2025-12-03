// src/components/pedidos/PedidosPagination.jsx

export default function PedidosPagination({
  page,
  totalPages,
  setPage,
}) {
  const pageSafe = Math.min(page, totalPages);

  return (
    <div className="paginate">
      <button
        className="btn"
        onClick={() => setPage(1)}
        disabled={pageSafe <= 1}
      >
        «
      </button>
      <button
        className="btn"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={pageSafe <= 1}
      >
        ‹
      </button>

      <span>
        Página {pageSafe} de {totalPages}
      </span>

      <button
        className="btn"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={pageSafe >= totalPages}
      >
        ›
      </button>
      <button
        className="btn"
        onClick={() => setPage(totalPages)}
        disabled={pageSafe >= totalPages}
      >
        »
      </button>
    </div>
  );
}
