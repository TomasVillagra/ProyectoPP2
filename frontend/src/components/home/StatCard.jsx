// src/components/home/StatCard.jsx

const StatCard = ({ icon, value, title }) => (
  <div className="widget-card stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-title">{title}</div>
  </div>
);

export default StatCard;
