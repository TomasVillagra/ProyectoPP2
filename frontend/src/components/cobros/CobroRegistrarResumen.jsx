import React from "react";

export default function CobroRegistrarResumen({
  tituloDoc,
  idMostrar,
  estadoNombre,
  montoDocumento,
  metodoPagoActual,
  cajaAbierta,
  tipoDoc,
  esEfectivoSeleccionado,
  efectivoDisponible,
  fmtARS,
}) {
  return (
    <div className="card-dark">
      <h3 style={{ marginTop: 0 }}>
        Resumen de la {tituloDoc} #{idMostrar}
      </h3>
      <div className="row">
        <div>
          <span className="label">Estado:</span>{" "}
          <b>{estadoNombre || "-"}</b>
        </div>
        <div>
          <span className="label">Total:</span>{" "}
          <b>{fmtARS(montoDocumento)}</b>
        </div>
        <div>
          <span className="label">Método actual:</span>{" "}
          <b>{metodoPagoActual || "— (sin asignar)"} </b>
        </div>
        <div>
          <span className="label">Caja:</span>{" "}
          <span className={`badge ${cajaAbierta ? "ok" : "err"}`}>
            {cajaAbierta ? "Abierta" : "Cerrada"}
          </span>
        </div>
        {tipoDoc === "compra" &&
          esEfectivoSeleccionado &&
          efectivoDisponible != null && (
            <div>
              <span className="label">Efectivo disponible:</span>{" "}
              <b>{fmtARS(efectivoDisponible)}</b>
            </div>
          )}
      </div>
      {!cajaAbierta && (
        <div className="alert-info" style={{ marginTop: 10 }}>
          Para registrar el movimiento necesitás abrir la caja en{" "}
          <b>Caja &gt; Panel</b>.
        </div>
      )}
    </div>
  );
}
