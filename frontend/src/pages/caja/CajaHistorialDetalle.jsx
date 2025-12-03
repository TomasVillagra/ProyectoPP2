import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";

import CajaHistDetalleHeader from "../../components/caja/CajaHistDetalleHeader";
import CajaHistDetalleResumenCard from "../../components/caja/CajaHistDetalleResumenCard";
import CajaHistDetalleMetodosCard from "../../components/caja/CajaHistDetalleMetodosCard";
import CajaHistDetalleMovimientosCard from "../../components/caja/CajaHistDetalleMovimientosCard";

import "./CajaHistorialDetalle.css";

const api = apiNamed || apiDefault;

// Helpers
const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

function fmtDateTime(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) {
      return String(dt).replace("T", " ").slice(0, 19);
    }
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function CajaHistorialDetalle() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      setError("");

      // misma URL que tenías
      const res = await api.get(`/api/caja/historial/${id}/`);
      setDetalle(res.data);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el detalle de la caja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  // Empleados
  const empApertura =
    detalle?.apertura_empleado_nombre ??
    detalle?.empleado_apertura ??
    detalle?.emp_apertura ??
    detalle?.apertura_empleado ??
    "-";

  const empCierre =
    detalle?.cierre_empleado_nombre ??
    detalle?.empleado_cierre ??
    detalle?.emp_cierre ??
    detalle?.cierre_empleado ??
    "-";

  // Resumen por método
  const resumenMap = new Map();

  (detalle?.por_metodo_ingresos || []).forEach((m) => {
    const nombre =
      m.metodo ||
      m.metpag_nombre ||
      m.metpago_nombre ||
      m.nombre ||
      "Sin método";
    const key = String(nombre);
    if (!resumenMap.has(key)) {
      resumenMap.set(key, { metodo: key, ingresos: 0, egresos: 0 });
    }
    const item = resumenMap.get(key);
    item.ingresos += Number(m.monto || 0);
  });

  (detalle?.por_metodo_egresos || []).forEach((m) => {
    const nombre =
      m.metodo ||
      m.metpag_nombre ||
      m.metpago_nombre ||
      m.nombre ||
      "Sin método";
    const key = String(nombre);
    if (!resumenMap.has(key)) {
      resumenMap.set(key, { metodo: key, ingresos: 0, egresos: 0 });
    }
    const item = resumenMap.get(key);
    item.egresos += Number(m.monto || 0);
  });

  const resumenMetodos = Array.from(resumenMap.values()).map((r) => ({
    ...r,
    neto: r.ingresos - r.egresos,
  }));

  const totalIngresosMetodos = resumenMetodos.reduce(
    (acc, r) => acc + r.ingresos,
    0
  );
  const totalEgresosMetodos = resumenMetodos.reduce(
    (acc, r) => acc + r.egresos,
    0
  );
  const totalNetoMetodos = totalIngresosMetodos - totalEgresosMetodos;

  // Movimientos individuales
  const movimientos =
    detalle?.movimientos ||
    detalle?.movimientos_caja ||
    detalle?.detalle ||
    [];

  return (
    <DashboardLayout>
      {/* ✅ Scope CSS para que no sea global */}
      <div className="caja-hist-detalle-scope">
        <CajaHistDetalleHeader id={id} />

        {error && <p className="caja-hist-msg">{error}</p>}
        {loading && <p>Cargando detalle...</p>}

        {!loading && detalle && (
          <>
            <CajaHistDetalleResumenCard
              detalle={detalle}
              empApertura={empApertura}
              empCierre={empCierre}
              money={money}
              fmtDateTime={fmtDateTime}
            />

            <CajaHistDetalleMetodosCard
              resumenMetodos={resumenMetodos}
              totalIngresosMetodos={totalIngresosMetodos}
              totalEgresosMetodos={totalEgresosMetodos}
              totalNetoMetodos={totalNetoMetodos}
              money={money}
            />

            <CajaHistDetalleMovimientosCard
              movimientos={movimientos}
              fmtDateTime={fmtDateTime}
              money={money}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

