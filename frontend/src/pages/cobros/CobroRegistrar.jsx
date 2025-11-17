import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";
const api = apiNamed || apiDefault;

// Helper simple ARS
const fmtARS = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(n || 0));

const clean = (s) => String(s || "").trim().toLowerCase();

export default function CobroRegistrar() {
  const { id_venta } = useParams(); // viene de /cobros/:id_venta o /cobros/registrar/:id_venta
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [venta, setVenta] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [cajaEstado, setCajaEstado] = useState(null);
  const [estadosVenta, setEstadosVenta] = useState([]);

  // Form
  const [idMetodoPago, setIdMetodoPago] = useState("");
  const [observacion, setObservacion] = useState("");

  // carga inicial
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        const [ventaRes, metRes, cajaRes] = await Promise.all([
          api.get(`/api/ventas/${id_venta}/`),
          api.get(`/api/metodos-pago/`),
          api.get(`/api/caja/estado/`),
        ]);

        if (!mounted) return;

        const v = ventaRes?.data ?? null;
        const m = metRes?.data ?? [];
        const c = cajaRes?.data ?? null;

        setVenta(v);
        setMetodosPago(Array.isArray(m) ? m : []);
        setCajaEstado(c);

        // Preselecciona método si ya está en la venta
        if (v?.id_metodo_pago) {
          const preId =
            typeof v.id_metodo_pago === "object"
              ? v.id_metodo_pago.id_metodo_pago || v.id_metodo_pago.id || ""
              : v.id_metodo_pago;
          if (preId) setIdMetodoPago(String(preId));
        }

        // Cargar catálogo de estados de venta
        let estados = [];
        const candidates = [
          "/api/estado-ventas/",
          "/api/estado_ventas/",
          "/api/estados-venta/",
          "/api/estadosventa/",
        ];
        for (const url of candidates) {
          try {
            const res = await api.get(url);
            const data = res.data;
            let list = [];
            if (Array.isArray(data)) list = data;
            else if (Array.isArray(data?.results)) list = data.results;
            else if (Array.isArray(data?.data)) list = data.data;
            if (list.length) {
              estados = list;
              break;
            }
          } catch {}
        }
        if (mounted) setEstadosVenta(estados);
      } catch (err) {
        console.error("Error al cargar cobro:", err);
        alert("No se pudo cargar la información del cobro.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id_venta]);

  const cajaAbierta = useMemo(() => {
    if (!cajaEstado) return false;
    if (typeof cajaEstado.abierta === "boolean") return cajaEstado.abierta;
    if (typeof cajaEstado.estado === "string")
      return cajaEstado.estado.toUpperCase() === "ABIERTA";
    return false;
  }, [cajaEstado]);

  const montoVenta = useMemo(() => {
    if (!venta) return 0;
    return venta.ven_monto ?? venta.ven_total ?? venta.total ?? 0;
  }, [venta]);

  const estadoNombre = useMemo(() => {
    if (!venta) return "";

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
          ? venta.id_estado_venta.id_estado_venta ?? venta.id_estado_venta.id
          : venta.id_estado_venta;

      const found = estadosVenta.find(
        (ev) => String(ev.id_estado_venta ?? ev.id) === String(idValor)
      );
      if (found) {
        nombre =
          found.estven_nombre ??
          found.nombre ??
          found.estado ??
          "";
      }
    }

    return nombre || "";
  }, [venta, estadosVenta]);

  const metodoPagoActual = useMemo(() => {
    if (!venta) return "";
    if (typeof venta.id_metodo_pago === "object" && venta.id_metodo_pago !== null) {
      return (
        venta.id_metodo_pago.metpag_nombre ||
        venta.id_metodo_pago.metpago_nombre ||
        venta.id_metodo_pago.nombre ||
        ""
      );
    }
    const found = metodosPago.find(
      (x) =>
        String(x.id_metodo_pago || x.id) ===
        String(venta?.id_metodo_pago || "")
    );
    return (
      found?.metpag_nombre || found?.metpago_nombre || found?.nombre || ""
    );
  }, [venta, metodosPago]);

  // Saldo disponible del método de pago seleccionado (si viene desde cajaEstado)
  const saldoMetodoSeleccionado = useMemo(() => {
    if (!cajaEstado || !idMetodoPago) return null;

    const mpIdStr = String(idMetodoPago);
    const metArr =
      cajaEstado.metodos ||
      cajaEstado.metodos_pago ||
      cajaEstado.saldos_metodos ||
      [];

    if (!Array.isArray(metArr)) return null;

    const found = metArr.find((m) => {
      const idMatch = String(
        m.id_metodo_pago ??
          m.id ??
          m.metodo_id ??
          ""
      );
      return idMatch === mpIdStr;
    });

    if (!found) return null;

    // tratamos de detectar el campo de saldo
    const candidates = ["saldo", "saldo_actual", "monto", "total", "disponible"];
    for (const key of candidates) {
      if (found[key] != null) {
        const num = Number(found[key]);
        if (!Number.isNaN(num)) return num;
      }
    }
    return null;
  }, [cajaEstado, idMetodoPago]);

  // Busca el id_estado_venta para "Cobrado"
  const resolveEstadoVentaId = useCallback(
    (targetNames = []) => {
      if (!Array.isArray(estadosVenta) || estadosVenta.length === 0) return null;
      const targets = targetNames.map(clean);
      for (const it of estadosVenta) {
        const nombre =
          it.estven_nombre || it.nombre || it.estado || "";
        if (targets.includes(clean(nombre))) {
          return it.id_estado_venta ?? it.id;
        }
      }
      return null;
    },
    [estadosVenta]
  );

  // Cobrar
  const handleCobrar = useCallback(async () => {
    if (!venta) {
      alert("Venta no encontrada.");
      return;
    }
    if (!cajaAbierta) {
      alert("La caja está cerrada. Abrila antes de cobrar.");
      return;
    }
    if (!idMetodoPago) {
      alert("Seleccioná un método de pago.");
      return;
    }

    // Chequear saldo suficiente del método
    if (
      saldoMetodoSeleccionado != null &&
      Number(montoVenta) > Number(saldoMetodoSeleccionado)
    ) {
      alert(
        `No hay saldo suficiente en el método de pago seleccionado.\n` +
          `Disponible: ${fmtARS(saldoMetodoSeleccionado)}\n` +
          `Requerido: ${fmtARS(montoVenta)}`
      );
      return;
    }

    try {
      setSubmitting(true);

      const idVentaNum = Number(venta.id_venta || id_venta);

      // 1) Movimiento de caja: Ingreso (id_tipo_movimiento = 2)
      await api.post(`/api/movimientos-caja/`, {
        id_tipo_movimiento: 2, // Ingreso
        mv_monto: Number(montoVenta),
        observacion:
          observacion?.trim() ||
          `Cobro de venta #${venta.id_venta || id_venta}`,
        id_metodo_pago: Number(idMetodoPago),
        id_venta: idVentaNum,
      });

      // 2) Actualizar método de pago en la venta
      await api.patch(`/api/ventas/${idVentaNum}/`, {
        id_metodo_pago: Number(idMetodoPago),
      });

      // 3) Cambiar estado de la venta a "Cobrado"
      const estadoCobradoId = resolveEstadoVentaId([
        "cobrado",
        "pagada",
        "pagado",
      ]);
      if (estadoCobradoId) {
        await api.patch(`/api/ventas/${idVentaNum}/`, {
          id_estado_venta: Number(estadoCobradoId),
        });
      }

      alert("Cobro registrado correctamente.");
      navigate(`/ventas/${idVentaNum}`);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "No se pudo registrar el cobro.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    venta,
    cajaAbierta,
    idMetodoPago,
    montoVenta,
    observacion,
    navigate,
    id_venta,
    resolveEstadoVentaId,
    saldoMetodoSeleccionado,
  ]);

  return (
    <DashboardLayout>
      {loading ? (
        <p>Cargando datos de cobranza...</p>
      ) : !venta ? (
        <div className="card-dark">
          <h3 style={{ marginTop: 0 }}>Cobrar venta</h3>
          <div className="alert-warn">
            No se encontró la venta #{id_venta}.
          </div>
          <Link to="/ventas" className="btn btn-secondary">
            Volver a Ventas
          </Link>
        </div>
      ) : (
        <div className="grid">
          <div className="card-dark">
            <h3 style={{ marginTop: 0 }}>
              Resumen de la venta #{venta.id_venta || id_venta}
            </h3>
            <div className="row">
              <div>
                <span className="label">Estado:</span>{" "}
                <b>{estadoNombre || "-"}</b>
              </div>
              <div>
                <span className="label">Total:</span>{" "}
                <b>{fmtARS(montoVenta)}</b>
              </div>
              <div>
                <span className="label">Método actual:</span>{" "}
                <b>{metodoPagoActual || "— (sin asignar)"}</b>
              </div>
              <div>
                <span className="label">Caja:</span>{" "}
                <span className={`badge ${cajaAbierta ? "ok" : "err"}`}>
                  {cajaAbierta ? "Abierta" : "Cerrada"}
                </span>
              </div>
            </div>
            {!cajaAbierta && (
              <div className="alert-info" style={{ marginTop: 10 }}>
                Para cobrar necesitás abrir la caja en <b>Caja &gt; Panel</b>.
              </div>
            )}
          </div>

          <div className="card-dark">
            <h3 style={{ marginTop: 0 }}>Registrar cobro</h3>

            <div className="field">
              <label className="label">Método de pago</label>
              <select
                className="input"
                value={idMetodoPago}
                onChange={(e) => setIdMetodoPago(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {metodosPago.map((m) => (
                  <option
                    key={m.id_metodo_pago || m.id}
                    value={m.id_metodo_pago || m.id}
                  >
                    {m.metpag_nombre || m.metpago_nombre || m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label">Observación (opcional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder={`Cobro de venta #${venta.id_venta || id_venta}`}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="label">
                Importe a cobrar: <b>{fmtARS(montoVenta)}</b>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleCobrar}
                disabled={submitting || !cajaAbierta || !idMetodoPago}
                title={
                  !cajaAbierta
                    ? "Abrí la caja para poder cobrar."
                    : !idMetodoPago
                    ? "Elegí un método de pago."
                    : undefined
                }
              >
                {submitting ? "Cobrando..." : "Cobrar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.grid { display:grid; gap:12px; grid-template-columns: 1fr; }
@media (min-width: 1000px) { .grid { grid-template-columns: 1fr 1fr; } }
.card-dark { background:#121212; border:1px solid #232323; border-radius:10px; padding:12px; }
.label { color:#aaa; font-size:14px; }
.field { margin-bottom:10px; }
.input { width:100%; background:#0f0f10; color:#fff; border:1px solid #2a2a2a; border-radius:8px; padding:8px; }
.badge { display:inline-block; padding:4px 8px; border-radius:999px; font-weight:700; }
.badge.ok { background:#14532d; color:#a7f3d0; }
.badge.err { background:#7f1d1d; color:#fecaca; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
.alert-warn { background:#7c2d12; color:#fde68a; padding:8px; border-radius:8px; }
.alert-info { background:#1e3a8a; color:#bfdbfe; padding:8px; border-radius:8px; }
`;










