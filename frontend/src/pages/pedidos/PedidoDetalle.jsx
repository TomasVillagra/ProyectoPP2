// src/pages/pedidos/PedidoDetalle.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../api/axios";

import PedidoDetalleHeader from "../../components/pedidos/PedidoDetalleHeader";
import PedidoDetalleInfo from "../../components/pedidos/PedidoDetalleInfo";
import PedidoDetalleTabla from "../../components/pedidos/PedidoDetalleTabla";

import "./PedidoDetalle.css";

function fmtDate(dt) {
  if (!dt) return "-";
  return new Date(dt).toLocaleString();
}

export default function PedidoDetalle() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/pedidos/${id}/`);
        setPedido(res.data);
      } catch {
        setMsg("No se pudo cargar el pedido.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (msg) return <p style={{ color: "#facc15" }}>{msg}</p>;
  if (!pedido) return <p>No se encontró el pedido.</p>;

  const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : [];

  return (
    <DashboardLayout>
      <PedidoDetalleHeader id={pedido.id_pedido ?? pedido.id} />
      <PedidoDetalleInfo pedido={pedido} fmtDate={fmtDate} />
      <PedidoDetalleTabla detalles={detalles} />
    </DashboardLayout>
  );
}



