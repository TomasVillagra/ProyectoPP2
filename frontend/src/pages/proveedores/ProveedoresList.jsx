import { useEffect, useState, useMemo } from "react";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";

import ProveedoresListHeader from "../../components/proveedores/ProveedoresListHeader";
import ProveedoresListSearch from "../../components/proveedores/ProveedoresListSearch";
import ProveedoresListFilters from "../../components/proveedores/ProveedoresListFilters";
import ProveedoresListTable from "../../components/proveedores/ProveedoresListTable";
import ProveedoresListPagination from "../../components/proveedores/ProveedoresListPagination";

import "./ProveedoresList.css";

export default function ProveedoresList() {
  const [rows, setRows] = useState([]);
  const [dialog, setDialog] = useState({
    isOpen: false,
    item: null,
    action: null,
  });
  const [alert, setAlert] = useState({ isOpen: false, message: "" });
  const [search, setSearch] = useState("");

  const [categorias, setCategorias] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  // paginación
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    cargar();
  }, []);

  const cargar = () => {
    // Proveedores
    api.get("/api/proveedores/").then((res) => {
      const data = Array.isArray(res.data?.results)
        ? res.data.results
        : res.data;
      const activos =
        (data || []).filter(
          (r) => Number(r?.id_estado_prov) === 1
        ) ?? [];
      setRows(activos);
      setPage(1);
    });

    // Categorías de proveedor
    api
      .get("/api/categorias-proveedor/")
      .then((res) => {
        const data = Array.isArray(res.data?.results)
          ? res.data.results
          : res.data;
        setCategorias(data || []);
      })
      .catch((err) => {
        console.error(
          "Error cargando categorías de proveedor:",
          err
        );
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
      setAlert({
        isOpen: true,
        message: `Proveedor ${action}do correctamente.`,
      });
      cargar();
    } catch (e) {
      console.error(e);
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
    return (
      <span
        className={`prov-list-status-chip ${
          isActive
            ? "prov-list-status-active"
            : "prov-list-status-inactive"
        }`}
      >
        {label}
      </span>
    );
  };

  const norm = (t) =>
    t ? t.toString().toLowerCase().replace(/\s+/g, "") : "";

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        const matchesText =
          norm(r.prov_nombre).includes(norm(search)) ||
          norm(r.prov_correo).includes(norm(search)) ||
          norm(r.prov_tel).includes(norm(search));

        const matchesCategoria =
          !categoriaFiltro ||
          String(r.id_categoria_prov) ===
            String(categoriaFiltro);

        return matchesText && matchesCategoria;
      }),
    [rows, search, categoriaFiltro]
  );

  useEffect(() => {
    setPage(1);
  }, [search, categoriaFiltro, rows.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / rowsPerPage)
  );
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(
    startIndex + rowsPerPage,
    filteredRows.length
  );
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  const gotoPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <DashboardLayout>
      <div className="prov-list-container">
        <ProveedoresListHeader />

        <ProveedoresListSearch
          search={search}
          setSearch={setSearch}
        />

        <ProveedoresListFilters
          categorias={categorias}
          categoriaFiltro={categoriaFiltro}
          setCategoriaFiltro={setCategoriaFiltro}
        />

        <div className="prov-list-table-container">
          <ProveedoresListTable
            rows={paginatedRows}
            estadoChip={estadoChip}
            handleToggleEstado={handleToggleEstado}
          />

          <ProveedoresListPagination
            filteredCount={filteredRows.length}
            startIndex={startIndex}
            endIndex={endIndex}
            page={page}
            totalPages={totalPages}
            gotoPage={gotoPage}
          />
        </div>
      </div>

      <ConfirmDialog
        open={dialog.isOpen}
        title={`Confirmar ${
          dialog.action === "activar"
            ? "Activación"
            : "Desactivación"
        }`}
        message={`¿Seguro que querés ${dialog.action} al proveedor "${dialog.item?.prov_nombre}"?`}
        onConfirm={onConfirmToggleEstado}
        onCancel={() =>
          setDialog({ isOpen: false, item: null, action: null })
        }
      />
      <AlertDialog
        open={alert.isOpen}
        title="Notificación"
        message={alert.message}
        onClose={() =>
          setAlert({ isOpen: false, message: "" })
        }
      />
    </DashboardLayout>
  );
}



