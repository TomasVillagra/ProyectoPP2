// src/components/pedidos/PedidoDetalleInfo.jsx

export default function PedidoDetalleInfo({ pedido, fmtDate }) {
  return (
    <div className="card">
      <div className="grid">
        <div>
          <div className="muted">Mesa</div>
          <div>{pedido.mesa_numero ?? pedido.mesa ?? "Sin mesa"}</div>
        </div>

        <div>
          <div className="muted">Empleado</div>
          <div>{pedido.empleado_nombre ?? pedido.empleado ?? "—"}</div>
        </div>

        <div>
          <div className="muted">Cliente</div>
          <div>{pedido.cliente_nombre ?? pedido.cliente ?? "—"}</div>
        </div>

        <div>
          <div className="muted">Estado</div>
          <div>{pedido.estado_nombre ?? pedido.estado ?? "—"}</div>
        </div>

        <div>
          <div className="muted">Tipo</div>
          <div>{pedido.tipo_nombre ?? pedido.tipo ?? "—"}</div>
        </div>

        <div>
          <div className="muted">Inicio</div>
          <div>{fmtDate(pedido.ped_fecha_hora_ini)}</div>
        </div>

        <div>
          <div className="muted">Fin</div>
          <div>
            {pedido.ped_fecha_hora_fin
              ? fmtDate(pedido.ped_fecha_hora_fin)
              : "En curso"}
          </div>
        </div>

        <div>
          <div className="muted">Descripción</div>
          <div>{pedido.ped_descripcion ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}
