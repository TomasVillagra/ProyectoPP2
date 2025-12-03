// src/components/pedidos/PedidoDetalleHeader.jsx
import { Link } from "react-router-dom";

export default function PedidoDetalleHeader({ id }) {
  return (
    <div className="header-bar">
      <h2>Pedido #{id}</h2>
      <Link className="btn btn-secondary" to="/pedidos">
        Volver a Pedidos
      </Link>
    </div>
  );
}
