import React from "react";
import { Link } from "react-router-dom";

export default function ComprasListTable({
  rows,
  fmtMoney,
  lower,
  TERMINAL,
  onRecibir,
  onCancelar,
  fmtDateTime,   // 🔹 agregado
}) {
  return (
    <div className="table-wrap">
      <table className="table-dark">
        <thead>
          <tr>
            <th>Fecha/Hora</th>
            <th>Empleado</th>
            <th>Proveedor</th>
            <th>Estado</th>
            <th>Pagado</th>
            <th>Monto</th>
            <th>Descripción</th>
            <th style={{ width: 260 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const id = c.id_compra ?? c.id;
            const estado = c.estado_nombre ?? "";
            const estadoKey = lower(estado);
            const pagado = (c.com_pagado ?? 2) === 1;
            const isTerminal = TERMINAL.has(estadoKey) || pagado;
            const puedeCobrar = !pagado && estadoKey === "recibida";

            return (
              <tr key={id}>
                {/* 🔹 AHORA formateada */}
                <td>{fmtDateTime(c.com_fecha_hora)}</td>
                <td>{c.empleado_nombre ?? "-"}</td>
                <td>{c.proveedor_nombre ?? "-"}</td>
                <td>{estado || "-"}</td>
                <td>{pagado ? "Sí" : "No"}</td>
                <td>{fmtMoney(c.com_monto)}</td>
                <td>{c.com_descripcion ?? "-"}</td>
                <td
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    to={`/compras/detalles/${id}`}
                    className="btn btn-secondary"
                    title="Ver detalle de renglones"
                  >
                    Ver detalles
                  </Link>

                  <Link
                    to={`/compras/editar/${id}`}
                    className="btn btn-secondary"
                    style={{
                      opacity: isTerminal ? 0.5 : 1,
                      pointerEvents: isTerminal ? "none" : "auto",
                    }}
                    title={
                      isTerminal
                        ? "No editable en estado terminal o pagada"
                        : "Editar"
                    }
                  >
                    Editar
                  </Link>

                  {puedeCobrar && (
                    <Link
                      to={`/cobros/registrar/${id}`}
                      className="btn btn-pay"
                      title="Registrar pago de la compra"
                    >
                      Pagar
                    </Link>
                  )}

                  <button
                    className="btn btn-receive"
                    onClick={() => onRecibir(c)}
                    disabled={isTerminal}
                    title="Marcar como Recibida (suma stock)"
                  >
                    Recibir
                  </button>

                  <button
                    className="btn btn-cancel"
                    onClick={() => onCancelar(c)}
                    disabled={isTerminal}
                    title="Cancelar compra"
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", opacity: 0.7 }}>
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

