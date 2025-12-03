import React from "react";

export default function CajaPanelEstadoCard({ abierta }) {
  return (
    <div className="card-dark">
      <div className="card-row">
        <div>
          <div className="label">Estado</div>
          <div className={`badge ${abierta ? "ok" : "err"}`}>
            {abierta ? "Abierta" : "Cerrada"}
          </div>
        </div>
      </div>
    </div>
  );
}
