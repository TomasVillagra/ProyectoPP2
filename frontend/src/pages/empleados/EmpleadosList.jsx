import { useEffect, useState, useMemo } from "react";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";

import EmpleadosHeader from "../../components/empleados/EmpleadosHeader";
import EmpleadosTable from "../../components/empleados/EmpleadosTable";
import EmpleadosPagination from "../../components/empleados/EmpleadosPagination";

// ✅ CSS local (NO global)
import "./EmpleadosList.css";

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

  // 🔹 Paginación (sin filtro de búsqueda)
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
      {/* ✅ Scope para que el CSS no sea global */}
      <div className="empleados-list-scope">
        <EmpleadosHeader />

        <div className="table-container">
          <EmpleadosTable
            paginatedRows={paginatedRows}
            estadoChip={estadoChip}
            cargoPill={cargoPill}
            onToggleEstado={handleToggleEstado}
          />

          <EmpleadosPagination
            totalRows={totalRows}
            startIndex={startIndex}
            endIndex={endIndex}
            page={page}
            totalPages={totalPages}
            gotoPage={gotoPage}
          />
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
      </div>
    </DashboardLayout>
  );
}

