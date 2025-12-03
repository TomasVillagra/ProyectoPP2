// src/components/pedidos/PedidoDetalleRow.jsx

const PedidoDetalleRow = ({
  row,
  idx,
  error,
  opciones,
  onRowChange,
  onRemove,
  blockInvalidInt,

  // Props extra para EDITAR (todos opcionales)
  disableSelect = false,
  disableCantidad = false,
  disableRemove = false,
  showPlusButton = false,
  onPlusOne,
}) => {
  const e = error || {};

  return (
    <tr>
      <td>
        <select
          value={row.id_plato}
          onChange={(ev) => onRowChange(idx, "id_plato", ev.target.value)}
          disabled={disableSelect}
        >
          <option value="">— Seleccioná plato (con receta) —</option>
          {opciones.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {e.id_plato && <small className="err-inline">{e.id_plato}</small>}
      </td>
      <td>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="text"
            inputMode="numeric"
            value={row.detped_cantidad}
            onChange={(ev) =>
              onRowChange(idx, "detped_cantidad", ev.target.value)
            }
            onKeyDown={blockInvalidInt}
            placeholder="0"
            disabled={disableCantidad}
          />
          {showPlusButton && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onPlusOne}
            >
              +1
            </button>
          )}
        </div>
        {e.detped_cantidad && (
          <small className="err-inline">{e.detped_cantidad}</small>
        )}
      </td>
      <td style={{ textAlign: "right" }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onRemove(idx)}
          disabled={disableRemove}
        >
          Quitar
        </button>
      </td>
    </tr>
  );
};

export default PedidoDetalleRow;

