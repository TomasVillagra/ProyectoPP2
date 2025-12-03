// src/components/pedidos/PedidoAgregarItemModal.jsx

export default function PedidoAgregarItemModal({
  addOpen,
  addTarget,
  newItem,
  setNewItem,
  descontarAhora,
  setDescontarAhora,
  addMsg,
  onConfirm,
  onClose,
  platos,
  platosConReceta,
  getPlatoId,
}) {
  if (!addOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3 style={{ marginTop: 0 }}>
          Agregar ítem al pedido #{addTarget?.id_pedido ?? addTarget?.id}
        </h3>

        <div className="row">
          <label>Plato</label>
          <select
            value={newItem.id_plato}
            onChange={(e) =>
              setNewItem((p) => ({ ...p, id_plato: e.target.value }))
            }
          >
            <option value="">— Seleccioná plato (con receta) —</option>
            {platos
              .filter((p) => platosConReceta.has(getPlatoId(p)))
              .map((p) => (
                <option key={getPlatoId(p)} value={getPlatoId(p)}>
                  {p.plt_nombre ?? p.nombre ?? `#${getPlatoId(p)}`}
                </option>
              ))}
          </select>
        </div>

        <div className="row">
          <label>Cantidad</label>
          <input
            type="number"
            min="1"
            value={newItem.cantidad}
            onChange={(e) =>
              setNewItem((p) => ({ ...p, cantidad: e.target.value }))
            }
            placeholder="0"
          />
        </div>

        <div className="row">
          <label>Acción inmediata</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              id="chkDescontarAhora"
              type="checkbox"
              checked={descontarAhora}
              onChange={(e) => setDescontarAhora(e.target.checked)}
            />
            <label htmlFor="chkDescontarAhora" style={{ cursor: "pointer" }}>
              Descontar stock ahora <small>(solo este ítem)</small>
            </label>
          </div>
        </div>

        {addMsg && (
          <pre style={{ whiteSpace: "pre-wrap", color: "#fca5a5" }}>{addMsg}</pre>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn-primary" onClick={onConfirm}>
            Agregar
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
