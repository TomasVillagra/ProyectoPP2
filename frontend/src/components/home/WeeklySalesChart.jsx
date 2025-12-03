// src/components/home/WeeklySalesChart.jsx

import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { money, toNum } from "../../utils/dashboardUtils";

const WeeklySalesChart = ({ data }) => {
  const dias = Array.isArray(data) ? data : [];
  const [mode, setMode] = useState("semana"); // 'semana' | 'mes' | 'anio' | 'hist' | 'rango'
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const parseDate = (str) => {
    if (!str || !str.includes("-")) return null;
    const [ys, ms, ds] = str.split("-");
    const y = Number(ys);
    const m = Number(ms);
    const d = Number(ds);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  };

  // Ordenamos por fecha para filtros
  const diasOrdenados = [...dias].sort((a, b) =>
    (a.fecha || "").localeCompare(b.fecha || "")
  );

  // Inicializar selects cuando cambian los datos
  useEffect(() => {
    if (!diasOrdenados.length) return;
    const first = diasOrdenados[0]?.fecha || "";
    const last = diasOrdenados[diasOrdenados.length - 1]?.fecha || "";
    setRangeFrom(first);
    setRangeTo(last);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Construir dataset según modo
  let chartLabel = "Ventas";
  let chartSeries = [];
  let categories = [];

  if (!diasOrdenados.length) {
    return (
      <div className="widget-card">
        <div className="widget-header">
          <h3 className="widget-title">Ventas</h3>
          <div className="chart-filters">
            <button className="chart-filter active">Semana</button>
            <button className="chart-filter">Mes</button>
            <button className="chart-filter">Año</button>
            <button className="chart-filter">Histórico</button>
            <button className="chart-filter">Rango</button>
          </div>
        </div>
        <div className="chart-placeholder">
          <p style={{ color: "#a0a0a0", textAlign: "center" }}>
            Sin datos de ventas
          </p>
        </div>
      </div>
    );
  }

  const hoy = new Date();
  const hoyYear = hoy.getFullYear();
  const hoyMonth = hoy.getMonth() + 1; // 1-12

  if (mode === "mes") {
    // 🔹 Mes actual, día por día (1,2,3,...)
    const ingresosPorDia = {}; // dayOfMonth -> total

    diasOrdenados.forEach((d) => {
      const dt = parseDate(d.fecha);
      if (!dt) return;
      const year = dt.getFullYear();
      const month = dt.getMonth() + 1;
      if (year !== hoyYear || month !== hoyMonth) return;

      const dayOfMonth = dt.getDate();
      const ingreso = toNum(d.ingresos) || 0;
      ingresosPorDia[dayOfMonth] =
        (ingresosPorDia[dayOfMonth] || 0) + ingreso;
    });

    // Último día: HOY (no fin de mes)
    const ultimoDia = hoy.getDate();

    const cats = [];
    const dataMes = [];

    for (let day = 1; day <= ultimoDia; day++) {
      const label = `${String(day).padStart(2, "0")}/${String(
        hoyMonth
      ).padStart(2, "0")}`;
      cats.push(label);
      dataMes.push(ingresosPorDia[day] || 0); // 0 si no hubo ingresos
    }

    categories = cats;
    chartLabel = `Ventas del mes (día a día)`;
    chartSeries = [{ name: "Ingresos", data: dataMes }];
  } else if (mode === "anio") {
    // 🔹 Año actual por mes
    const grupos = {}; // mesNum -> total

    diasOrdenados.forEach((d) => {
      const dt = parseDate(d.fecha);
      if (!dt) return;
      const year = dt.getFullYear();
      if (year !== hoyYear) return;
      const month = dt.getMonth() + 1;
      const ingreso = toNum(d.ingresos) || 0;
      grupos[month] = (grupos[month] || 0) + ingreso;
    });

    const monthNames = [
      "",
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    const entries = Object.entries(grupos).sort(
      ([a], [b]) => Number(a) - Number(b)
    );
    categories = entries.map(([m]) => monthNames[Number(m)] || m);
    const dataAnio = entries.map(([, total]) => total);

    chartLabel = `Ventas por mes (${hoyYear})`;
    chartSeries = [{ name: "Ingresos", data: dataAnio }];
  } else if (mode === "hist") {
    // 🔹 Histórico: todos los años
    const grupos = {}; // year -> total

    diasOrdenados.forEach((d) => {
      const dt = parseDate(d.fecha);
      if (!dt) return;
      const year = dt.getFullYear();
      const ingreso = toNum(d.ingresos) || 0;
      grupos[year] = (grupos[year] || 0) + ingreso;
    });

    const entries = Object.entries(grupos).sort(
      ([a], [b]) => Number(a) - Number(b)
    );
    categories = entries.map(([y]) => String(y));
    const dataHist = entries.map(([, total]) => total);

    chartLabel = "Ventas históricas por año";
    chartSeries = [{ name: "Ingresos", data: dataHist }];
  } else {
    // 🔹 Modos: semana (esta semana) / rango (personalizado)
    let filtrados = diasOrdenados;

    if (mode === "rango" && rangeFrom && rangeTo) {
      filtrados = diasOrdenados.filter((d) => {
        const f = (d.fecha || "").slice(0, 10);
        return f >= rangeFrom.slice(0, 10) && f <= rangeTo.slice(0, 10);
      });
      chartLabel = "Ventas por rango";
    } else if (mode === "semana") {
      // 🔹 Solo los días de ESTA semana (lunes a domingo)
      const day = hoy.getDay(); // 0 = domingo, 1 = lunes, ...
      const diffToMonday = (day + 6) % 7; // cuántos días retroceder hasta lunes

      const lunes = new Date(hoy);
      lunes.setHours(0, 0, 0, 0);
      lunes.setDate(hoy.getDate() - diffToMonday);

      const domingo = new Date(lunes);
      domingo.setHours(23, 59, 59, 999);
      domingo.setDate(lunes.getDate() + 6);

      filtrados = diasOrdenados.filter((d) => {
        const dt = parseDate(d.fecha);
        if (!dt) return false;
        return dt >= lunes && dt <= domingo;
      });

      chartLabel = "Ventas de esta semana";
    }

    categories = filtrados.map((d) => {
      const fecha = d.fecha || "";
      if (!fecha.includes("-")) return fecha;
      const [, m, dayStr] = fecha.split("-");
      return `${dayStr}/${m}`;
    });

    const dataVals = filtrados.map((d) => toNum(d.ingresos) || 0);
    chartSeries = [{ name: "Ingresos", data: dataVals }];
  }

  const chartType =
    mode === "mes" || mode === "anio" || mode === "hist" ? "bar" : "line";

  const options = {
    chart: {
      type: chartType,
      background: "transparent",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: "#e5e5e5",
        },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#e5e5e5" },
        formatter: (value) =>
          `$ ${Number(value).toLocaleString("es-AR", {
            maximumFractionDigits: 0,
          })}`,
      },
    },
    grid: {
      borderColor: "rgba(255,255,255,0.08)",
    },
    tooltip: {
      y: {
        formatter: (value) => money(value),
      },
    },
    dataLabels: {
      enabled: false,
    },
    theme: {
      mode: "dark",
    },
    colors: ["#facc15"],
  };

  return (
    <div className="widget-card">
      <div className="widget-header">
        <h3 className="widget-title">{chartLabel}</h3>
        <div className="chart-filters">
          <button
            className={`chart-filter ${mode === "semana" ? "active" : ""}`}
            onClick={() => setMode("semana")}
          >
            Semana
          </button>
          <button
            className={`chart-filter ${mode === "mes" ? "active" : ""}`}
            onClick={() => setMode("mes")}
          >
            Mes
          </button>
          <button
            className={`chart-filter ${mode === "anio" ? "active" : ""}`}
            onClick={() => setMode("anio")}
          >
            Año
          </button>
          <button
            className={`chart-filter ${mode === "hist" ? "active" : ""}`}
            onClick={() => setMode("hist")}
          >
            Histórico
          </button>
          <button
            className={`chart-filter ${mode === "rango" ? "active" : ""}`}
            onClick={() => setMode("rango")}
          >
            Rango
          </button>
        </div>
      </div>

      {mode === "rango" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <select
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
            style={{
              background: "#111827",
              color: "#e5e5e5",
              borderRadius: 8,
              border: "1px solid #374151",
              padding: "4px 8px",
            }}
          >
            {diasOrdenados.map((d) => (
              <option key={`from-${d.fecha}`} value={d.fecha}>
                Desde {d.fecha}
              </option>
            ))}
          </select>
          <select
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
            style={{
              background: "#111827",
              color: "#e5e5e5",
              borderRadius: 8,
              border: "1px solid #374151",
              padding: "4px 8px",
            }}
          >
            {diasOrdenados.map((d) => (
              <option key={`to-${d.fecha}`} value={d.fecha}>
                Hasta {d.fecha}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="chart-wrapper">
        <ReactApexChart
          options={options}
          series={chartSeries}
          type={chartType}
          height={320}
        />
      </div>
    </div>
  );
};

export default WeeklySalesChart;
