import React from 'react';
import './SalesPage.css';
import { FaBell, FaUserCircle } from 'react-icons/fa';
import SaleItem from './SaleItem';

const SalesPage = ({ orders }) => {
  // ¡CAMBIO CLAVE! Filtramos la lista de pedidos para quedarnos solo con los "Pagado"
  const completedSales = orders.filter(order => order.estado === 'Pagado');

  return (
    <div className="sales-page">
      <header className="sales-header">
        <h1>VENTAS</h1>
        <div className="header-right">
          <span className="cash-status">Caja: Abierta</span>
          <FaBell className="notification-icon" />
          <FaUserCircle className="user-avatar" />
        </div>
      </header>

      <div className="sales-list-container">
        {/* Ahora mapeamos la lista de ventas completadas */}
        {completedSales.length > 0 ? (
          completedSales.map(sale => (
            <SaleItem key={sale.numero} sale={sale} />
          ))
        ) : (
          <div className="no-sales-message">
            No hay ventas registradas para mostrar.
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPage;