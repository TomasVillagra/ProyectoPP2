import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";
import InventarioInactivosTable from "../../components/insumos/InventarioInactivosTable";

// ✅ CSS propio de la página (no global)
import "./InventarioInactivosList.css";

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
    return Number(num).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Búsqueda que ignora mayúsculas y espacios
  const normalize = (txt) =>
    txt ? txt.toString().toLowerCase().replace(/\s+/g, "") : "";
  const filteredRows = rows.filter((r) =>
    normalize(r.ins_nombre).includes(normalize(search))
  );

  return (
    <DashboardLayout>
      {/* ✅ Scope para que el CSS no sea global */}
      <div className="inventario-inactivos-scope">
        <InventarioInactivosTable
          rows={filteredRows}
          search={search}
          onSearchChange={setSearch}
          formatNumber={formatNumber}
          onActivate={handleActivate}
        />

        <ConfirmDialog
          open={dialog.isOpen}
          title="Confirmar Activación"
          message={`¿Seguro que querés activar el insumo "${dialog.item?.ins_nombre}"?`}
          onConfirm={onConfirmToggleEstado}
          onCancel={() =>
            setDialog({ isOpen: false, item: null, action: null })
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


