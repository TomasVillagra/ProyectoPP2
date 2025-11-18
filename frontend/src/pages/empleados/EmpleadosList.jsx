import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";
import { FaEdit, FaLock, FaLockOpen, FaPlus } from "react-icons/fa";

export default function EmpleadosList() {
  const [empleados, setEmpleados] = useState([]);
  const [dialog, setDialog] = useState({
    isOpen: false,
    employee: null,
    action: null,
  });
  const [alert, setAlert] = useState({ isOpen: false, message: "" });

  // 🔹 paginación
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = () => {
    api.get("/api/empleados/").then((res) => {
      const data = Array.isArray(res.data?.results)
        ? res.data.results
        : res.data;
      setEmpleados(Array.isArray(data) ? data : []);
      setPage(1); // reset a la primera página al recargar
    });
  };

  const handleToggleEstado = (empleado) => {
    const isActivating = empleado.id_estado_empleado !== 1;
    setDialog({
      isOpen: true,
      employee: empleado,
      action: isActivating ? "activar" : "desactivar",
    });
  };

  const onConfirmToggleEstado = async () => {
    if (!dialog.employee) return;
    const action = dialog.action;

    try {
      await api.put(`/api/empleados/${dialog.employee.id_empleado}/`, {
        ...dialog.employee,
        id_estado_empleado: action === "activar" ? 1 : 2,
      });
      setAlert({
        isOpen: true,
        message: `Empleado ${action}do correctamente.`,
      });
      cargarEmpleados();
    } catch (err) {
      console.error(err);
      setAlert({
        isOpen: true,
        message: `Error al ${action} el empleado.`,
      });
    } finally {
      setDialog({ isOpen: false, employee: null, action: null });
    }
  };

  const estadoChip = (id, nombre) => {
    const label = nombre ?? (id === 1 ? "Activo" : "Inactivo");
    const isActive = id === 1;
    return (
      <span className={`status-chip ${isActive ? "active" : "inactive"}`}>
        {label}
      </span>
    );
  };

  const cargoPill = (nombre) => (
    <span className="cargo-pill">{nombre ?? "-"}</span>
  );

  // 🔹 Paginación (no hay filtro de búsqueda, así que usamos la lista completa)
  const totalRows = empleados.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return empleados.slice(startIndex, endIndex);
  }, [empleados, page]);

  const startIndex = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIndex = Math.min(page * rowsPerPage, totalRows);

  const gotoPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Empleados</h2>
        <Link to="/empleados/registrar" className="btn btn-primary">
          <FaPlus /> Registrar empleado
        </Link>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Cargo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((e) => (
              <tr key={e.id_empleado}>
                <td>{e.id_empleado}</td>
                <td>{e.emp_nombre}</td>
                <td>{e.emp_apellido}</td>
                <td>{cargoPill(e.cargo_nombre)}</td>
                <td>
                  {estadoChip(e.id_estado_empleado, e.estado_nombre)}
                </td>
                <td className="actions-cell">
                  <Link
                    to={`/empleados/editar/${e.id_empleado}`}
                    className="btn btn-secondary"
                  >
                    <FaEdit /> Editar
                  </Link>
                  <button
                    className={`btn ${
                      e.id_estado_empleado === 1
                        ? "btn-danger"
                        : "btn-success"
                    }`}
                    onClick={() => handleToggleEstado(e)}
                  >
                    {e.id_estado_empleado === 1 ? (
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
                <td colSpan={6} className="empty-row">
                  No hay empleados cargados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer de la data table con info y paginación */}
        <div className="datatable-footer">
          <span className="datatable-info">
            Mostrando{" "}
            {totalRows === 0
              ? "0"
              : `${startIndex}–${endIndex}`}{" "}
            de {totalRows} empleados
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
        title={`Confirmar ${
          dialog.action === "activar" ? "Activación" : "Desactivación"
        }`}
        message={`¿Seguro que querés ${dialog.action} a ${
          dialog.employee?.emp_nombre
        } ${dialog.employee?.emp_apellido}?`}
        onConfirm={onConfirmToggleEstado}
        onCancel={() =>
          setDialog({ isOpen: false, employee: null, action: null })
        }
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
          margin-bottom: 24px;
        }
        .page-header h2 {
          margin: 0;
          font-size: 1.75rem;
          color: #fff;
        }
        .table-container {
          background-color: #2c2c2e;
          border: 1px solid #3a3a3c;
          border-radius: 12px;
          overflow: hidden;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        .table th,
        .table td {
          padding: 14px 18px;
          text-align: left;
          border-bottom: 1px solid #3a3a3c;
        }
        .table th {
          background-color: #3a3a3c;
          color: #d1d5db;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
        }
        .table td {
          color: #eaeaea;
        }
        .table tbody tr:last-child td {
          border-bottom: none;
        }
        .actions-cell {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .empty-row {
          text-align: center;
          color: #a0a0a0;
          padding: 32px;
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
        .cargo-pill {
          background: rgba(59, 130, 246, .12);
          color: #93c5fd;
          border: 1px solid rgba(59, 130, 246, .35);
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
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
        }
        .btn-primary {
          background-color: #facc15;
          color: #111827;
        }
        .btn-primary:hover {
          background-color: #eab308;
        }
        .btn-secondary {
          background-color: #3a3a3c;
          color: #eaeaea;
        }
        .btn-secondary:hover {
          background-color: #4a4a4e;
        }
        .btn-danger {
          background-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .btn-danger:hover {
          background-color: rgba(239, 68, 68, 0.3);
        }
        .btn-success {
          background-color: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }
        .btn-success:hover {
          background-color: rgba(34, 197, 94, 0.3);
        }
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
