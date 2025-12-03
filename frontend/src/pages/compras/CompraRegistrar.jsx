import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import CompraRegistrarHeader from "../../components/compras/CompraRegistrarHeader";
import CompraDatosGenerales from "../../components/compras/CompraDatosGenerales";
import CompraDetalleTable from "../../components/compras/CompraDetalleTable";
import CompraDetalleFooter from "../../components/compras/CompraDetalleFooter";

// ✅ CSS local, no global
import "./CompraRegistrar.css";

/* ===== utils comunes (IGUAL QUE ANTES) ===== */
const toDec = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  let s = String(v).replace(/,/g, ".").replace(/[^\d.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts.shift() + "." + parts.join("");
  return s;
};

// 👉 solo enteros (sin decimales)
const toInt = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  let s = String(v).replace(/[^\d]/g, "");
  return s;
};

const blockInvalidDecimal = (e) => {
  const bad = ["-", "+", "e", "E", " ", "."];
  if (bad.includes(e.key)) e.preventDefault();
};

const norm = (d) => (Array.isArray(d) ? d : d?.results || d?.data || []);
const nowSQL = () =>
  new Date().toISOString().slice(0, 19).replace("T", " ");
const empleadoLabel = (e) => {
  const nom = [e?.emp_nombre ?? e?.nombre, e?.emp_apellido ?? e?.apellido]
    .filter(Boolean)
    .join(" ");
  return nom || `Empleado #${e?.id_empleado ?? e?.id ?? "?"}`;
};

export default function CompraRegistrar() {
  const nav = useNavigate();

  // catálogos
  const [empleadoActual, setEmpleadoActual] = useState(null);
  const [estados, setEstados] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [insumosAll, setInsumosAll] = useState([]);

  // estado de caja
  const [cajaEstado, setCajaEstado] = useState(null);

  // vínculo proveedor<->insumo
  const [linksProvInsumo, setLinksProvInsumo] = useState([]);
  const precioByInsumo = useMemo(() => {
    const m = new Map();
    linksProvInsumo.forEach((r) =>
      m.set(Number(r.id_insumo), Number(r.precio_unitario ?? 0))
    );
    return m;
  }, [linksProvInsumo]);

  const [form, setForm] = useState({
    id_empleado: "",
    id_estado_compra: "",
    id_proveedor: "",
    com_descripcion: "",
    com_pagado: "2", // 1 = Sí, 2 = No
  });

  const [rows, setRows] = useState([
    { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
  ]);
  const [msg, setMsg] = useState("");

  // ====== carga inicial ======
  useEffect(() => {
    (async () => {
      try {
        // empleado actual
        try {
          const { data } = await api.get("/api/empleados/me/");
          const id = data.id_empleado ?? data.id;
          setEmpleadoActual(data);
          setForm((p) => ({ ...p, id_empleado: String(id || "") }));
        } catch (e) {
          console.error("empleados/me", e);
        }

        const [est, prov, ins, caja] = await Promise.all([
          api.get("/api/estados-compra/"),
          api.get("/api/proveedores/"),
          api.get("/api/insumos/"),
          api.get("/api/caja/estado/"),
        ]);

        const estadosArr = norm(est);
        const proveedoresArr = norm(prov);
        const insArr = norm(ins);

        setCajaEstado(caja?.data ?? caja ?? null);

        // solo proveedores activos
        const proveedoresActivos = proveedoresArr.filter((p) => {
          const estNom = String(
            p.estado_nombre ?? p.prov_estado ?? ""
          ).toLowerCase();
          const idEst = Number(p.id_estado_proveedor ?? p.estado ?? 0);
          return estNom === "activo" || idEst === 1;
        });

        setEstados(estadosArr);
        setProveedores(proveedoresActivos);
        setInsumosAll(insArr);

        // estado "En Proceso"
        const enProc =
          estadosArr.find(
            (s) =>
              String(
                s.estcom_nombre ?? s.nombre ?? ""
              ).toLowerCase() === "en proceso"
          ) ||
          estadosArr.find(
            (s) => String(s.nombre ?? "").toLowerCase() === "en proceso"
          );
        if (enProc) {
          setForm((p) => ({
            ...p,
            id_estado_compra: String(
              enProc.id_estado_compra ?? enProc.id
            ),
          }));
        } else {
          setMsg((m) =>
            (m ? m + "\n" : "") + "No se encontró estado 'En Proceso'."
          );
        }
      } catch (e) {
        console.error(e);
        setMsg("No se pudieron cargar catálogos.");
      }
    })();
  }, []);

  // caja abierta?
  const cajaAbierta = useMemo(() => {
    if (!cajaEstado) return false;
    if (typeof cajaEstado.abierta === "boolean") return cajaEstado.abierta;
    if (typeof cajaEstado.estado === "string") {
      return cajaEstado.estado.toUpperCase() === "ABIERTA";
    }
    return false;
  }, [cajaEstado]);

  // ====== cuando cambia proveedor: vínculos proveedor-insumo ======
  useEffect(() => {
    (async () => {
      if (!form.id_proveedor) {
        setLinksProvInsumo([]);
        return;
      }
      try {
        const res = await api.get(
          `/api/proveedores-insumos/?id_proveedor=${form.id_proveedor}`
        );
        const arr = norm(res);
        setLinksProvInsumo(arr);
        setRows([
          { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
        ]);
      } catch (e) {
        console.error(e);
        setLinksProvInsumo([]);
        setMsg("No se pudieron cargar insumos del proveedor.");
      }
    })();
  }, [form.id_proveedor]);

  // insumos disponibles según proveedor
  const insumosDisponibles = useMemo(() => {
    if (!linksProvInsumo.length) return [];
    const ids = new Set(linksProvInsumo.map((l) => Number(l.id_insumo)));
    return (insumosAll || []).filter((i) =>
      ids.has(Number(i.id_insumo))
    );
  }, [linksProvInsumo, insumosAll]);

  // ====== handlers ======
  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const setRow = (i, k, v) => {
    const n = [...rows];
    n[i] = {
      ...n[i],
      [k]: k === "detcom_cantidad" ? toInt(v) : v,
    };

    if (k === "id_insumo") {
      const pid = Number(v || 0);
      const precio = Number(precioByInsumo.get(pid) || 0);
      n[i].detcom_precio_uni = precio > 0 ? String(precio) : "";
    }

    setRows(n);
  };

  const addRow = () =>
    setRows((p) => [
      ...p,
      { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
    ]);
  const removeRow = (i) =>
    setRows((p) => p.filter((_, idx) => idx !== i));

  const calcSubtotal = (r) => {
    const c = Number(r.detcom_cantidad || 0);
    const p = Number(r.detcom_precio_uni || 0);
    return c * p;
  };
  const total = rows.reduce((acc, r) => acc + calcSubtotal(r), 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    // bloqueo por caja cerrada
    if (!cajaAbierta) {
      setMsg(
        "La caja está CERRADA. No se puede registrar una compra mientras la caja esté cerrada."
      );
      return;
    }

    if (!form.id_empleado) {
      setMsg("No se reconoció el empleado actual.");
      return;
    }
    if (!form.id_estado_compra) {
      setMsg("No se pudo fijar el estado 'En Proceso'.");
      return;
    }
    if (!form.id_proveedor) {
      setMsg("Seleccioná un proveedor.");
      return;
    }
    if (!linksProvInsumo.length) {
      setMsg("El proveedor no tiene insumos vinculados.");
      return;
    }
    for (const r of rows) {
      if (!r.id_insumo) {
        setMsg("Completá todos los insumos del detalle.");
        return;
      }
      if (!(Number(r.detcom_cantidad) > 0)) {
        setMsg("La cantidad debe ser > 0.");
        return;
      }
      const precioRel = Number(
        precioByInsumo.get(Number(r.id_insumo)) || 0
      );
      if (!(precioRel > 0)) {
        setMsg(
          "El precio guardado en el proveedor para ese insumo debe ser > 0."
        );
        return;
      }
    }

    try {
      // cabecera
      const body = {
        id_empleado: Number(form.id_empleado),
        id_estado_compra: Number(form.id_estado_compra),
        id_proveedor: Number(form.id_proveedor),
        com_fecha_hora: nowSQL(),
        com_monto: Number(total.toFixed(2)),
        com_descripcion: form.com_descripcion || "",
        com_pagado: Number(form.com_pagado || 2),
      };
      const created = await api.post("/api/compras/", body);
      const compraId =
        created?.data?.id_compra ?? created?.data?.id;

      // detalle
      for (const r of rows) {
        const pid = Number(r.id_insumo);
        const precio = Number(precioByInsumo.get(pid) || 0);
        await api.post("/api/detalle-compras/", {
          id_compra: Number(compraId),
          id_insumo: pid,
          detcom_cantidad: Number(r.detcom_cantidad),
          detcom_precio_uni: Number(precio.toFixed(3)),
        });
      }

      setMsg("Compra registrada");
      setTimeout(() => nav("/compras"), 700);
    } catch (err) {
      console.error(err);
      const apiMsg = err?.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : "No se pudo registrar.";
      setMsg(apiMsg);
    }
  };

  const estadoNombre = useMemo(() => {
    const it = estados.find(
      (s) =>
        String(s.id_estado_compra ?? s.id) ===
        String(form.id_estado_compra)
    );
    return it?.estcom_nombre ?? it?.nombre ?? "";
  }, [estados, form.id_estado_compra]);

  const empleadoDisplay = empleadoActual
    ? empleadoLabel(empleadoActual)
    : "—";

  const handleCancel = () => nav("/compras");

  return (
    <DashboardLayout>
      {/* ✅ Scope CSS */}
      <div className="compra-registrar-scope">
        <CompraRegistrarHeader cajaAbierta={cajaAbierta} msg={msg} />

        <form onSubmit={onSubmit} className="form">
          <CompraDatosGenerales
            empleadoDisplay={empleadoDisplay}
            proveedores={proveedores}
            form={form}
            onChange={onChange}
            estadoNombre={estadoNombre}
            cajaAbierta={cajaAbierta}
          />

          <h3 style={{ marginTop: 18, marginBottom: 8 }}>Detalle</h3>

          <CompraDetalleTable
            rows={rows}
            setRow={setRow}
            removeRow={removeRow}
            insumosDisponibles={insumosDisponibles}
            cajaAbierta={cajaAbierta}
            form={form}
            precioByInsumo={precioByInsumo}
            blockInvalidDecimal={blockInvalidDecimal}
            calcSubtotal={calcSubtotal}
          />

          <CompraDetalleFooter
            addRow={addRow}
            cajaAbierta={cajaAbierta}
            form={form}
            insumosDisponibles={insumosDisponibles}
            total={total}
            onCancel={handleCancel}
          />
        </form>
      </div>
    </DashboardLayout>
  );
}







