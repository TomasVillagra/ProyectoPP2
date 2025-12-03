import React from "react";

export default function CompraRegistrarHeader({ cajaAbierta, msg }) {
  return (
    <>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Registrar Compra</h2>

      {!cajaAbierta && (
        <div
          style={{
            background: "#7f1d1d",
            color: "#fee2e2",
            padding: "8px 12px",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          La caja está <strong>CERRADA</strong>. No se pueden registrar
          compras hasta que abras la caja en{" "}
          <b>Caja &gt; Panel</b>.
        </div>
      )}

      {msg && (
        <pre style={{ whiteSpace: "pre-wrap" }}>{msg}</pre>
      )}
    </>
  );
}
