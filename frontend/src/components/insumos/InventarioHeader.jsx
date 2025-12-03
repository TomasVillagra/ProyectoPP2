import React from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaBell } from "react-icons/fa";

export default function InventarioHeader({
  criticos,
  critOpen,
  onToggleCritOpen,
  formatNumber,
  dropdownRef,
}) {
  return (
    <div className="page-header">
      <h2>Inventario (Insumos)</h2>

      <div className="header-actions" ref={dropdownRef}>
        {/* 🔔 Notificación desplegable de críticos */}
        <div className="notif-wrap">
          <button
            type="button"
            className={`notif-btn ${criticos.length ? "has-crit" : ""}`}
            onClick={onToggleCritOpen}
            title="Insumos en punto crítico"
          >
            <FaBell />
            <span className="notif-label">Insumos en punto crítico</span>
            <span className="notif-badge">{criticos.length}</span>
          </button>

          {critOpen && (
            <div className="notif-dropdown">
              <div className="notif-title">Insumos en punto crítico</div>
              {criticos.length === 0 ? (
                <div className="notif-empty">No hay insumos críticos.</div>
              ) : (
                <ul className="notif-list">
                  {criticos.map((i) => (
                    <li key={`critico-${i.id_insumo}`} className="notif-item">
                      <div className="notif-row">
                        <span className="dot" />
                        <span className="name">{i.ins_nombre}</span>
                      </div>
                      <div className="metrics">
                        Stock: {formatNumber(i.ins_stock_actual)} {i.ins_unidad} ·
                        Reposición: {formatNumber(i.ins_punto_reposicion)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <Link to="/inventario/inactivos" className="btn btn-secondary">
          Ver inactivos
        </Link>
        <Link to="/inventario/registrar" className="btn btn-primary">
          <FaPlus /> Registrar insumo
        </Link>
      </div>
    </div>
  );
}
