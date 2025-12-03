import React from "react";

export default function ComprasDetalleHeader({ id, onBack }) {
  return (
    <div className="detalle-header">
      <h2 className="detalle-title">Detalle de Compra #{id}</h2>
      <button className="btn btn-secondary" onClick={onBack}>
        Volver
      </button>
    </div>
  );
}
