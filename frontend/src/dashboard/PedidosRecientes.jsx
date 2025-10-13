import React from 'react';
import './PedidosRecientes.css';
import { recentOrders } from '../mockData';

const StatusBadge = ({ status }) => {
  const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;
  return <span className={`status-badge ${statusClass}`}>{status}</span>;
};

const PedidosRecientes = () => {
  return (
    <div className="card-container">
      <div className="card-header">
        <h2>Pedidos</h2>
        <button className="new-order-btn">+ Nuevo Pedido</button>
      </div>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Numero</th>
            <th>Mesa</th>
            <th>Empleado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.map((order, index) => (
            <tr key={index}>
              <td>{order.numero}</td>
              <td>{order.mesa}</td>
              <td>{order.empleado}</td>
              <td><StatusBadge status={order.estado} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PedidosRecientes;