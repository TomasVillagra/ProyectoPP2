import React from "react";

export default function CajaHistorialHeader({ loading, onRefresh }) {
  return (
    <div className="caja-hist-header">
      <h2 className="caja-hist-title">Historial de Caja</h2>
      <button
        className="btn btn-secondary"
        type="button"
        onClick={onRefresh}
        disabled={loading}
      >
        {loading ? "Actualizando..." : "Actualizar"}
      </button>
    </div>
  );
}
