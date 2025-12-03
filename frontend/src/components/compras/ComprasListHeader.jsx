import React from "react";
import { Link } from "react-router-dom";

export default function ComprasListHeader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <h2 style={{ margin: 0 }}>Compras</h2>
      <Link to="/compras/registrar" className="btn btn-primary">
        Registrar Compra
      </Link>
    </div>
  );
}
