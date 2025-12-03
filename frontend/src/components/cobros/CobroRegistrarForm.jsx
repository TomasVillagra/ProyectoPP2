import React from "react";

export default function CobroRegistrarForm({
  tipoDoc,
  idMostrar,
  metodosPago,
  idMetodoPago,
  setIdMetodoPago,
  observacion,
  setObservacion,
  montoDocumento,
  fmtARS,
  handleCobrar,
  submitting,
  cajaAbierta,
}) {
  return (
    <div className="card-dark">
      <h3 style={{ marginTop: 0 }}>
        {tipoDoc === "compra"
          ? "Registrar pago de compra"
          : "Registrar cobro de venta"}
      </h3>

      <div className="field">
        <label className="label">Método de pago</label>
        <select
          className="input"
          value={idMetodoPago}
          onChange={(e) => setIdMetodoPago(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {metodosPago.map((m) => (
            <option
              key={m.id_metodo_pago || m.id}
              value={m.id_metodo_pago || m.id}
            >
              {m.metpag_nombre || m.metpago_nombre || m.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label">Observación (opcional)</label>
        <textarea
          className="input"
          rows={3}
          placeholder={
            tipoDoc === "compra"
              ? `Pago de compra #${idMostrar}`
              : `Cobro de venta #${idMostrar}`
          }
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="label">
          Importe: <b>{fmtARS(montoDocumento)}</b>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleCobrar}
          disabled={submitting || !cajaAbierta || !idMetodoPago}
          title={
            !cajaAbierta
              ? "Abrí la caja para poder registrar el movimiento."
              : !idMetodoPago
              ? "Elegí un método de pago."
              : undefined
          }
        >
          {submitting
            ? tipoDoc === "compra"
              ? "Pagando..."
              : "Cobrando..."
            : tipoDoc === "compra"
            ? "Registrar pago"
            : "Cobrar"}
        </button>
      </div>
    </div>
  );
}
