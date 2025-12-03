// src/pages/Home.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import { FaClock, FaExclamationTriangle, FaStore } from "react-icons/fa";

import StatCard from "../components/home/StatCard";
import SalesSummary from "../components/home/SalesSummary";
import WeeklySalesChart from "../components/home/WeeklySalesChart";

import {
  toNum,
  esCritico,
  fetchAllInsumos,
  normalizeList,
  esEnProceso,
} from "../utils/dashboardUtils";

import "./Home.css";

export default function Home() {
  // eslint-disable-next-line no-unused-vars
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState({
    ventas_hoy: 0,
    pedidos: 0,
    stock_bajo: 0,
  });
  const [cajaEstado, setCajaEstado] = useState(null);
  const [metodosHoy, setMetodosHoy] = useState([]); // ingresos por método de hoy
  const [weekly, setWeekly] = useState([]); // datos históricos por día

  useEffect(() => {
    (async () => {
      // ─────────────────────────────────────────────────────────
      // 1) Usuario actual
      // ─────────────────────────────────────────────────────────
      try {
        const meRes = await api.get("/api/auth/me/");
        let userData = meRes.data;
        try {
          const empRes = await api.get(
            `/api/empleados/?username=${userData.username}`
          );
          const list = Array.isArray(empRes.data?.results)
            ? empRes.data.results
            : Array.isArray(empRes.data)
            ? empRes.data
            : [];
          const match = list.find(
            (e) =>
              e.emp_nombre?.toLowerCase() ===
              userData.username?.toLowerCase()
          );
          if (match) userData = { ...userData, cargo_nombre: match.cargo_nombre };
        } catch {}
        setMe(userData);
      } catch {}

      // ─────────────────────────────────────────────────────────
      // 2) Summary (fallback, por si algo falla)
      // ─────────────────────────────────────────────────────────
      try {
        const s = await api.get("/api/dashboard/summary/");
        const srv = s.data || {};
        setStats((prev) => ({
          ventas_hoy: toNum(srv.ventas_hoy) || prev.ventas_hoy || 0,
          pedidos: toNum(srv.pedidos) || prev.pedidos || 0,
          stock_bajo: toNum(srv.stock_bajo) || prev.stock_bajo || 0,
        }));
      } catch (e) {
        // 404 u otro error: seguimos sin romper el flujo
      }

      // ─────────────────────────────────────────────────────────
      // 3) Estado de caja actual (abierta/cerrada + ventas del día + métodos)
      // ─────────────────────────────────────────────────────────
      try {
        const resCaja = await api.get("/api/caja/estado/");
        const ce = resCaja.data ?? resCaja ?? null;
        setCajaEstado(ce);

        const ingresosHoy = toNum(ce?.hoy_ingresos) || 0;
        setStats((prev) => ({ ...prev, ventas_hoy: ingresosHoy }));

        // Usamos el arreglo que arma la view: "totales_metodo"
        let arrMetodos = Array.isArray(ce?.totales_metodo)
          ? ce.totales_metodo
          : [];

        // 🔹 Ajuste front-end: restar el monto de apertura del método EFECTIVO
        // para que el gráfico NO cuente la apertura como venta.
        const aperturaMonto = toNum(ce?.apertura_monto) || 0;
        if (aperturaMonto > 0 && arrMetodos.length > 0) {
          // clonamos para no mutar referencias originales
          arrMetodos = arrMetodos.map((m) => ({ ...m }));
          const idxEfectivo = arrMetodos.findIndex((m) => {
            const id = m.id_metodo_pago ?? m.id;
            const nombre = (
              m.nombre ||
              m.metodo_pago_nombre ||
              m.metpag_nombre ||
              ""
            )
              .toString()
              .toLowerCase();
            return id === 1 || nombre.includes("efectivo");
          });

          if (idxEfectivo !== -1) {
            const m = arrMetodos[idxEfectivo];
            const bruto = toNum(
              m.ingresos ?? m.total ?? m.saldo ?? m.monto ?? 0
            );
            const neto = bruto - aperturaMonto;
            const limpio = neto > 0 ? neto : 0;

            if (Object.prototype.hasOwnProperty.call(m, "ingresos")) {
              m.ingresos = limpio;
            } else if (Object.prototype.hasOwnProperty.call(m, "total")) {
              m.total = limpio;
            } else {
              m.monto = limpio;
            }
          }
        }

        setMetodosHoy(arrMetodos);
      } catch (e) {
        console.error("Error obteniendo estado de caja:", e);
      }

      // ─────────────────────────────────────────────────────────
      // 4) Pedidos "En proceso" (pendientes reales)
      // ─────────────────────────────────────────────────────────
      try {
        const resPed = await api.get("/api/pedidos/");
        const lista = normalizeList(resPed);
        const enProcesoCount = lista.filter(esEnProceso).length;
        setStats((prev) => ({ ...prev, pedidos: enProcesoCount }));
      } catch (e) {
        // Si falla, se queda con el valor del summary (si lo hubo)
      }

      // ─────────────────────────────────────────────────────────
      // 5) Cálculo REAL de insumos críticos
      // ─────────────────────────────────────────────────────────
      try {
        const insumos = await fetchAllInsumos(api);
        const criticosReales = insumos.filter(esCritico).length;
        setStats((prev) => ({ ...prev, stock_bajo: criticosReales }));
      } catch (e) {
        // Si falla, nos quedamos con lo que haya en stats (quizás del summary)
      }

      // ─────────────────────────────────────────────────────────
      // 6) Ingresos históricos por día (toda la base)
      // ─────────────────────────────────────────────────────────
      try {
        const r = await api.get("/api/caja/ingresos-historicos/");
        const dias = Array.isArray(r.data?.dias) ? r.data.dias : [];
        setWeekly(dias);
      } catch (e) {
        console.error("Error obteniendo ingresos históricos:", e);
      }
    })();
  }, []);

  const cajaAbierta = !!(cajaEstado && cajaEstado.abierta === true);

  return (
    <DashboardLayout>
      <div className="dashboard-page-dark">
        <section className="stat-cards-container">
          {/* Pedidos pendientes = pedidos con estado "En proceso" */}
          <StatCard
            icon={<FaClock />}
            value={stats.pedidos}
            title="Pedidos pendientes"
          />

          {/* Clic a /inventario, sin filtros */}
          <Link to="/inventario" className="stat-link">
            <StatCard
              icon={<FaExclamationTriangle />}
              value={stats.stock_bajo}
              title="Insumos críticos"
            />
          </Link>

          {/* Estado real de caja (Abierta / Cerrada) */}
          <StatCard
            icon={<FaStore />}
            value={cajaAbierta ? "Abierta" : "Cerrada"}
            title="Estado de caja"
          />
        </section>

        <section className="dashboard-main-content">
          <SalesSummary ventasHoy={stats.ventas_hoy} metodosHoy={metodosHoy} />
          <WeeklySalesChart data={weekly} />
        </section>
      </div>
    </DashboardLayout>
  );
}











