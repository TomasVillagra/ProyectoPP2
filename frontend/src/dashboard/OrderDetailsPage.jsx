import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './OrderDetailsPage.css'; // Importamos el CSS que crearemos
import { FaArrowLeft, FaBell, FaUserCircle, FaPrint } from 'react-icons/fa';

const StatusBadge = ({ status }) => {
  const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;
  return <span className={`status-badge ${statusClass}`}>{status}</span>;
};

const OrderDetailsPage = ({ orders }) => {
  const { orderId } = useParams();

  // ======================================================================
  // ¡CORRECCIÓN CLAVE! Convertimos el 'orderId' de la URL (texto) a un número.
  const order = orders.find(o => o.numero === parseInt(orderId, 10));
  // ======================================================================

  const productosEjemplo = [
    { nombre: 'Pizza Muzarella (Grande)', cantidad: 2, precio: 4000, subtotal: 8000 },
    { nombre: 'Pizza Napolitana (Chica)', cantidad: 1, precio: 2500, subtotal: 2500 },
    { nombre: 'Gaseosa 1.5L', cantidad: 1, precio: 1800, subtotal: 1800 },
  ];
  const total = productosEjemplo.reduce((sum, p) => sum + p.subtotal, 0);

  if (!order) {
    return (
      // Le damos una clase al contenedor para poder estilizarlo
      <div className="not-found-container">
        <h2>Pedido no encontrado</h2>
        <p>El pedido con el número {orderId} no existe.</p>
        <Link to="/pedidos" className="back-to-list-link">Volver a la lista de pedidos</Link>
      </div>
    );
  }
  
  // El resto del código para mostrar los detalles del pedido se mantiene igual...
  return (
    <div className="order-details-page">
      <header className="details-header">
        <div className="header-left">
          <Link to="/pedidos" className="back-button"><FaArrowLeft /></Link>
          <h1>Detalles de pedidos</h1>
        </div>
        <div className="header-right">
          <span className="cash-status">Caja: Abierta</span>
          <FaBell className="notification-icon" />
          <FaUserCircle className="user-avatar" />
        </div>
      </header>

      <div className="details-container">
        <div className="details-section">
          <h3><FaPrint /> Detalles</h3>
          <table className="details-table">
            <thead>
              <tr><th>Numero</th><th>Mesa</th><th>Empleado</th><th>Estado</th><th>Fecha</th><th>Hora</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{order.numero}</td>
                <td>{order.mesa}</td>
                <td>{order.empleado}</td>
                <td><StatusBadge status={order.estado} /></td>
                <td>03/09/2025</td>
                <td>21:15 hs</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="details-section">
          <h3>Productos</h3>
          <table className="products-table">
            <thead>
              <tr><th>Productos</th><th>Cantidad</th><th>Precio unitario</th><th>Sub total</th></tr>
            </thead>
            <tbody>
              {productosEjemplo.map((p, i) => (
                <tr key={i}>
                  <td>{p.nombre}</td>
                  <td>{p.cantidad}</td>
                  <td>${p.precio.toLocaleString('es-AR')}</td>
                  <td>${p.subtotal.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-section">
            <span className="total-label">Total:</span>
            <span className="total-value">${total.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <div className="details-section payment-section">
          <span className="payment-label">Forma de pago</span>
          <span className="payment-value">Pendiente ( Se abona al entregar )</span>
        </div>

        <div className="details-section notes-section">
          <span className="notes-label">Nota:</span>
          <div className="notes-content">
            {order.nota || "Sin notas adicionales."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;