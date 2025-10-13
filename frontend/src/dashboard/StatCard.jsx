import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, value, title }) => {
  return (
    <div className="stat-card-dark">
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-title">{title}</span>
      </div>
    </div>
  );
};

export default StatCard;