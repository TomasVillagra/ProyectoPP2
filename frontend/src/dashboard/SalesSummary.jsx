import React from 'react';
import './DashboardPage.css';

const SalesSummary = ({ summary }) => {
  return (
    <div className="widget-card">
      <h3 className="widget-title">Resumen de ventas hoy</h3>
      <div className="summary-total">
        <span className="summary-amount">${summary.total.toLocaleString('es-AR')}</span>
        <span className="summary-subtitle">Total del día</span>
      </div>
      <ul className="summary-legend">
        {summary.metodos.map(item => (
          <li key={item.method}>
            <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
            <span className="legend-label">{item.method}</span>
            <span className="legend-value">${item.amount.toLocaleString('es-AR')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SalesSummary;