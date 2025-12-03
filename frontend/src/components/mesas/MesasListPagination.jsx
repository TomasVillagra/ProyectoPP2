export default function MesasListPagination({
  page,
  totalPages,
  gotoPage,
}) {
  return (
    <div className="mesas-pagination">
      <button
        onClick={() => gotoPage(1)}
        disabled={page === 1}
      >
        {"<<"}
      </button>

      <button
        onClick={() => gotoPage(page - 1)}
        disabled={page === 1}
      >
        {"<"}
      </button>

      <span>
        Página {page} de {totalPages}
      </span>

      <button
        onClick={() => gotoPage(page + 1)}
        disabled={page === totalPages}
      >
        {">"}
      </button>

      <button
        onClick={() => gotoPage(totalPages)}
        disabled={page === totalPages}
      >
        {">>"}
      </button>
    </div>
  );
}
