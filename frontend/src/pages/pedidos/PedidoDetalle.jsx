import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function PedidoDetalle() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const response = await api.get(`/api/pedidos/${id}/`);
        setPedido(response.data);
      } catch (error) {
        console.error("Error cargando pedido:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id]);

  if (loading) return <div className="text-white text-center mt-10">Cargando...</div>;
  if (!pedido) return <div className="text-red-500 text-center mt-10">No se encontró el pedido.</div>;

  return (
    <DashboardLayout>
      <div className="p-6 text-white bg-[#1f1f1f] min-h-screen">
        <h1 className="text-3xl font-semibold mb-6 text-center">Detalle del Pedido #{pedido.id_pedido}</h1>

        <div className="bg-[#2a2a2a] p-5 rounded-xl shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Información General</h2>
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <p><strong>Mesa:</strong> {pedido.mesa_numero ?? "Sin mesa"}</p>
            <p><strong>Empleado:</strong> {pedido.empleado_nombre ?? "—"}</p>
            <p><strong>Cliente:</strong> {pedido.cliente_nombre ?? "—"}</p>
            <p><strong>Estado:</strong> {pedido.estado_nombre ?? "—"}</p>
            <p><strong>Tipo:</strong> {pedido.tipo_nombre ?? "—"}</p>
            <p><strong>Inicio:</strong> {new Date(pedido.ped_fecha_hora_ini).toLocaleString()}</p>
            <p><strong>Fin:</strong> {pedido.ped_fecha_hora_fin ? new Date(pedido.ped_fecha_hora_fin).toLocaleString() : "En curso"}</p>
            <p><strong>Descripción:</strong> {pedido.ped_descripcion ?? "—"}</p>
          </div>
        </div>

        <div className="bg-[#2a2a2a] p-5 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Detalle de Platos</h2>
          <table className="w-full border border-gray-700 text-gray-300 rounded-xl">
            <thead className="bg-[#3a3a3a] text-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Plato</th>
                <th className="px-4 py-2 text-center">Cantidad</th>
                <th className="px-4 py-2 text-center">Precio Unitario</th>
                <th className="px-4 py-2 text-center">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalles && pedido.detalles.length > 0 ? (
                pedido.detalles.map((d) => (
                  <tr key={d.id_detalle_pedido} className="hover:bg-[#383838]">
                    <td className="px-4 py-2">{d.plato_nombre}</td>
                    <td className="px-4 py-2 text-center">{d.detped_cantidad}</td>
                    <td className="px-4 py-2 text-center">${d.plato_precio?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center text-green-400">${d.subtotal?.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400">
                    No hay platos registrados para este pedido.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end mt-6">
            <p className="text-xl font-semibold">
              Total: <span className="text-green-400">${pedido.total?.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Link
            to="/pedidos"
            className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-2 rounded-lg text-white font-semibold"
          >
            Volver a Pedidos
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
