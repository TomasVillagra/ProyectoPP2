import React from "react";
import { Link } from "react-router-dom";

export default function CobroRegistrarEmpty({ id_venta }) {
  return (
    <div className="card-dark">
      <h3 style={{ marginTop: 0 }}>Cobrar / Pagar</h3>
      <div className="alert-warn">
        No se encontró la venta/compra #{id_venta}.
      </div>
      <Link to="/ventas" className="btn btn-secondary">
        Volver a Ventas
      </Link>
    </div>
  );
}
