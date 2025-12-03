import React from "react";

export default function ComprasDetalleSummary({
  compra,
  pagadoLabel,
  fmtMoney,
}) {
  return (
    <div className="card">
      <div>
        <strong>Fecha/Hora:</strong> {compra.com_fecha_hora ?? "-"}
      </div>
      <div>
        <strong>Empleado:</strong>{" "}
        {compra.empleado_nombre ?? compra.id_empleado ?? "-"}
      </div>
      <div>
        <strong>Proveedor:</strong>{" "}
        {compra.proveedor_nombre ?? compra.id_proveedor ?? "-"}
      </div>
      <div>
        <strong>Estado:</strong>{" "}
        {compra.estado_nombre ?? compra.id_estado_compra ?? "-"}
      </div>
      <div>
        <strong>Pagado:</strong> {pagadoLabel}
      </div>
      <div>
        <strong>Descripción:</strong> {compra.com_descripcion ?? "-"}
      </div>
      <div>
        <strong>Monto (cabecera):</strong> {fmtMoney(compra.com_monto)}
      </div>
    </div>
  );
}
