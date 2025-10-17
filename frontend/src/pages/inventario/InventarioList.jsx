import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";
import { FaEdit, FaLock, FaLockOpen, FaPlus, FaSearch } from "react-icons/fa";

export default function InventarioList() {
  const [rows, setRows] = useState([]);
  const [dialog, setDialog] = useState({ isOpen: false, item: null, action: null });
  const [alert, setAlert] = useState({ isOpen: false, message: "" });
  const [showCriticos, setShowCriticos] = useState(true);
  const [search, setSearch] = useState(""); // 🔍 búsqueda

  useEffect(() => {
    cargarInsumos();
  }, []);

  const cargarInsumos = () => {
  api.get("/api/insumos/").then((res) => {
    const data = Array.isArray(res.data?.results) ? res.data.results : res.data;
    // 🔹 Mostrar solo activos
    const activos = (data || []).filter((r) => Number(r?.id_estado_insumo) === 1);
    setRows(activos);
  });
};

  const handleToggleEstado = (insumo) => {
    const isActivating = insumo.id_estado_insumo !== 1;
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
      setAlert({ isOpen: true, message: `Error al ${action} el insumo.` });
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

 // ⚠️ críticos: solo insumos activos y con stock por debajo del punto de reposición
const criticos = rows.filter((r) => {
  const actual = Number(r?.ins_stock_actual ?? 0);
  const repo = Number(r?.ins_punto_reposicion ?? 0);
  return (
    Number(r?.id_estado_insumo) === 1 && // 🔹 solo activos
    !Number.isNaN(actual) &&
    !Number.isNaN(repo) &&
    actual < repo
  );
});
  // 🔍 filtro búsqueda (ignora mayúsculas y espacios)
  const normalizar = (txt) =>
    txt ? txt.toString().toLowerCase().replace(/\s+/g, "") : "";
  const filteredRows = rows.filter((r) =>
    normalizar(r.ins_nombre).includes(normalizar(search))
  );

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Inventario (Insumos)</h2>
        <div className="header-actions">
          <Link to="/inventario/inactivos" className="btn btn-secondary">
            Ver inactivos
          </Link>
          <Link to="/inventario/registrar" className="btn btn-primary">
            <FaPlus /> Registrar insumo
          </Link>
        </div>
      </div>

      {/* 🔍 Búsqueda */}
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar insumo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ⚠️ Alerta de insumos críticos */}
      {showCriticos && criticos.length > 0 && (
        <div className="critical-alert">
          <div className="critical-alert-header">
            <strong>
              {criticos.length} insumo
              {criticos.length > 1 ? "s" : ""} en nivel crítico
            </strong>
            <button
              className="critical-close"
              onClick={() => setShowCriticos(false)}
            >
              Cerrar
            </button>
          </div>
          <ul className="critical-list">
            {criticos.map((i) => (
              <li key={`critico-${i.id_insumo}`}>
                <div className="critical-item">
                  <span className="critical-icon">⚠️</span>
                  <span className="critical-name">{i.ins_nombre}</span>
                </div>
                <span className="critical-metrics">
                  Stock actual: {formatNumber(i.ins_stock_actual)} {i.ins_unidad} — Punto de reposición:{" "}
                  {formatNumber(i.ins_punto_reposicion)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabla de insumos */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Stock actual</th>
              <th>Pto. reposición</th>
              <th>Stock min</th>
              <th>Stock max</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id_insumo}>
                <td>{r.id_insumo}</td>
                <td>{r.ins_nombre}</td>
                <td>{r.ins_unidad}</td>
                <td>{formatNumber(r.ins_stock_actual)}</td>
                <td>{formatNumber(r.ins_punto_reposicion)}</td>
                <td>{formatNumber(r.ins_stock_min)}</td>
                <td>{formatNumber(r.ins_stock_max)}</td>
                <td>{estadoChip(r.id_estado_insumo, r.estado_nombre)}</td>
                <td className="actions-cell">
                  <Link
                    to={`/inventario/editar/${r.id_insumo}`}
                    className="btn btn-secondary"
                  >
                    <FaEdit /> Editar
                  </Link>
                  <button
                    className={`btn ${
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
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan="9" className="empty-row">
                  No hay insumos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={dialog.isOpen}
        title={`Confirmar ${
          dialog.action === "activar" ? "Activación" : "Desactivación"
        }`}
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
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .page-header h2 { margin: 0; font-size: 1.75rem; color: #fff; }
        .header-actions { display: flex; gap: 8px; }

        /* 🔍 Búsqueda */
        .search-bar {
          display: flex;
          align-items: center;
          background-color: #3a3a3c;
          border: 1px solid #4a4a4e;
          border-radius: 8px;
          padding: 6px 10px;
          margin-bottom: 16px;
          width: 100%;
          max-width: 400px;
        }
        .search-icon {
          color: #facc15;
          margin-right: 8px;
        }
        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 1rem;
        }

        /* ⚠️ Alerta crítica */
        .critical-alert {
          background: rgba(250, 204, 21, 0.12);
          border: 1px solid rgba(250, 204, 21, 0.35);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }
        .critical-alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          color: #facc15;
          font-weight: 700;
        }
        .critical-close {
          background: transparent;
          border: 1px solid rgba(250, 204, 21, 0.35);
          color: #facc15;
          padding: 4px 10px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 700;
        }
        .critical-close:hover {
          background: rgba(250, 204, 21, 0.12);
        }
        .critical-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .critical-list li {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          color: #eaeaea;
          font-size: 0.95rem;
          border-bottom: 1px solid rgba(250, 204, 21, 0.15);
          padding-bottom: 4px;
        }
        .critical-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .critical-icon {
          color: #f87171;
          font-size: 1.1rem;
        }
        .critical-name {
          font-weight: 700;
        }
        .critical-metrics {
          opacity: 0.85;
        }

        /* Tabla */
        .table-container { background-color: #2c2c2e; border: 1px solid #3a3a3c; border-radius: 12px; overflow: hidden; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #3a3a3c; }
        .table th { background-color: #3a3a3c; color: #d1d5db; font-weight: 600; font-size: 0.875rem; text-transform: uppercase; }
        .table td { color: #eaeaea; }
        .table tbody tr:last-child td { border-bottom: none; }
        .actions-cell { display: flex; gap: 8px; }
        .empty-row { text-align: center; color: #a0a0a0; padding: 32px; }
        .status-chip { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .status-chip.active { background: rgba(52, 211, 153, 0.1); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.2); }
        .status-chip.inactive { background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.2); }
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; text-decoration: none; transition: background-color 0.2s ease; }
        .btn-primary { background-color: #facc15; color: #111827; }
        .btn-primary:hover { background-color: #eab308; }
        .btn-secondary { background-color: #3a3a3c; color: #eaeaea; }
        .btn-secondary:hover { background-color: #4a4a4e; }
        .btn-danger { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .btn-danger:hover { background-color: rgba(239, 68, 68, 0.3); }
        .btn-success { background-color: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .btn-success:hover { background-color: rgba(34, 197, 94, 0.3); }
      `}</style>
    </DashboardLayout>
  );
}
