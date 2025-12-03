import React from "react";

export default function CompraEditarFooter({
  total,
  onCancel,
  addRow,
  form,
  insumosDisponibles,
}) {
  const puedeAgregar =
    form.id_proveedor &&
    Array.isArray(insumosDisponibles) &&
    insumosDisponibles.length > 0;

  return (
    <>
      <div style={{ marginTop: 8, marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={addRow}
          disabled={!puedeAgregar}
        >
          Agregar renglón de insumo
        </button>
        {!puedeAgregar && (
          <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
            Seleccioná un proveedor con insumos vinculados para agregar más
            renglones.
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <strong>Total = ${total.toFixed(2)}</strong>
      </div>

      <div>
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          style={{ marginLeft: 10 }}
        >
          Cancelar
        </button>
      </div>
    </>
  );
}

