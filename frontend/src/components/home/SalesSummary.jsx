// src/components/home/SalesSummary.jsx

import ReactApexChart from "react-apexcharts";
import { money, toNum } from "../../utils/dashboardUtils";

const SalesSummary = ({ ventasHoy, metodosHoy }) => {
  // Normalizamos y AGREGAMOS montos por método de pago
  const raw = Array.isArray(metodosHoy) ? metodosHoy : [];

  const agregadosMap = new Map();

  raw.forEach((m) => {
    const idMetodo = m.id_metodo_pago ?? m.id ?? null;

    const nombre =
      m.nombre ??
      m.metodo_pago_nombre ??
      m.metodo ??
      `Método ${idMetodo ?? ""}`;

    const montoMetodo = toNum(
      m.ingresos ?? m.total ?? m.saldo ?? m.monto ?? 0
    );

    if (!montoMetodo || Number.isNaN(montoMetodo)) return;

    // Clave de agrupación: primero por id, si no hay, por nombre
    const key =
      idMetodo !== null && idMetodo !== undefined
        ? `id_${idMetodo}`
        : `n_${nombre.toLowerCase()}`;

    const actual = agregadosMap.get(key);

    if (actual) {
      actual.total += montoMetodo;
    } else {
      agregadosMap.set(key, {
        nombre,
        total: montoMetodo,
      });
    }
  });

  const metodos = Array.from(agregadosMap.values())
    // Solo mostramos métodos con monto positivo
    .filter((m) => m.total > 0);

  const sumaMetodos = metodos.reduce((acc, m) => acc + m.total, 0);
  const totalMostrar = sumaMetodos || (toNum(ventasHoy) || 0);

  const colors = [
    "#22c55e",
    "#3b82f6",
    "#f97316",
    "#a855f7",
    "#ef4444",
    "#14b8a6",
  ];

  if (!metodos.length) {
    return (
      <div className="widget-card">
        <h3 className="widget-title">Resumen de ventas hoy</h3>
        <div className="summary-total">
          <span className="summary-amount">{money(totalMostrar)}</span>
          <span className="summary-subtitle">Total de ingresos del día</span>
        </div>
        <div className="chart-placeholder">
          <p style={{ color: "#a0a0a0", textAlign: "center" }}>
            Sin ventas registradas hoy
          </p>
        </div>
      </div>
    );
  }

  const series = metodos.map((m) => m.total);
  const labels = metodos.map((m) => m.nombre);

  const options = {
    chart: {
      type: "donut",
      background: "transparent",
      toolbar: { show: false },
    },
    labels,
    colors,
    legend: {
      show: true,               // ✅ mostrar leyenda
      position: "bottom",       // ✅ debajo del gráfico
      horizontalAlign: "center",
      fontSize: "13px",
      labels: {
        colors: "#e5e5e5",
      },
      markers: {
        width: 10,
        height: 10,
        radius: 4,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 3,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
      style: {
        fontSize: "11px",
        fontWeight: 500,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%", // ✅ círculo más chico
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: 6,
            },
            value: {
              show: true,
              formatter: (val) => money(parseFloat(val) || 0),
            },
            total: {
              show: true,
              label: "Total",
              formatter: () => money(totalMostrar),
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value) => money(value),
      },
    },
    theme: {
      mode: "dark",
    },
    stroke: {
      width: 0,
    },
  };

  return (
    <div className="widget-card">
      <h3 className="widget-title">Resumen de ventas hoy</h3>

      <div className="summary-total">
        <span className="summary-amount">{money(totalMostrar)}</span>
        <span className="summary-subtitle">Total de ingresos del día</span>
      </div>

      <div
          className="summary-content"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >

        <div className="summary-pie-wrapper">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={250}  // ✅ gráfico más chico
            width={170}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesSummary;

