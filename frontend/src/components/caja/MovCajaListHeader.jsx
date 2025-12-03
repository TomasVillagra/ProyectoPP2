import React from "react";

export default function MovCajaListHeader({ q, onChangeQuery }) {
  return (
    <div className="mov-header">
      <h2 className="mov-title">Movimientos de Caja</h2>
      <input
        placeholder="Buscar..."
        value={q}
        onChange={(e) => onChangeQuery(e.target.value)}
        className="mov-search-input"
      />
    </div>
  );
}
