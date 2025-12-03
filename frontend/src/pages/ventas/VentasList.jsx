// src/pages/ventas/VentasList.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import VentasHeader from "../../components/ventas/VentasHeader";
import VentasFilters from "../../components/ventas/VentasFilters";
import VentasTable from "../../components/ventas/VentasTable";
import VentasPagination from "../../components/ventas/VentasPagination";

import "./VentasList.css";

function normAny(resp) {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

const clean = (s) => String(s || "").trim().toLowerCase();
const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

function fmtDate(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return String(dt).replace("T", " ").slice(0, 19);
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function VentasList() {
  const [ventas, setVentas] = useState([]);
  const [estadosVenta, setEstadosVenta] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  // filtros + paginación
  const [fEstado, setFEstado] = useState(""); // "" | "pendiente" | "cobrado"
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchEstadosVenta = async () => {
    const candidates = [
      "/api/estado-ventas/",
      "/api/estado_ventas/",
      "/api/estados-venta/",
      "/api/estadosventa/",
    ];
    for (const url of candidates) {
      try {
        const res = await api.get(url);
        const list = normAny(res);
        if (Array.isArray(list)) {
          setEstadosVenta(list);
          return;
        }
      } catch {}
    }
    setEstadosVenta([]);
  };

  const fetchVentas = async () => {
    try {
      const res = await api.get("/api/ventas/");
      setVentas(normAny(res));
    } catch (e) {
      console.error(e);
      setMsg("No se pudieron cargar las ventas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchEstadosVenta();
      await fetchVentas();
    })();
  }, []);

  const getEstadoNombre = (venta) => {
    if (!venta) return "-";

    let nombre =
      venta.estado_nombre ??
      venta.estven_nombre ??
      venta.estado ??
      "";

    if (!nombre && typeof venta.id_estado_venta === "object" && venta.id_estado_venta !== null) {
      nombre =
        venta.id_estado_venta.estven_nombre ??
        venta.id_estado_venta.nombre ??
        "";
    }

    if (!nombre && venta.id_estado_venta != null && estadosVenta.length > 0) {
      const idValor =
        typeof venta.id_estado_venta === "object"
          ? (venta.id_estado_venta.id_estado_venta ?? venta.id_estado_venta.id)
          : venta.id_estado_venta;

      const found = estadosVenta.find(
        (ev) =>
          String(ev.id_estado_venta ?? ev.id) === String(idValor)
      );
      if (found) {
        nombre =
          found.estven_nombre ??
          found.nombre ??
          found.estado ??
          "";
      }
    }

    return nombre || "-";
  };

  const esVentaCobrada = (venta) => {
    const n = clean(getEstadoNombre(venta));
    if (n.includes("cobrad")) return true;
    if (n.includes("pagad")) return true;
    return false;
  };

  const handleComprobante = async (ventaId) => {
    try {
      setMsg("");
      setDownloadingId(ventaId);

      const url = `/api/ventas/${ventaId}/comprobante-pdf/`;

      const res = await api.get(url, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });

      const link = document.createElement("a");
      const href = URL.createObjectURL(blob);
      link.href = href;
      link.download = `comprobante_venta_${ventaId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (e) {
      console.error(e);
      setMsg("No se pudo generar el comprobante PDF de la venta.");
    } finally {
      setDownloadingId(null);
    }
  };

  // FILTRADO por estado
  const filtradas = useMemo(() => {
    return ventas.filter((v) => {
      if (fEstado === "pendiente") return !esVentaCobrada(v);
      if (fEstado === "cobrado") return esVentaCobrada(v);
      return true;
    });
  }, [ventas, fEstado, esVentaCobrada]);

  // RESET de página cuando cambia el filtro o tamaño
  useEffect(() => {
    setPage(1);
  }, [fEstado, pageSize]);

  // PAGINACIÓN
  const totalRows = filtradas.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const paginadas = useMemo(
    () =>
      filtradas.slice((pageSafe - 1) * pageSize, pageSafe * pageSize),
    [filtradas, pageSafe, pageSize]
  );

  return (
    <DashboardLayout>
      <VentasHeader />

      <VentasFilters
        fEstado={fEstado}
        setFEstado={setFEstado}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {msg && <p className="msg">{msg}</p>}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <VentasTable
            rows={paginadas}
            fmtDate={fmtDate}
            money={money}
            getEstadoNombre={getEstadoNombre}
            esVentaCobrada={esVentaCobrada}
            handleComprobante={handleComprobante}
            downloadingId={downloadingId}
          />

          <VentasPagination
            pageSafe={pageSafe}
            totalPages={totalPages}
            setPage={setPage}
          />
        </>
      )}
    </DashboardLayout>
  );
}





