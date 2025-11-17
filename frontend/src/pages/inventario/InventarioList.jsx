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

  // ▼ Nuevo: dropdown de críticos
  const [critOpen, setCritOpen] = useState(false);
  const dropdownRef = useRef(null);

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
      Number(r?.id_estado_insumo) === 1 &&
      !Number.isNaN(actual) &&
      !Number.isNaN(repo) &&
      actual < repo
    );
  });

  // 🔍 filtro búsqueda (ignora mayúsculas y espacios)
  const normalizar = (txt) => (txt ? txt.toString().toLowerCase().replace(/\s+/g, "") : "");
  const filteredRows = rows.filter((r) => normalizar(r.ins_nombre).includes(normalizar(search)));

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Inventario (Insumos)</h2>

        <div className="header-actions" ref={dropdownRef}>
          {/* ▼ Notificación desplegable de críticos */}
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

          {/* Tabla de insumos */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Unidad</th>
              {/* Cantidad que TENÉS ahora (fardos equivalentes) */}
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
            {filteredRows.map((r) => (
              <tr key={r.id_insumo}>
                <td>{r.id_insumo}</td>
                <td>{r.ins_nombre}</td>
                <td>{r.ins_unidad}</td>

                {/* 👉 Cantidad dinámica: viene del BACK (insumos_equivalentes) */}
                <td>
                  {r.insumos_equivalentes != null ? r.insumos_equivalentes : "-"}
                </td>

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
                  <Link to={`/inventario/editar/${r.id_insumo}`} className="btn btn-secondary">
                    <FaEdit /> Editar
                  </Link>
                  <button
                    className={`btn ${r.id_estado_insumo === 1 ? "btn-danger" : "btn-success"}`}
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
                <td colSpan="11" className="empty-row">
                  No hay insumos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


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
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .page-header h2 { margin: 0; font-size: 1.75rem; color: #fff; }
        .header-actions { display: flex; gap: 8px; align-items: center; position: relative; }

        /* 🔔 Notificación críticos */
        .notif-wrap { position: relative; }
        .notif-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background-color: #3a3a3c; color: #eaeaea;
          border: 1px solid #4a4a4e; border-radius: 999px;
          padding: 6px 10px; cursor: pointer; font-weight: 700;
        }
        .notif-btn.has-crit { border-color: rgba(250, 204, 21, 0.6); box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.15) inset; }
        .notif-label { font-size: 0.9rem; }
        .notif-badge {
          background: #facc15; color: #111827; font-weight: 900;
          border-radius: 999px; padding: 0 8px; line-height: 20px; min-width: 22px; text-align: center;
        }
        .notif-dropdown {
          position: absolute; top: 110%; right: 0; z-index: 40;
          width: 360px; max-height: 60vh; overflow: auto;
          background: #1b1b1d; border: 1px solid #3a3a3c; border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,.4);
          padding: 10px;
        }
        .notif-title { color: #facc15; font-weight: 800; margin: 6px 6px 10px; }
        .notif-empty { color: #cfcfcf; padding: 8px 10px; }
        .notif-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .notif-item { border-bottom: 1px solid rgba(250, 204, 21, 0.12); padding: 6px 8px 10px; }
        .notif-item:last-child { border-bottom: none; }
        .notif-row { display: flex; align-items: center; gap: 8px; color: #fff; font-weight: 700; }
        .dot { width: 10px; height: 10px; background: #f87171; border-radius: 999px; display: inline-block; }
        .name { flex: 1; }
        .metrics { color: #eaeaea; opacity: .9; margin-left: 18px; font-size: .92rem; }

        /* 🔍 Búsqueda */
        .search-bar {
          display: flex; align-items: center;
          background-color: #3a3a3c; border: 1px solid #4a4a4e;
          border-radius: 8px; padding: 6px 10px; margin-bottom: 16px;
          width: 100%; max-width: 400px;
        }
        .search-icon { color: #facc15; margin-right: 8px; }
        .search-bar input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 1rem; }

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

