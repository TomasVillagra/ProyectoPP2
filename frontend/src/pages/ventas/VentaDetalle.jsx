// src/pages/ventas/VentaDetalle.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../api/axios";

import VentaDetalleHeader from "../../components/ventas/VentaDetalleHeader";
import VentaDetalleInfo from "../../components/ventas/VentaDetalleInfo";
import VentaDetalleTable from "../../components/ventas/VentaDetalleTable";

import "./VentaDetalle.css";

/* ---------------------------
   Helpers
--------------------------- */
function normalize(resp) {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}
const money = (n) => {
  const x = Number(n);
  return (Number.isFinite(x) ? x : 0).toFixed(2);
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

async function fetchVenta(id) {
  const candidates = [`/api/ventas/${id}/`, `/api/venta/${id}/`];
  for (const u of candidates) {
    try {
      const res = await api.get(u);
      if (res?.data) return res.data;
    } catch {}
  }
  return null;
}
async function fetchDetalles(id_venta) {
  const candidates = [
    `/api/detalle-ventas/?id_venta=${id_venta}`,
    `/api/detalles-venta/?id_venta=${id_venta}`,
    `/api/ventas/${id_venta}/detalles/`,
  ];
  for (const u of candidates) {
    try {
      const res = await api.get(u);
      const list = normalize(res);
      if (Array.isArray(list)) return list;
    } catch {}
  }
  return [];
}
async function fetchPlato(platoId) {
  const candidates = [
    `/api/platos/${platoId}/`,
    `/api/plato/${platoId}/`,
    `/api/platos?id=${platoId}`,
  ];
  for (const url of candidates) {
    try {
      const { data } = await api.get(url);
      if (data) return Array.isArray(data) ? data[0] : data;
    } catch {}
  }
  return null;
}
const readPlatoNombre = (p, fallback = "") =>
  p?.plt_nombre ??
  p?.nombre ??
  (fallback || `#${p?.id_plato ?? p?.id ?? ""}`);

// 🔹 catálogo de estados de venta
async function fetchEstadosVenta() {
  const urls = [
    "/api/estado-ventas/",
    "/api/estado_ventas/",
    "/api/estados-venta/",
    "/api/estadosventa/",
  ];
  for (const u of urls) {
    try {
      const res = await api.get(u);
      const list = normalize(res);
      if (Array.isArray(list)) return list;
    } catch {}
  }
  return [];
}

/* ---------------------------
   Página
--------------------------- */
export default function VentaDetalle() {
  const { id } = useParams();

  const [venta, setVenta] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [platosCache, setPlatosCache] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [estadosVenta, setEstadosVenta] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const v = await fetchVenta(id);
        if (!v) {
          setMsg("No se encontró la venta.");
          setLoading(false);
          return;
        }

        const ests = await fetchEstadosVenta();
        setEstadosVenta(ests);

        setVenta(v);

        const dets = await fetchDetalles(v.id_venta ?? v.id ?? id);
        setDetalles(dets);

        const cache = new Map();
        await Promise.all(
          dets.map(async (d) => {
            const pid = Number(d.id_plato ?? d.plato ?? d.id);
            if (!pid || cache.has(pid)) return;
            const p = await fetchPlato(pid);
            cache.set(pid, p);
          })
        );
        setPlatosCache(cache);
      } catch (e) {
        setMsg("No se pudieron cargar los datos de la venta.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalCalculado = useMemo(
    () =>
      detalles.reduce((acc, d) => {
        const cant = Number(d.detven_cantidad ?? d.cantidad ?? 0);
        const unit = Number(d.detven_precio_uni ?? d.precio_unitario ?? 0);
        const sub = Number(d.detven_subtotal ?? d.subtotal ?? unit * cant);
        const add = Number.isFinite(sub) ? sub : 0;
        return acc + add;
      }, 0),
    [detalles]
  );

  const venMonto = Number(venta?.ven_monto ?? venta?.monto ?? 0);
  const totalOK = Math.abs(venMonto - totalCalculado) < 0.01;

  const clienteStr =
    venta?.cliente_nombre ??
    venta?.cli_nombre ??
    (venta?.id_cliente != null ? `#${venta?.id_cliente}` : "-");

  const empleadoStr =
    venta?.empleado_nombre ??
    venta?.emp_nombre ??
    (venta?.id_empleado != null ? `#${venta?.id_empleado}` : "-");

  const estadoStr = (() => {
    const nombreDirecto =
      venta?.estado_nombre ??
      venta?.estven_nombre ??
      null;
    if (nombreDirecto) return nombreDirecto;

    if (venta?.id_estado_venta && typeof venta.id_estado_venta === "object") {
      return (
        venta.id_estado_venta.estven_nombre ??
        venta.id_estado_venta.nombre ??
        "-"
      );
    }

    const idEst = venta?.id_estado_venta;
    if (idEst && estadosVenta.length > 0) {
      const encontrado = estadosVenta.find(
        (e) =>
          String(e.id_estado_venta ?? e.id) === String(idEst)
      );
      if (encontrado) {
        return (
          encontrado.estven_nombre ??
          encontrado.nombre ??
          "-"
        );
      }
    }

    return "-";
  })();

  return (
    <DashboardLayout>
      <VentaDetalleHeader id={venta?.id_venta ?? venta?.id ?? id} />

      {loading && <p>Cargando...</p>}
      {msg && (
        <p style={{ color: "#facc15", whiteSpace: "pre-wrap" }}>{msg}</p>
      )}

      {!loading && venta && (
        <>
          <VentaDetalleInfo
            venta={venta}
            fmtDate={fmtDate}
            clienteStr={clienteStr}
            empleadoStr={empleadoStr}
            estadoStr={estadoStr}
            totalOK={totalOK}
            money={money}
            totalCalculado={totalCalculado}
          />

          <VentaDetalleTable
            detalles={detalles}
            platosCache={platosCache}
            readPlatoNombre={readPlatoNombre}
            money={money}
          />
        </>
      )}
    </DashboardLayout>
  );
}



