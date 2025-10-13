import React from 'react';
import './ResumenDia.css';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { dailyChartData } from '../mockData';

ChartJS.register(ArcElement, Tooltip, Legend);

const ResumenDia = () => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: $${context.parsed.toLocaleString('es-AR')}`;
          }
        }
      }
    },
  };

  const totalVentas = dailyChartData.datasets[0].data.reduce((acc, value) => acc + value, 0);

  return (
    <div className="card-container">
      <h2 className="resumen-title">Resumen del día</h2>
      <div className="chart-wrapper">
        <Doughnut data={dailyChartData} options={options} />
        <div className="chart-total">
          <span>${totalVentas.toLocaleString('es-AR')}</span>
        </div>
      </div>
      <div className="legend-container">
        {dailyChartData.labels.map((label, index) => (
          <div className="legend-item" key={index}>
            <span className="legend-dot" style={{ backgroundColor: dailyChartData.datasets[0].backgroundColor[index] }}></span>
            <span className="legend-label">{label}</span>
            <span className="legend-value">${dailyChartData.datasets[0].data[index].toLocaleString('es-AR')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumenDia;