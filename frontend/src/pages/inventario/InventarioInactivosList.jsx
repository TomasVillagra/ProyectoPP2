import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";
import { FaEdit, FaLockOpen, FaSearch, FaArrowLeft } from "react-icons/fa";

export default function InventarioInactivosList() {
  const [rows, setRows] = useState([]);
  const [dialog, setDialog] = useState({ isOpen: false, item: null, action: null });
  const [alert, setAlert] = useState({ isOpen: false, message: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarInsumos();
  }, []);

  const cargarInsumos = () => {
    api.get("/api/insumos/").then((res) => {
      const data = Array.isArray(res.data?.results) ? res.data.results : res.data;
      // Solo inactivos (id_estado_insumo === 2)
      setRows((data || []).filter((r) => Number(r?.id_estado_insumo) === 2));
    });
  };

  const onConfirmToggleEstado = async () => {
    if (!dialog.item) return;
    try {
      await api.put(`/api/insumos/${dialog.item.id_insumo}/`, {
        ...dialog.item,
        id_estado_insumo: 1, // Activar
      });
      setAlert({ isOpen: true, message: `Insumo activado correctamente.` });
      cargarInsumos();
    } catch (err) {
      console.error(err);
      setAlert({ isOpen: true, message: `Error al activar el insumo.` });
    } finally {
      setDialog({ isOpen: false, item: null, action: null });
    }
  };

  const handleActivate = (insumo) => {
    setDialog({ isOpen: true, item: insumo, action: "activar" });
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "-";
    return Number(num).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Búsqueda que ignora mayúsculas y espacios
  const normalize = (txt) => (txt ? txt.toString().toLowerCase().replace(/\s+/g, "") : "");
  const filteredRows = rows.filter((r) => normalize(r.ins_nombre).includes(normalize(search)));

  const estadoChip = () => (
    <span className="status-chip inactive">Inactivo</span>
  );

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Insumos Inactivos</h2>
        {/* Volver a Inventario (activos) */}
        <Link to="/inventario" className="btn btn-secondary">
          <FaArrowLeft /> Volver a activos
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar insumo inactivo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
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
                <td>{estadoChip()}</td>
                <td className="actions-cell">
                  <Link to={`/inventario/editar/${r.id_insumo}`} className="btn btn-secondary">
                    <FaEdit /> Editar
                  </Link>
                  <button className="btn btn-success" onClick={() => handleActivate(r)}>
                    <FaLockOpen /> Activar
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan="9" className="empty-row">
                  No hay insumos inactivos o no coinciden con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={dialog.isOpen}
        title="Confirmar Activación"
        message={`¿Seguro que querés activar el insumo "${dialog.item?.ins_nombre}"?`}
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
        .search-icon { color: #facc15; margin-right: 8px; }
        .search-bar input {
          flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 1rem;
        }

        .table-container { background-color: #2c2c2e; border: 1px solid #3a3a3c; border-radius: 12px; overflow: hidden; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #3a3a3c; }
        .table th { background-color: #3a3a3c; color: #d1d5db; font-weight: 600; font-size: 0.875rem; text-transform: uppercase; }
        .table td { color: #eaeaea; }
        .table tbody tr:last-child td { border-bottom: none; }
        .actions-cell { display: flex; gap: 8px; }
        .empty-row { text-align: center; color: #a0a0a0; padding: 32px; }

        .status-chip { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .status-chip.inactive { background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.2); }

        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; text-decoration: none; transition: background-color 0.2s ease; }
        .btn-secondary { background-color: #3a3a3c; color: #eaeaea; }
        .btn-secondary:hover { background-color: #4a4a4e; }
        .btn-success { background-color: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .btn-success:hover { background-color: rgba(34, 197, 94, 0.3); }
      `}</style>
    </DashboardLayout>
  );
}
