import React, { useState } from 'react';
import './CashPage.css';
import { FaBell, FaUserCircle, FaBook, FaDoorClosed } from 'react-icons/fa';
import { Doughnut } from 'react-chartjs-2';

// ======================================================================
// ESTA ES LA PARTE CRÍTICA QUE SOLUCIONA EL ERROR
// Importamos los componentes necesarios de la librería Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Y los registramos para que la librería sepa cómo dibujar el gráfico
ChartJS.register(ArcElement, Tooltip, Legend);
// ======================================================================

const initialChartData = {
  labels: ['Efectivo', 'Tarjeta', 'QR'],
  datasets: [
    {
      data: [0, 0, 0],
      backgroundColor: ['#4CAF50', '#C62828', '#F9A825'],
      borderColor: '#2c2c2e',
      borderWidth: 3,
    },
  ],
};

const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } },
};

const CashPage = () => {
  const [isCashBoxOpen, setIsCashBoxOpen] = useState(false);
  const [responsable, setResponsable] = useState('');
  const [montoInicial, setMontoInicial] = useState('');
  const [chartData, setChartData] = useState(initialChartData);

  const handleOpenCashBox = (e) => {
    e.preventDefault();
    if (responsable && montoInicial) {
      setIsCashBoxOpen(true);
      setChartData({
        labels: ['Efectivo', 'Tarjeta', 'QR'],
        datasets: [ { ...initialChartData.datasets[0], data: [11000, 7000, 0] } ]
      });
    } else {
      alert('Debe completar el responsable y el monto inicial.');
    }
  };
  
  const handleCloseCashBox = () => {
    setIsCashBoxOpen(false);
    setResponsable('');
    setMontoInicial('');
    setChartData(initialChartData);
  };

  return (
    <div className="cash-page">
      <header className="cash-header">
        <h1>CAJA</h1>
        <div className="header-right">
          <span className="cash-status-tag">Caja: {isCashBoxOpen ? 'Abierta' : 'Cerrada'}</span>
          <FaBell className="notification-icon" />
          <FaUserCircle className="user-avatar" />
        </div>
      </header>

      {isCashBoxOpen ? (
        <div className="cash-container open">
          <div className="cash-status-indicator open">Caja abierta</div>
          <table className="cash-info-table">
            <thead><tr><th>Responsable</th><th>Fecha</th><th>Hora</th><th>Monto inicial</th></tr></thead>
            <tbody><tr>
              <td>{responsable}</td>
              <td>{new Date().toLocaleDateString('es-ES')}</td>
              <td>{new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</td>
              <td>${parseFloat(montoInicial).toLocaleString('es-AR')}</td>
            </tr></tbody>
          </table>
          <div className="cash-summary-grid">
            <div className="summary-chart">
              <h3>Resumen del día</h3>
              <div className="chart-wrapper">
                <Doughnut data={chartData} options={options} />
                <div className="chart-total"><span>${chartData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString('es-AR')}</span></div>
              </div>
               <div className="legend-container">
                {chartData.labels.map((label, index) => (
                  <div className="legend-item" key={index}>
                    <span className="legend-dot" style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }}></span>
                    <span className="legend-label">{label}</span>
                    <span className="legend-value">${chartData.datasets[0].data[index].toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="summary-actions">
              <button className="btn-cash-action"><FaBook /> Historial de caja</button>
              <button className="btn-cash-action close" onClick={handleCloseCashBox}><FaDoorClosed /> Cerrar caja</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cash-container closed">
          <div className="cash-status-indicator closed">Caja cerrada</div>
          <form onSubmit={handleOpenCashBox}>
            <p>Para comenzar a operar, debe abrir la caja.</p>
            <div className="open-cash-form">
              <div className="form-field-cash">
                <label>Responsable</label>
                <input type="text" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
              </div>
              <div className="form-field-cash">
                <label>Monto inicial</label>
                <input type="number" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} />
              </div>
              <button type="submit" className="btn-open-cash">Abrir caja</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CashPage;