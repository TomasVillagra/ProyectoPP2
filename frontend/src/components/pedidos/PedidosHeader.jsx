// src/components/pedidos/PedidosHeader.jsx
import { Link } from "react-router-dom";

export default function PedidosHeader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <h2 style={{ margin: 0, color: "#fff" }}>Pedidos</h2>
      <Link to="/pedidos/registrar" className="btn btn-primary">
        Registrar pedido
      </Link>
    </div>
  );
}
