import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";
import { FaEdit, FaLock, FaLockOpen, FaPlus, FaSearch, FaBoxes } from "react-icons/fa";

export default function ProveedoresList() {
  const [rows, setRows] = useState([]);
  const [dialog, setDialog] = useState({ isOpen: false, item: null, action: null });
  const [alert, setAlert] = useState({ isOpen: false, message: "" });
  const [search, setSearch] = useState("");

  // paginación
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    cargar();
  }, []);

  const cargar = () => {
    api.get("/api/proveedores/").then((res) => {
      const data = Array.isArray(res.data?.results) ? res.data.results : res.data;
      const activos = (data || []).filter((r) => Number(r?.id_estado_prov) === 1);
      setRows(activos);
      setPage(1); // resetear a la primera página al recargar
    });
  };

  const handleToggleEstado = (prov) => {
    const isActivating = prov.id_estado_prov !== 1;
    setDialog({
      isOpen: true,
      item: prov,
      action: isActivating ? "activar" : "desactivar",
    });
  };

  const onConfirmToggleEstado = async () => {
    if (!dialog.item) return;
    const action = dialog.action;
    try {
      await api.put(`/api/proveedores/${dialog.item.id_proveedor}/`, {
        ...dialog.item,
        id_estado_prov: action === "activar" ? 1 : 2,
      });
      setAlert({ isOpen: true, message: `Proveedor ${action}do correctamente.` });
      cargar();
    } catch (e) {
      console.error(e);
      // Si el backend manda un mensaje específico, lo mostramos; si no, mensaje genérico
      const apiMsg =
        e?.response?.data?.id_estado_prov?.[0] ||
        e?.response?.data?.detail ||
        `No se pudo ${action} el proveedor.`;
      setAlert({ isOpen: true, message: apiMsg });
    } finally {
      setDialog({ isOpen: false, item: null, action: null });
    }
  };

  const estadoChip = (id, nombre) => {
    const label = nombre ?? (id === 1 ? "Activo" : "Inactivo");
    const isActive = id === 1;
    return <span className={`status-chip ${isActive ? "active" : "inactive"}`}>{label}</span>;
  };

  const norm = (t) => (t ? t.toString().toLowerCase().replace(/\s+/g, "") : "");

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          norm(r.prov_nombre).includes(norm(search)) ||
          norm(r.prov_correo).includes(norm(search)) ||
          norm(r.prov_tel).includes(norm(search))
      ),
    [rows, search]
  );

  // Resetear a página 1 cuando cambia la búsqueda o el total
  useEffect(() => {
    setPage(1);
  }, [search, rows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredRows.length);
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  const gotoPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Proveedores</h2>
        <div className="header-actions">
          <Link to="/proveedores/inactivos" className="btn btn-secondary">
            Ver inactivos
          </Link>
          <Link to="/proveedores/registrar" className="btn btn-primary">
            <FaPlus /> Registrar proveedor
          </Link>
        </div>
      </div>

      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((r) => (
              <tr key={r.id_proveedor}>
                <td>{r.id_proveedor}</td>
                <td>{r.prov_nombre}</td>
                <td>{r.prov_tel || "-"}</td>
                <td>{r.prov_correo || "-"}</td>
                <td>{r.prov_direccion || "-"}</td>
                <td>{estadoChip(r.id_estado_prov, r.estado_nombre)}</td>
                <td className="actions-cell">
                  <Link
                    to={`/proveedores/${r.id_proveedor}/insumos`}
                    className="btn btn-secondary"
                    title="Ver/Vincular insumos"
                  >
                    <FaBoxes /> Insumos
                  </Link>
                  <Link to={`/proveedores/editar/${r.id_proveedor}`} className="btn btn-secondary">
                    <FaEdit /> Editar
                  </Link>
                  <button
                    className={`btn ${r.id_estado_prov === 1 ? "btn-danger" : "btn-success"}`}
                    onClick={() => handleToggleEstado(r)}
                  >
                    {r.id_estado_prov === 1 ? (
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
            {paginatedRows.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-row">
                  No hay proveedores que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación estilo data table */}
        <div className="datatable-footer">
          <span className="datatable-info">
            Mostrando {filteredRows.length === 0 ? 0 : startIndex + 1}–{endIndex} de{" "}
            {filteredRows.length} proveedores
          </span>
          <div className="datatable-pagination">
            <button
              className="page-btn"
              onClick={() => gotoPage(1)}
              disabled={page === 1}
            >
              {"<<"}
            </button>
            <button
              className="page-btn"
              onClick={() => gotoPage(page - 1)}
              disabled={page === 1}
            >
              {"<"}
            </button>
            <span className="page-indicator">
              Página {page} de {totalPages}
            </span>
            <button
              className="page-btn"
              onClick={() => gotoPage(page + 1)}
              disabled={page === totalPages}
            >
              {">"}
            </button>
            <button
              className="page-btn"
              onClick={() => gotoPage(totalPages)}
              disabled={page === totalPages}
            >
              {">>"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={dialog.isOpen}
        title={`Confirmar ${dialog.action === "activar" ? "Activación" : "Desactivación"}`}
        message={`¿Seguro que querés ${dialog.action} al proveedor "${dialog.item?.prov_nombre}"?`}
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
        .search-bar {
          display: flex; align-items: center; background-color: #3a3a3c;
          border: 1px solid #4a4a4e; border-radius: 8px; padding: 6px 10px;
          margin-bottom: 16px; width: 100%; max-width: 480px;
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
        .actions-cell { display: flex; gap: 8px; flex-wrap: wrap; }
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

        .datatable-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background-color: #1f2933;
          border-top: 1px solid #3a3a3c;
        }
        .datatable-info {
          font-size: 0.875rem;
          color: #d1d5db;
        }
        .datatable-pagination {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .page-btn {
          min-width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #4b5563;
          background-color: #111827;
          color: #e5e7eb;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .page-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .page-indicator {
          font-size: 0.875rem;
          color: #e5e7eb;
        }
      `}</style>
    </DashboardLayout>
  );
}

