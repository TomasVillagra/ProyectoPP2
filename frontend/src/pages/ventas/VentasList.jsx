import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Link } from "react-router-dom";

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

  // Obtiene el NOMBRE del estado de la venta (nunca el id numérico)
  const getEstadoNombre = (venta) => {
    if (!venta) return "-";

    // Si el backend ya manda nombre, lo usamos
    let nombre =
      venta.estado_nombre ??
      venta.estven_nombre ??
      venta.estado ??
      "";

    // Si id_estado_venta viene como objeto
    if (!nombre && typeof venta.id_estado_venta === "object" && venta.id_estado_venta !== null) {
      nombre =
        venta.id_estado_venta.estven_nombre ??
        venta.id_estado_venta.nombre ??
        "";
    }

    // Si todavía no tenemos nombre, lo buscamos en el catálogo por id
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

  return (
    <DashboardLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, color: "#fff" }}>Ventas</h2>
        {/* Si querés agregar "Registrar venta" manual, poné un Link acá */}
      </div>

      {msg && (
        <p style={{ color: "#facc15", whiteSpace: "pre-wrap" }}>{msg}</p>
      )}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha/Hora</th>
                <th>Cliente</th>
                <th>Empleado</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Sin registros
                  </td>
                </tr>
              )}
              {ventas.map((v, i) => {
                const id = v.id_venta ?? v.id ?? i;
                const fecha = v.ven_fecha_hora ?? v.fecha ?? v.created_at ?? null;
                const cliente =
                  v.cliente_nombre ?? v.cli_nombre ?? v.id_cliente ?? "-";
                const empleado =
                  v.empleado_nombre ?? v.emp_nombre ?? v.id_empleado ?? "-";
                const total = v.ven_total ?? v.total ?? 0;
                const estadoNombre = getEstadoNombre(v); // ← siempre nombre (Pendiente, Cobrado, etc.)

                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{fmtDate(fecha)}</td>
                    <td>{String(cliente)}</td>
                    <td>{String(empleado)}</td>
                    <td>${money(total)}</td>
                    <td>{estadoNombre}</td>
                    <td
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Ver detalle de venta */}
                      <Link
                        to={`/ventas/${id}`}
                        className="btn btn-secondary"
                      >
                        Ver
                      </Link>

                      {/* Cobrar venta */}
                      <Link
                        className="btn btn-primary"
                        to={`/cobros/${v.id_venta ?? id}`}
                      >
                        Cobrar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.table-wrap { overflow:auto; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;
