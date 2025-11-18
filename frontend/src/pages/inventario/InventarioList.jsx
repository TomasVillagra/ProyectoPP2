import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";
import { FaEdit, FaLock, FaLockOpen, FaPlus, FaSearch, FaBell } from "react-icons/fa";

export default function InventarioList() {
  const [rows, setRows] = useState([]);
  const [dialog, setDialog] = useState({ isOpen: false, item: null, action: null });
  const [alert, setAlert] = useState({ isOpen: false, message: "" });
  const [search, setSearch] = useState(""); // 🔍 búsqueda

  // ▼ Nuevo: filtro (todos / críticos)
  const [filterMode, setFilterMode] = useState("todos"); // "todos" | "criticos"

  // ▼ Dropdown de críticos
  const [critOpen, setCritOpen] = useState(false);
  const dropdownRef = useRef(null);

  // PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarInsumos();
  }, []);

  // Cerrar el dropdown si clickean fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCritOpen(false);
      }
    }
    if (critOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [critOpen]);

  const cargarInsumos = () => {
    api.get("/api/insumos/").then((res) => {
      const data = Array.isArray(res.data?.results) ? res.data.results : res.data;
      // 🔹 Mostrar solo activos
      const activos = (data || []).filter((r) => Number(r?.id_estado_insumo) === 1);
      setRows(activos);
      setCurrentPage(1); // reset de página cuando recargo
    });
  };

  const handleToggleEstado = (insumo) => {
    const isActivating = insumo.id_estado_insumo !== 1;

    // 🛑 Si está en receta, no dejar desactivar
    if (!isActivating) {
      const usadoEnReceta =
        insumo.tiene_recetas ||
        insumo.en_receta ||
        insumo.usado_en_recetas ||
        insumo.asociado_recetas;

      if (usadoEnReceta) {
        setAlert({
          isOpen: true,
          message: `No se puede desactivar el insumo "${insumo.ins_nombre}" porque está asociado a una receta.`,
        });
        return;
      }
    }

    setDialog({
      isOpen: true,
      item: insumo,
      action: isActivating ? "activar" : "desactivar",
    });
  };

  const onConfirmToggleEstado = async () => {
    if (!dialog.item) return;
    const action = dialog.action;

    try {
      await api.put(`/api/insumos/${dialog.item.id_insumo}/`, {
        ...dialog.item,
        id_estado_insumo: action === "activar" ? 1 : 2,
      });
      setAlert({ isOpen: true, message: `Insumo ${action}do correctamente.` });
      cargarInsumos();
    } catch (err) {
      console.error(err);

      // Mensaje específico del back si existe
      const detalle =
        err?.response?.data?.detail ||
        err?.response?.data?.detalle ||
        err?.response?.data?.error ||
        err?.response?.data?.mensaje;

      if (detalle && typeof detalle === "string") {
        setAlert({
          isOpen: true,
          message: detalle,
        });
      } else {
        setAlert({
          isOpen: true,
          message: `Error al ${action} el insumo. Verificá si está asociado a una receta.`,
        });
      }
    } finally {
      setDialog({ isOpen: false, item: null, action: null });
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "-";
    return Number(num).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const estadoChip = (estadoId, nombre) => {
    const label = nombre ?? (estadoId === 1 ? "Activo" : "Inactivo");
    const isActive = estadoId === 1;
    return <span className={`status-chip ${isActive ? "active" : "inactive"}`}>{label}</span>;
  };

  // 👉 Función para saber si un insumo está en punto crítico
  const esCritico = (r) => {
    const actual = Number(r?.ins_stock_actual ?? 0);
    const repo = Number(r?.ins_punto_reposicion ?? 0);
    return (
      Number(r?.id_estado_insumo) === 1 &&
      !Number.isNaN(actual) &&
      !Number.isNaN(repo) &&
      actual < repo
    );
  };

  // ⚠️ críticos: solo insumos activos y con stock por debajo del punto de reposición
  const criticos = rows.filter(esCritico);

  // 🔍 filtro búsqueda (ignora mayúsculas y espacios)
  const normalizar = (txt) => (txt ? txt.toString().toLowerCase().replace(/\s+/g, "") : "");

  const baseFiltered = rows.filter((r) =>
    normalizar(r.ins_nombre).includes(normalizar(search))
  );

  // 🎯 Aplicar filtro (todos / críticos)
  const filteredRows =
    filterMode === "criticos" ? baseFiltered.filter(esCritico) : baseFiltered;

  // PAGINACIÓN sobre los filtrados
  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageRows = filteredRows.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleChangeFilter = (mode) => {
    setFilterMode(mode);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Inventario (Insumos)</h2>

        <div className="header-actions" ref={dropdownRef}>
          {/* 🔔 Notificación desplegable de críticos */}
          <div className="notif-wrap">
            <button
              type="button"
              className={`notif-btn ${criticos.length ? "has-crit" : ""}`}
              onClick={() => setCritOpen((v) => !v)}
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
                          Stock: {formatNumber(i.ins_stock_actual)} {i.ins_unidad} · Reposición:{" "}
                          {formatNumber(i.ins_punto_reposicion)}
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

      {/* 🔍 Búsqueda + Filtros */}
      <div className="toolbar-row">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar insumo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // si cambio la búsqueda, vuelvo a la página 1
            }}
          />
        </div>

        <div className="filter-bar">
          <button
            type="button"
            className={`filter-btn ${filterMode === "todos" ? "active" : ""}`}
            onClick={() => handleChangeFilter("todos")}
          >
            Todos
          </button>
          <button
            type="button"
            className={`filter-btn ${filterMode === "criticos" ? "active" : ""}`}
            onClick={() => handleChangeFilter("criticos")}
          >
            En punto crítico
          </button>
        </div>
      </div>

      {/* Tabla de insumos (data table + paginación) */}
      <div className="table-wrap">
        <table className="table-dark">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>Capacidad</th>
              <th>Stock actual</th>
              <th>Pto. reposición</th>
              <th>Stock min</th>
              <th>Stock max</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id_insumo}>
                <td>{r.id_insumo}</td>
                <td>{r.ins_nombre}</td>
                <td>{r.ins_unidad}</td>

                {/* Cantidad dinámica */}
                <td>{r.insumos_equivalentes != null ? r.insumos_equivalentes : "-"}</td>

                {/* Capacidad de cada fardo / bolsa / caja */}
                <td>
                  {formatNumber(r.ins_capacidad)} {r.ins_unidad}
                </td>

                <td>{formatNumber(r.ins_stock_actual)}</td>
                <td>{formatNumber(r.ins_punto_reposicion)}</td>
                <td>{formatNumber(r.ins_stock_min)}</td>
                <td>{formatNumber(r.ins_stock_max)}</td>
                <td>{estadoChip(r.id_estado_insumo, r.estado_nombre)}</td>
                <td className="actions-cell">
                  <Link to={`/inventario/editar/${r.id_insumo}`} className="btn btn-secondary btn-sm">
                    <FaEdit /> Editar
                  </Link>
                  <button
                    className={`btn btn-sm ${
                      r.id_estado_insumo === 1 ? "btn-danger" : "btn-success"
                    }`}
                    onClick={() => handleToggleEstado(r)}
                  >
                    {r.id_estado_insumo === 1 ? (
                      <>
                        <FaLock /> Desactivar
                      </>
                    ) : (
                      <>
                        <FaLockOpen /> Activar
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan="11" className="empty-row">
                  No hay insumos que coincidan con la búsqueda / filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación */}
      {totalItems > 0 && (
        <div className="pagination-wrap">
          <div className="pagination-info">
            Mostrando <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong>–
            <strong>{endIndex}</strong> de <strong>{totalItems}</strong> insumos
          </div>
          <div className="pagination-controls">
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span className="pagination-page">
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialog.isOpen}
        title={`Confirmar ${dialog.action === "activar" ? "Activación" : "Desactivación"}`}
        message={`¿Seguro que querés ${dialog.action} el insumo "${dialog.item?.ins_nombre}"?`}
        onConfirm={onConfirmToggleEstado}
        onCancel={() => setDialog({ isOpen: false, item: null, action: null })}
      />
      <AlertDialog
        open={alert.isOpen}
        title="Notificación"
        message={alert.message}
        onClose={() => setAlert({ isOpen: false, message: "" })}
      />

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .page-header h2 {
          margin: 0;
          font-size: 1.75rem;
          color: #fff;
        }
        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          position: relative;
        }

        /* 🔔 Notificación críticos */
        .notif-wrap { position: relative; }
        .notif-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #3a3a3c;
          color: #eaeaea;
          border: 1px solid #4a4a4e;
          border-radius: 999px;
          padding: 6px 10px;
          cursor: pointer;
          font-weight: 700;
        }
        .notif-btn.has-crit {
          border-color: rgba(250, 204, 21, 0.6);
          box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.15) inset;
        }
        .notif-label { font-size: 0.9rem; }
        .notif-badge {
          background: #facc15;
          color: #111827;
          font-weight: 900;
          border-radius: 999px;
          padding: 0 8px;
          line-height: 20px;
          min-width: 22px;
          text-align: center;
        }
        .notif-dropdown {
          position: absolute;
          top: 110%;
          right: 0;
          z-index: 40;
          width: 360px;
          max-height: 60vh;
          overflow: auto;
          background: #1b1b1d;
          border: 1px solid #3a3a3c;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,.4);
          padding: 10px;
        }
        .notif-title {
          color: #facc15;
          font-weight: 800;
          margin: 6px 6px 10px;
        }
        .notif-empty {
          color: #cfcfcf;
          padding: 8px 10px;
        }
        .notif-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .notif-item {
          border-bottom: 1px solid rgba(250, 204, 21, 0.12);
          padding: 6px 8px 10px;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-weight: 700;
        }
        .dot {
          width: 10px;
          height: 10px;
          background: #f87171;
          border-radius: 999px;
          display: inline-block;
        }
        .name { flex: 1; }
        .metrics {
          color: #eaeaea;
          opacity: .9;
          margin-left: 18px;
          font-size: .92rem;
        }

        /* Barra search + filtros */
        .toolbar-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .search-bar {
          display: flex;
          align-items: center;
          background-color: #3a3a3c;
          border: 1px solid #4a4a4e;
          border-radius: 8px;
          padding: 6px 10px;
          width: 100%;
          max-width: 400px;
        }
        .search-icon { color: #facc15; margin-right: 8px; }
        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 1rem;
        }

        .filter-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #4a4a4e;
          background: #111827;
          color: #e5e7eb;
          font-size: 0.85rem;
          cursor: pointer;
          font-weight: 600;
        }
        .filter-btn.active {
          background: #facc15;
          color: #111827;
          border-color: #eab308;
        }

        /* Data table con más espaciado */
        .table-wrap {
          margin-top: 12px;
          overflow:auto;
        }
        .table-dark {
          width:100%;
          border-collapse:separate;
          border-spacing:0 4px;        /* espacio entre filas */
          background:transparent;
          color:#eaeaea;
        }
        .table-dark thead tr {
          background:#18181b;
        }
        .table-dark th, .table-dark td {
          padding:10px 14px;
          font-size:14px;
          line-height:1.4;
        }
        .table-dark th:first-child,
        .table-dark td:first-child {
          padding-left:16px;
        }
        .table-dark th:last-child,
        .table-dark td:last-child {
          padding-right:16px;
        }
        .table-dark tbody tr {
          background:#2c2c2e;
          border-radius:10px;
        }
        .table-dark tbody tr:hover {
          background:#35353a;
        }
        .table-dark tbody tr td {
          border-top:1px solid #3a3a3c;
          border-bottom:1px solid #3a3a3c;
        }
        .table-dark tbody tr td:first-child {
          border-left:1px solid #3a3a3c;
          border-top-left-radius:10px;
          border-bottom-left-radius:10px;
        }
        .table-dark tbody tr td:last-child {
          border-right:1px solid #3a3a3c;
          border-top-right-radius:10px;
          border-bottom-right-radius:10px;
        }
        .table-dark th {
          text-align:left;
          color:#d1d5db;
          font-weight:600;
          font-size:0.82rem;
          text-transform:uppercase;
        }
        .empty-row {
          text-align: center;
          color: #a0a0a0;
          padding: 24px;
        }

        .status-chip {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .status-chip.active {
          background: rgba(52, 211, 153, 0.1);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.2);
        }
        .status-chip.inactive {
          background: rgba(248, 113, 113, 0.1);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.2);
        }

        .actions-cell {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.2s ease;
          font-size: 13px;
        }
        .btn-sm {
          padding: 6px 10px;
          font-size: 12px;
        }
        .btn-primary {
          background-color: #facc15;
          color: #111827;
        }
        .btn-primary:hover { background-color: #eab308; }
        .btn-secondary {
          background-color: #3a3a3c;
          color: #eaeaea;
        }
        .btn-secondary:hover { background-color: #4a4a4e; }
        .btn-danger {
          background-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .btn-danger:hover { background-color: rgba(239, 68, 68, 0.3); }
        .btn-success {
          background-color: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }
        .btn-success:hover { background-color: rgba(34, 197, 94, 0.3); }

        .pagination-wrap {
          margin-top: 16px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .pagination-info {
          font-size: 13px;
          color: #d4d4d8;
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pagination-page {
          font-size: 13px;
          color: #e4e4e7;
        }
      `}</style>
    </DashboardLayout>
  );
}



