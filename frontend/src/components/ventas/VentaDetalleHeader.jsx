// src/components/ventas/VentaDetalleHeader.jsx
import { Link } from "react-router-dom";

export default function VentaDetalleHeader({ id }) {
  return (
    <div className="header-bar">
      <h2>Venta #{id}</h2>

      <Link className="btn btn-secondary" to="/ventas">
        Volver a Ventas
      </Link>
    </div>
  );
}
