import React from "react";

export default function CajaPanelAbrirCard({
  montoInicial,
  setMontoInicial,
  abrirCaja,
}) {
  return (
    <div className="card-dark caja-panel-card-abrir">
      <div className="label caja-panel-card-title">Abrir caja</div>
      <div className="caja-panel-abrir-row">
        <input
          className="input"
          placeholder="Monto inicial"
          value={montoInicial}
          onChange={(e) => setMontoInicial(e.target.value)}
          type="number"
          min="0"
          step="0.01"
        />
        <button className="btn btn-primary" onClick={abrirCaja}>
          Abrir caja
        </button>
      </div>
    </div>
  );
}
