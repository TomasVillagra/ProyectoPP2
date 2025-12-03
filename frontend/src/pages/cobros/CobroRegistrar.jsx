import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";

import CobroRegistrarResumen from "../../components/cobros/CobroRegistrarResumen";
import CobroRegistrarForm from "../../components/cobros/CobroRegistrarForm";
import CobroRegistrarEmpty from "../../components/cobros/CobroRegistrarEmpty";

// ✅ CSS local, no global
import "./CobroRegistrar.css";

const api = apiNamed || apiDefault;

// Helper simple ARS
const fmtARS = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(n || 0));

const clean = (s) => String(s || "").trim().toLowerCase();

export default function CobroRegistrar() {
  const { id_venta } = useParams(); // ID genérico (venta o compra)
  const location = useLocation();
  const navigate = useNavigate();

  // Si la ruta es /cobros/registrar/:id → viene de compras
  const esRutaCompra = location.pathname.includes("/cobros/registrar");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [registro, setRegistro] = useState(null); // venta o compra
  const [tipoDoc, setTipoDoc] = useState(null); // "venta" | "compra"
  const [metodosPago, setMetodosPago] = useState([]);
  const [cajaEstado, setCajaEstado] = useState(null);
  const [estadosVenta, setEstadosVenta] = useState([]); // sólo ventas

  // Form
  const [idMetodoPago, setIdMetodoPago] = useState("");
  const [observacion, setObservacion] = useState("");

  // ================== CARGA INICIAL ==================
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        // Métodos de pago + estado de caja
        const [metRes, cajaRes] = await Promise.all([
          api.get(`/api/metodos-pago/`),
          api.get(`/api/caja/estado/`),
        ]);

        if (!mounted) return;

        const m = metRes?.data ?? [];
        const c = cajaRes?.data ?? null;

        setMetodosPago(Array.isArray(m) ? m : []);
        setCajaEstado(c);

        // Detectar si es COMPRA o VENTA según la ruta
        let tipoDetectado = null;
        let dataDoc = null;

        if (esRutaCompra) {
          // 👉 Ruta de compras: sólo intentamos COMPRA
          try {
            const compraRes = await api.get(`/api/compras/${id_venta}/`);
            tipoDetectado = "compra";
            dataDoc = compraRes.data;
          } catch (err) {
            console.error("No se encontró la compra con ese ID:", err);
            alert(`No se encontró la compra #${id_venta}.`);
            if (mounted) setLoading(false);
            return;
          }
        } else {
          // 👉 Ruta de ventas: primero VENTA, opcionalmente fallback a COMPRA
          try {
            const ventaRes = await api.get(`/api/ventas/${id_venta}/`);
            tipoDetectado = "venta";
            dataDoc = ventaRes.data;
          } catch {
            try {
              const compraRes = await api.get(
                `/api/compras/${id_venta}/`
              );
              tipoDetectado = "compra";
              dataDoc = compraRes.data;
            } catch (err2) {
              console.error(
                "No se encontró venta ni compra con ese ID:",
                err2
              );
              alert(
                `No se encontró venta ni compra con ID #${id_venta}.`
              );
              if (mounted) setLoading(false);
              return;
            }
          }
        }

        if (!mounted) return;

        setTipoDoc(tipoDetectado);
        setRegistro(dataDoc);

        // Preseleccionar método si viene en el doc
        if (dataDoc?.id_metodo_pago) {
          const preId =
            typeof dataDoc.id_metodo_pago === "object"
              ? dataDoc.id_metodo_pago.id_metodo_pago ||
                dataDoc.id_metodo_pago.id ||
                ""
              : dataDoc.id_metodo_pago;
          if (preId) setIdMetodoPago(String(preId));
        }

        // Si es venta, cargo catálogo de estados de venta
        if (tipoDetectado === "venta") {
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
        }
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
  }, [id_venta, esRutaCompra]);

  // ================== MEMOS BÁSICOS ==================
  const cajaAbierta = useMemo(() => {
    if (!cajaEstado) return false;
    if (typeof cajaEstado.abierta === "boolean")
      return cajaEstado.abierta;
    if (typeof cajaEstado.estado === "string")
      return cajaEstado.estado.toUpperCase() === "ABIERTA";
    return false;
  }, [cajaEstado]);

  // saldo total de la caja (según tu JSON hoy_saldo)
  const saldoCaja = useMemo(() => {
    if (!cajaEstado) return null;
    const v = Number(
      cajaEstado.hoy_saldo ??
        cajaEstado.saldo ??
        cajaEstado.total ??
        cajaEstado.hoy_ingresos
    );
    return Number.isNaN(v) ? null : v;
  }, [cajaEstado]);

  // EFECTIVO disponible real
  const efectivoDisponible = useMemo(() => {
    if (!cajaEstado) return null;

    const v = Number(
      cajaEstado.efectivo_disponible ??
        cajaEstado.efectivoDisponible ??
        cajaEstado.efectivo ??
        saldoCaja
    );
    return Number.isNaN(v) ? null : v;
  }, [cajaEstado, saldoCaja]);

  const montoDocumento = useMemo(() => {
    if (!registro) return 0;
    if (tipoDoc === "compra") {
      return registro.com_monto ?? 0;
    }
    // venta
    return (
      registro.ven_monto ??
      registro.ven_total ??
      registro.total ??
      0
    );
  }, [registro, tipoDoc]);

  const estadoNombre = useMemo(() => {
    if (!registro) return "";

    if (tipoDoc === "compra") {
      return (
        registro.estado_nombre ??
        registro.estcom_nombre ??
        registro.estado ??
        ""
      );
    }

    // VENTA: tratar de resolver el nombre de estado
    let nombre =
      registro.estado_nombre ??
      registro.estven_nombre ??
      registro.estado ??
      "";

    if (
      !nombre &&
      typeof registro.id_estado_venta === "object" &&
      registro.id_estado_venta !== null
    ) {
      nombre =
        registro.id_estado_venta.estven_nombre ??
        registro.id_estado_venta.nombre ??
        "";
    }

    if (!nombre && registro.id_estado_venta != null && estadosVenta.length > 0) {
      const idValor =
        typeof registro.id_estado_venta === "object"
          ? registro.id_estado_venta.id_estado_venta ??
            registro.id_estado_venta.id
          : registro.id_estado_venta;

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
  }, [registro, tipoDoc, estadosVenta]);

  const metodoPagoActual = useMemo(() => {
    if (!registro) return "";
    if (
      typeof registro.id_metodo_pago === "object" &&
      registro.id_metodo_pago !== null
    ) {
      return (
        registro.id_metodo_pago.metpag_nombre ||
        registro.id_metodo_pago.metpago_nombre ||
        registro.id_metodo_pago.nombre ||
        ""
      );
    }
    const found = metodosPago.find(
      (x) =>
        String(x.id_metodo_pago || x.id) ===
        String(registro?.id_metodo_pago || "")
    );
    return (
      found?.metpag_nombre ||
      found?.metpago_nombre ||
      found?.nombre ||
      ""
    );
  }, [registro, metodosPago]);

  // Método de pago SELECCIONADO
  const metodoPagoSel = useMemo(() => {
    if (!idMetodoPago) return null;
    return metodosPago.find(
      (m) =>
        String(m.id_metodo_pago || m.id) === String(idMetodoPago)
    );
  }, [metodosPago, idMetodoPago]);

  const esEfectivoSeleccionado = useMemo(() => {
    if (!metodoPagoSel) return false;
    const nombre = clean(
      metodoPagoSel.metpag_nombre ||
        metodoPagoSel.metpago_nombre ||
        metodoPagoSel.nombre ||
        ""
    );
    const codigo = clean(
      metodoPagoSel.codigo || metodoPagoSel.code || ""
    );
    return (
      nombre.includes("efectivo") ||
      codigo.includes("efectivo") ||
      codigo.includes("cash")
    );
  }, [metodoPagoSel]);

  // Busca el id_estado_venta para "Cobrado/Cobrada/Pagado/Pagada" (sólo ventas)
  const resolveEstadoVentaId = useCallback(
    (targetNames = []) => {
      if (
        !Array.isArray(estadosVenta) ||
        estadosVenta.length === 0
      )
        return null;
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

  // ================== COBRAR / PAGAR ==================
  const handleCobrar = useCallback(async () => {
    if (!registro || !tipoDoc) {
      alert("No se encontró el documento a cobrar/pagar.");
      return;
    }
    if (!cajaAbierta) {
      alert(
        "La caja está cerrada. Abrila antes de registrar el movimiento."
      );
      return;
    }
    if (!idMetodoPago) {
      alert("Seleccioná un método de pago.");
      return;
    }

    // Venta ya cobrada/pagada → no dejar cobrar otra vez
    if (tipoDoc === "venta") {
      const n = clean(estadoNombre);
      if (n.includes("cobrad") || n.includes("pagad")) {
        alert(
          "Esta venta ya está cobrada/pagada, no se puede volver a cobrar."
        );
        return;
      }
    }

    // Si es COMPRA y método EFECTIVO, no dejar egresar más que el EFECTIVO disponible
    if (
      tipoDoc === "compra" &&
      esEfectivoSeleccionado &&
      efectivoDisponible != null &&
      Number(montoDocumento) > Number(efectivoDisponible)
    ) {
      alert(
        `No hay EFECTIVO suficiente en la caja para esta compra.\n` +
          `Efectivo disponible: ${fmtARS(efectivoDisponible)}\n` +
          `Egreso solicitado: ${fmtARS(montoDocumento)}`
      );
      return;
    }

    try {
      setSubmitting(true);

      const idNum =
        tipoDoc === "compra"
          ? Number(registro.id_compra || id_venta)
          : Number(registro.id_venta || id_venta);

      if (tipoDoc === "venta") {
        // =============== VENTA: movimiento de INGRESO =================
        await api.post(`/api/movimientos-caja/`, {
          id_tipo_movimiento_caja: 2, // Ingreso
          mv_monto: Number(montoDocumento),
          mv_descripcion:
            observacion?.trim() ||
            `Cobro de venta #${registro.id_venta || id_venta}`,
          id_metodo_pago: Number(idMetodoPago),
          id_venta: idNum,
        });

        // Actualizar método de pago en la venta
        await api.patch(`/api/ventas/${idNum}/`, {
          id_metodo_pago: Number(idMetodoPago),
        });

        // Cambiar estado de la venta a Cobrado/Cobrada/Pagado/Pagada
        const estadoCobradoId = resolveEstadoVentaId([
          "cobrado",
          "cobrada",
          "pagado",
          "pagada",
        ]);
        if (estadoCobradoId) {
          await api.patch(`/api/ventas/${idNum}/`, {
            id_estado_venta: Number(estadoCobradoId),
          });
        }

        alert("Cobro de venta registrado correctamente.");
        navigate(`/ventas/${idNum}`);
      } else {
        // =============== COMPRA: movimiento de EGRESO =================
        await api.post(`/api/movimientos-caja/`, {
          id_tipo_movimiento_caja: 3, // Egreso
          mv_monto: Number(montoDocumento),
          mv_descripcion:
            observacion?.trim() ||
            `Pago de compra #${registro.id_compra || id_venta}`,
          id_metodo_pago: Number(idMetodoPago),
          id_compra: idNum,
        });

        // Marcar compra como pagada (columna com_pagado = 1)
        await api.patch(`/api/compras/${idNum}/`, {
          com_pagado: 1,
        });

        alert("Pago de compra registrado correctamente.");
        navigate(`/compras`);
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "No se pudo registrar el movimiento.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    registro,
    tipoDoc,
    cajaAbierta,
    idMetodoPago,
    montoDocumento,
    observacion,
    navigate,
    id_venta,
    resolveEstadoVentaId,
    estadoNombre,
    esEfectivoSeleccionado,
    efectivoDisponible,
  ]);

  // ================== RENDER ==================
  const tituloDoc = tipoDoc === "compra" ? "compra" : "venta";
  const idMostrar =
    tipoDoc === "compra"
      ? registro?.id_compra || id_venta
      : registro?.id_venta || id_venta;

  return (
    <DashboardLayout>
      {/* ✅ Scope para que el CSS no sea global */}
      <div className="cobro-registrar-scope">
        {loading ? (
          <p>Cargando datos de cobro/pago...</p>
        ) : !registro ? (
          <CobroRegistrarEmpty id_venta={id_venta} />
        ) : (
          <div className="grid">
            <CobroRegistrarResumen
              tituloDoc={tituloDoc}
              idMostrar={idMostrar}
              estadoNombre={estadoNombre}
              montoDocumento={montoDocumento}
              metodoPagoActual={metodoPagoActual}
              cajaAbierta={cajaAbierta}
              tipoDoc={tipoDoc}
              esEfectivoSeleccionado={esEfectivoSeleccionado}
              efectivoDisponible={efectivoDisponible}
              fmtARS={fmtARS}
            />

            <CobroRegistrarForm
              tipoDoc={tipoDoc}
              idMostrar={idMostrar}
              metodosPago={metodosPago}
              idMetodoPago={idMetodoPago}
              setIdMetodoPago={setIdMetodoPago}
              observacion={observacion}
              setObservacion={setObservacion}
              montoDocumento={montoDocumento}
              fmtARS={fmtARS}
              handleCobrar={handleCobrar}
              submitting={submitting}
              cajaAbierta={cajaAbierta}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

















