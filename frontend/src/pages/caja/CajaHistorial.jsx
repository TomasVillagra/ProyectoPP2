import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";

import CajaHistorialHeader from "../../components/caja/CajaHistorialHeader";
import CajaHistorialTable from "../../components/caja/CajaHistorialTable";
import CajaHistorialPagination from "../../components/caja/CajaHistorialPagination";

import "./CajaHistorial.css";

const api = apiNamed || apiDefault;

// Helpers (IGUALES a tu archivo original)
const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

function splitDateTime(dt) {
  if (!dt) return { fecha: "-", hora: "-" };
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) {
      // Por si viene como string "2025-11-18T10:23:45"
      const s = String(dt).replace("T", " ").slice(0, 19);
      const [fecha, hora] = s.split(" ");
      return { fecha: fecha || "-", hora: hora || "-" };
    }
    return {
      fecha: d.toLocaleDateString(),
      hora: d.toLocaleTimeString(),
    };
  } catch {
    return { fecha: String(dt), hora: "-" };
  }
}

export default function CajaHistorial() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historial, setHistorial] = useState([]); // lista de cierres

  // PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/caja/historial/");
      const data = Array.isArray(res.data) ? res.data : [];
      setHistorial(data);
      setCurrentPage(1); // resetea a la primera página al recargar
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el historial de caja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // Cálculos de paginación
  const totalItems = historial.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedHistorial = historial.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      {/* ✅ Scope para que el CSS no sea global */}
      <div className="caja-historial-scope">
        <CajaHistorialHeader
          loading={loading}
          onRefresh={cargarHistorial}
        />

        {error && (
          <p className="caja-hist-error">{error}</p>
        )}

        {loading && <p>Cargando historial...</p>}

        {!loading && historial.length === 0 && !error && (
          <p style={{ marginTop: 8 }}>
            Todavía no hay cierres registrados.
          </p>
        )}

        {!loading && historial.length > 0 && (
          <>
            <CajaHistorialTable
              paginatedHistorial={paginatedHistorial}
              startIndex={startIndex}
              money={money}
              splitDateTime={splitDateTime}
            />

            <CajaHistorialPagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
              goToPage={goToPage}
              loading={loading}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}





