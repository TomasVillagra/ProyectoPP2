import React from 'react';
import './SaleItem.css';
import { FaReceipt, FaPrint } from 'react-icons/fa';

const SaleItem = ({ sale }) => {
  // Calculamos el total de la venta basado en los datos del pedido
  // (Asumiendo por ahora un solo producto por pedido, como lo hemos manejado)
  const total = (parseFloat(sale.cantidad) || 0) * (parseFloat(sale.precioUnitario) || 0);

  return (
    <div className="sale-item-card">
      <table className="sale-details-table">
        <thead>
          <tr>
            <th>Numero</th>
            <th>Mesa</th>
            <th>Empleado</th>
            <th>Forma de pago</th>
            <th>Fecha</th>
            <th>Hora</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{sale.numero}</td>
            <td>{sale.mesa}</td>
            <td>{sale.empleado}</td>
            {/* Dato de ejemplo, ya que no lo guardamos en el formulario aún */}
            <td>Efectivo</td> 
            <td>{new Date().toLocaleDateString('es-ES')}</td>
            <td>{new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})} hs</td>
          </tr>
        </tbody>
      </table>
      <div className="sale-actions">
        <button className="btn-sale-action">
          <FaReceipt /> Detalles
        </button>
        <button className="btn-sale-action">
          <FaPrint /> Imprimir
        </button>
        <div className="sale-total">
          Total: ${total.toLocaleString('es-AR')}
        </div>
      </div>
    </div>
  );
};

export default SaleItem;