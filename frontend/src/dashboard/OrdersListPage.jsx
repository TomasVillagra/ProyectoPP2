import React, { useState } from 'react';
// ======================================================================
// ¡CORRECCIÓN! Añadimos 'useNavigate' a la importación
import { Link, useNavigate } from 'react-router-dom';
// ======================================================================
import './OrdersListPage.css';
import { FaEye, FaEdit, FaTrash, FaBell, FaUserCircle } from 'react-icons/fa';
import Modal from './Modal';

const StatusBadge = ({ status }) => {
  const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;
  return <span className={`status-badge ${statusClass}`}>{status}</span>;
};

const OrdersListPage = ({ orders, setOrders }) => {
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const handleView = (orderNumber) => {
    navigate(`/pedidos/${orderNumber}`);
  };

  const handleEdit = (orderNumber) => {
    navigate(`/pedidos/editar/${orderNumber}`);
  };

  const handleDeleteClick = (orderNumber) => {
    setOrderToDelete(orderNumber);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setOrders(prevOrders => prevOrders.filter(order => order.numero !== orderToDelete));
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  return (
    <div className="orders-list-page">
      <header className="orders-header">
        <h1>PEDIDOS</h1>
        <div className="header-right">
          <span className="cash-status">Caja: Abierta</span>
          <FaBell className="notification-icon" />
          <FaUserCircle className="user-avatar" />
        </div>
      </header>

      <div className="orders-container">
        <h2 className="orders-title">Pedidos</h2>
        <table className="orders-table-full">
          <thead>
            <tr>
              <th>Numero</th>
              <th>Mesa</th>
              <th>Empleado</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.numero}>
                  <td>{order.numero}</td>
                  <td>{order.mesa}</td>
                  <td>{order.empleado}</td>
                  <td><StatusBadge status={order.estado} /></td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleView(order.numero)} className="btn-action btn-view"><FaEye /></button>
                      <button onClick={() => handleEdit(order.numero)} className="btn-action btn-edit"><FaEdit /></button>
                      <button onClick={() => handleDeleteClick(order.numero)} className="btn-action btn-delete"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  No hay pedidos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="add-new-order-container">
          <Link to="/pedidos/nuevo" className="add-new-order-btn">
            + Nuevo Pedido
          </Link>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
      >
        <p>¿Está seguro que desea eliminar este pedido?</p>
      </Modal>
    </div>
  );
};

export default OrdersListPage;