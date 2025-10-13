import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './DashboardPage.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#e0e0e0',
        font: {
          size: 14,
        },
      },
    },
  },
  scales: {
    y: {
      ticks: {
        color: '#a0a0a0',
        callback: function(value) {
          return '$' + value.toLocaleString('es-AR');
        }
      },
      grid: {
        color: '#444',
        borderDash: [5, 5],
      },
    },
    x: {
      ticks: {
        color: '#a0a0a0',
      },
      grid: {
        display: false,
      },
    },
  },
};

const WeeklySalesChart = ({ weeklyData }) => {
  const chartData = {
    labels: weeklyData.labels,
    datasets: [
      {
        label: 'Ventas por día',
        data: weeklyData.data,
        fill: false,
        borderColor: '#facc15',
        backgroundColor: '#facc15',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  return (
    <div className="widget-card">
      <h3 className="widget-title">Ventas semanales</h3>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default WeeklySalesChart;