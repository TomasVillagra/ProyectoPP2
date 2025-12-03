import React from "react";
import { Link } from "react-router-dom";

export default function CajaHistDetalleHeader({ id }) {
  return (
    <div className="caja-hist-header">
      <h2 className="caja-hist-title">Detalle de Caja #{id}</h2>
      <Link className="btn btn-secondary" to="/caja/historial">
        Volver al historial
      </Link>
    </div>
  );
}
