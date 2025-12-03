import React from "react";
import { FaSearch } from "react-icons/fa";

export default function InventarioToolbar({
  search,
  onSearchChange,
  filterMode,
  onFilterChange,
}) {
  return (
    <div className="toolbar-row">
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar insumo..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-bar">
        <button
          type="button"
          className={`filter-btn ${filterMode === "todos" ? "active" : ""}`}
          onClick={() => onFilterChange("todos")}
        >
          Todos
        </button>
        <button
          type="button"
          className={`filter-btn ${filterMode === "criticos" ? "active" : ""}`}
          onClick={() => onFilterChange("criticos")}
        >
          En punto crítico
        </button>
      </div>
    </div>
  );
}
