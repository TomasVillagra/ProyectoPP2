// src/components/pedidos/PedidoCancelarModal.jsx

export default function PedidoCancelarModal({
  cancelOpen,
  cancelTarget,
  isEntregado,
  onCancelarSinStock,
  onCancelarConStock,
  onClose,
}) {
  if (!cancelOpen) return null;

  const entregado = cancelTarget && isEntregado(cancelTarget);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3 style={{ marginTop: 0 }}>
          Cancelar pedido #{cancelTarget?.id_pedido ?? cancelTarget?.id}
        </h3>

        {entregado ? (
          <>
            <p>
              Este pedido está <b>ENTREGADO</b>. Sólo se puede cancelar
              sin modificar el stock.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btn-secondary"
                onClick={onCancelarSinStock}
              >
                Cancelar (no modifica stock)
              </button>
              <button className="btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Elegí cómo cancelar el pedido:</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btn-secondary"
                onClick={onCancelarSinStock}
              >
                Cancelar <b>sin</b> restar stock
              </button>
              <button
                className="btn btn-danger"
                onClick={onCancelarConStock}
              >
                Cancelar <b>restando</b> stock
              </button>
              <button className="btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
