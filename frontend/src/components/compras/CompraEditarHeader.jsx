import React from "react";

export default function CompraEditarHeader({ id, msg }) {
  return (
    <>
      <h2 style={{ margin: 0, marginBottom: 4 }}>
        Editar Compra #{id}
      </h2>
      <p
        style={{
          marginTop: 0,
          marginBottom: 12,
          fontSize: 13,
          opacity: 0.9,
        }}
      >
        En esta pantalla solo podés editar{" "}
        <strong>
          los insumos (cantidad, agregar/quitar renglones)
        </strong>
        . El <strong>precio unitario no se puede modificar</strong> y
        los datos de cabecera (empleado, proveedor, estado, fecha, pagado)
        tampoco.
      </p>
      {msg && (
        <p style={{ whiteSpace: "pre-wrap" }}>
          {msg}
        </p>
      )}
    </>
  );
}
