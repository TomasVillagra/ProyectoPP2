import React from 'react';
import './DashboardPage.css';
import { FaHamburger, FaUser, FaClock, FaDollarSign, FaExclamationTriangle, FaStore } from 'react-icons/fa';
import StatCard from './StatCard';
import SalesSummary from './SalesSummary';
import WeeklySalesChart from './WeeklySalesChart';

const DashboardPage = ({ data }) => {
  return (
    <div className="dashboard-page-dark">
      <header className="dashboard-header-dark">
        <div className="header-left-dark">
          <button className="menu-btn-dark"><FaHamburger /></button>
          <h2>Pizzería REX</h2>
        </div>
        <div className="header-right-dark">
          <FaUser />
        </div>
      </header>

      <section className="stat-cards-container">
        <StatCard icon={<FaClock />} value={data.stats.pedidosPendientes} title="Pedidos pendientes" />
        <StatCard icon={<FaDollarSign />} value={`$ ${data.stats.ventasDelDia.toLocaleString('es-AR')}`} title="Ventas del día" />
        <StatCard icon={<FaExclamationTriangle />} value={data.stats.insumosCriticos} title="Insumos críticos" />
        <StatCard icon={<FaStore />} value={data.stats.estadoCaja} title="Estado de caja" />
      </section>

      <section className="dashboard-main-content">
        <SalesSummary summary={data.resumenVentas} />
        <WeeklySalesChart weeklyData={data.ventasSemanales} />
      </section>
    </div>
  );
};

export default DashboardPage;