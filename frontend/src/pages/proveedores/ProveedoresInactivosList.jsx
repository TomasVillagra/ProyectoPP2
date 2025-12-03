import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";

import ProveedoresInactivosHeader from "../../components/proveedores/ProveedoresInactivosHeader";
import ProveedoresInactivosSearch from "../../components/proveedores/ProveedoresInactivosSearch";
import ProveedoresInactivosTable from "../../components/proveedores/ProveedoresInactivosTable";

import "./ProveedoresInactivosList.css";

export default function ProveedoresInactivosList() {
  const [rows, setRows] = useState([]);
  const [dialog, setDialog] = useState({ isOpen: false, item: null, action: null });
  const [alert, setAlert] = useState({ isOpen: false, message: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  const cargar = () => {
    api.get("/api/proveedores/").then((res) => {
      const data = Array.isArray(res.data?.results) ? res.data.results : res.data;
      const inactivos = (data || []).filter((r) => Number(r?.id_estado_prov) === 2);
      setRows(inactivos);
    });
  };

  const onConfirmToggleEstado = async () => {
    if (!dialog.item) return;
    try {
      await api.put(`/api/proveedores/${dialog.item.id_proveedor}/`, {
        ...dialog.item,
        id_estado_prov: 1,
      });
      setAlert({ isOpen: true, message: `Proveedor activado correctamente.` });
      cargar();
    } catch (e) {
      console.error(e);
      setAlert({ isOpen: true, message: `No se pudo activar el proveedor.` });
    } finally {
      setDialog({ isOpen: false, item: null, action: null });
    }
  };

  const handleActivate = (prov) => {
    setDialog({ isOpen: true, item: prov, action: "activar" });
  };

  const norm = (t) => (t ? t.toString().toLowerCase().replace(/\s+/g, "") : "");
  const filteredRows = rows.filter(
    (r) =>
      norm(r.prov_nombre).includes(norm(search)) ||
      norm(r.prov_correo).includes(norm(search)) ||
      norm(r.prov_tel).includes(norm(search))
  );

  return (
    <DashboardLayout>
      <div className="prov-inactivos-container">
        <ProveedoresInactivosHeader />

        <ProveedoresInactivosSearch search={search} setSearch={setSearch} />

        <ProveedoresInactivosTable
          filteredRows={filteredRows}
          handleActivate={handleActivate}
        />
      </div>

      <ConfirmDialog
        open={dialog.isOpen}
        title="Confirmar Activación"
        message={`¿Seguro que querés activar al proveedor "${dialog.item?.prov_nombre}"?`}
        onConfirm={onConfirmToggleEstado}
        onCancel={() => setDialog({ isOpen: false, item: null, action: null })}
      />

      <AlertDialog
        open={alert.isOpen}
        title="Notificación"
        message={alert.message}
        onClose={() => setAlert({ isOpen: false, message: "" })}
      />
    </DashboardLayout>
  );
}

