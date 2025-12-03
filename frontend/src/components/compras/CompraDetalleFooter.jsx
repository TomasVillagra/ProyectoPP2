import React from "react";

export default function CompraDetalleFooter({
  addRow,
  cajaAbierta,
  form,
  insumosDisponibles,
  total,
  onCancel,
}) {
  return (
    <>
      <div
        style={{
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={addRow}
          disabled={
            !cajaAbierta ||
            !form.id_proveedor ||
            !insumosDisponibles.length
          }
        >
          Agregar renglón
        </button>
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
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!cajaAbierta}
        >
          Registrar
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
