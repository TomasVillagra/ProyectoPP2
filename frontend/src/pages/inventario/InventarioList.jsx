import { useEffect, useState, useRef } from "react";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";

import InventarioHeader from "../../components/insumos/InventarioHeader";
import InventarioToolbar from "../../components/insumos/InventarioToolbar";
import InventarioTable from "../../components/insumos/InventarioTable";
import InventarioPagination from "../../components/insumos/InventarioPagination";

// ✅ CSS local de la página (no global)
import "./InventarioList.css";

export default function InventarioList() {
  const [rows, setRows] = useState([]);
  const [dialog, setDialog] = useState({ isOpen: false, item: null, action: null });
  const [alert, setAlert] = useState({ isOpen: false, message: "" });
  const [search, setSearch] = useState("");

  const [filterMode, setFilterMode] = useState("todos"); // "todos" | "criticos"

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
      const activos = (data || []).filter((r) => Number(r?.id_estado_insumo) === 1);
      setRows(activos);
      setCurrentPage(1);
    });
  };

  const insumoEstaEnRecetas = async (insumo) => {
    const id = insumo.id_insumo;
    if (!id) return false;

    try {
      const res = await api.get(`/api/detalle-recetas/`, {
        params: { id_insumo: id, page_size: 1 },
      });

      const dataRaw = Array.isArray(res.data?.results)
        ? res.data.results
        : res.data;
      const lista = Array.isArray(dataRaw) ? dataRaw : [];

      return lista.some(
        (d) =>
          Number(d.id_insumo) === Number(id) ||
          Number(d.id_insumo_id) === Number(id)
      );
    } catch (e) {
      console.error("Error consultando detalle-recetas", e);
      return false;
    }
  };

  const handleToggleEstado = async (insumo) => {
    const isActivating = insumo.id_estado_insumo !== 1;

    if (!isActivating) {
      const usado = await insumoEstaEnRecetas(insumo);
      if (usado) {
        setAlert({
          isOpen: true,
          message: `No se puede desactivar el insumo "${insumo.ins_nombre}" porque está asociado a una o más recetas de platos.`,
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
    return (
      <span className={`status-chip ${isActive ? "active" : "inactive"}`}>
        {label}
      </span>
    );
  };

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

  const criticos = rows.filter(esCritico);

  const normalizar = (txt) =>
    txt ? txt.toString().toLowerCase().replace(/\s+/g, "") : "";

  const baseFiltered = rows.filter((r) =>
    normalizar(r.ins_nombre).includes(normalizar(search))
  );

  const filteredRows =
    filterMode === "criticos" ? baseFiltered.filter(esCritico) : baseFiltered;

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

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      {/* ✅ Scope para que el CSS no sea global */}
      <div className="inventario-list-scope">
        <InventarioHeader
          criticos={criticos}
          critOpen={critOpen}
          onToggleCritOpen={() => setCritOpen((v) => !v)}
          formatNumber={formatNumber}
          dropdownRef={dropdownRef}
        />

        <InventarioToolbar
          search={search}
          onSearchChange={handleSearchChange}
          filterMode={filterMode}
          onFilterChange={handleChangeFilter}
        />

        <InventarioTable
          pageRows={pageRows}
          formatNumber={formatNumber}
          estadoChip={estadoChip}
          onToggleEstado={handleToggleEstado}
        />

        {totalItems > 0 && (
          <InventarioPagination
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            currentPage={currentPage}
            totalPages={totalPages}
            goToPage={goToPage}
          />
        )}

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
      </div>
    </DashboardLayout>
  );
}





