import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import CompraEditarHeader from "../../components/compras/CompraEditarHeader";
import CompraEditarCabecera from "../../components/compras/CompraEditarCabecera";
import CompraEditarDetalleTable from "../../components/compras/CompraEditarDetalleTable";
import CompraEditarFooter from "../../components/compras/CompraEditarFooter";

import "./CompraEditar.css";

// ===== Utils (IGUALES a tu código original) =====
const toDec = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  let s = String(v).replace(/,/g, ".").replace(/[^\d.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts.shift() + "." + parts.join("");
  return s;
};

const blockInvalidDecimal = (e) => {
  const bad = ["-", "+", "e", "E", " "];
  if (bad.includes(e.key)) e.preventDefault();
};

const norm = (d) => (Array.isArray(d) ? d : d?.results || d?.data || []);

const getInsumoId = (d) =>
  d?.id_insumo?.id_insumo ??
  d?.id_insumo_id ??
  d?.id_insumo ??
  "";

// ===== Componente =====
export default function CompraEditar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [empleados, setEmpleados] = useState([]);
  const [estados, setEstados] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [linksProvInsumo, setLinksProvInsumo] = useState([]);

  const [form, setForm] = useState({
    id_empleado: "",
    id_estado_compra: "",
    id_proveedor: "",
    com_descripcion: "",
    com_fecha_hora: "",
    com_pagado: "2", // 1 = Sí, 2 = No
  });

  const [rows, setRows] = useState([
    { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
  ]);

  const [msg, setMsg] = useState("");

  // ===== Carga inicial =====
  useEffect(() => {
    const load = async () => {
      try {
        const [emp, est, ins, prov, comp, det] = await Promise.all([
          api.get("/api/empleados/"),
          api.get("/api/estados-compra/"),
          api.get("/api/insumos/"),
          api.get("/api/proveedores/"),
          api.get(`/api/compras/${id}/`),
          api.get(`/api/detalle-compras/?id_compra=${id}`),
        ]);

        const empleadosArr = norm(emp);
        const estadosArr = norm(est);
        const insumosArr = norm(ins);
        const proveedoresArr = norm(prov);
        const compra = comp.data;
        const detalle = norm(det);

        setEmpleados(empleadosArr);
        setEstados(estadosArr);
        setInsumos(insumosArr);
        setProveedores(proveedoresArr);

        setForm({
          id_empleado: String(compra.id_empleado ?? ""),
          id_estado_compra: String(compra.id_estado_compra ?? ""),
          id_proveedor: String(compra.id_proveedor ?? ""),
          com_descripcion: compra.com_descripcion ?? "",
          com_fecha_hora: compra.com_fecha_hora ?? "",
          com_pagado: String(compra.com_pagado ?? "2"),
        });

        const filas = detalle.map((d) => ({
          id_detalle_compra: d.id_detalle_compra ?? d.id,
          id_insumo: String(getInsumoId(d) ?? ""),
          detcom_cantidad: String(d.detcom_cantidad ?? ""),
          detcom_precio_uni: String(d.detcom_precio_uni ?? ""),
        }));

        setRows(
          filas.length
            ? filas
            : [{ id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" }]
        );
      } catch (err) {
        console.error(err);
        setMsg("No se pudo cargar la compra.");
      }
    };

    load();
  }, [id]);

  // vínculos proveedor–insumo
  useEffect(() => {
    const fetchLinks = async () => {
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
      } catch (e) {
        console.error(e);
        setLinksProvInsumo([]);
        setMsg((m) =>
          (m ? m + "\n" : "") +
          "No se pudieron cargar los insumos vinculados al proveedor."
        );
      }
    };

    fetchLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id_proveedor]);

  // Insumos disponibles = sólo los vinculados al proveedor (o todos si no hay vínculos)
  const insumosDisponibles = useMemo(() => {
    if (!linksProvInsumo.length) {
      return insumos;
    }
    const ids = new Set(linksProvInsumo.map((l) => Number(l.id_insumo)));
    return (insumos || []).filter((i) =>
      ids.has(Number(i.id_insumo ?? i.id ?? 0))
    );
  }, [linksProvInsumo, insumos]);

  // Mapa de precios por insumo (como en CompraRegistrar)
  const precioByInsumo = useMemo(() => {
    const m = new Map();
    linksProvInsumo.forEach((r) => {
      const idIns = Number(r.id_insumo);
      const precio = Number(r.precio_unitario ?? 0);
      if (idIns && precio > 0) {
        m.set(idIns, precio);
      }
    });
    return m;
  }, [linksProvInsumo]);

  // ===== Handlers =====
  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const setRow = (index, field, value) => {
    setRows((prev) => {
      const copy = [...prev];
      const newRow = {
        ...copy[index],
        [field]:
          field.includes("cantidad") || field.includes("precio")
            ? toDec(value)
            : value,
      };

      // 👉 si cambia el insumo, traemos el precio del proveedor (si existe)
      if (field === "id_insumo") {
        const pid = Number(value || 0);
        const precio = Number(precioByInsumo.get(pid) || 0);
        if (precio > 0 && !newRow.detcom_precio_uni) {
          newRow.detcom_precio_uni = String(precio);
        }
      }

      copy[index] = newRow;
      return copy;
    });
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id_insumo: "", detcom_cantidad: "", detcom_precio_uni: "" },
    ]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const calcSubtotal = (row) =>
    Number(row.detcom_cantidad || 0) * Number(row.detcom_precio_uni || 0);

  const total = useMemo(
    () => rows.reduce((acc, r) => acc + calcSubtotal(r), 0),
    [rows]
  );

  // Insumos sin repetir por fila + filtrados por proveedor (misma lógica)
  const opcionesInsumosPorFila = (index) => {
    const selectedId = Number(rows[index]?.id_insumo || 0);
    const usedIds = new Set(
      rows
        .filter((_, i) => i !== index)
        .map((r) => Number(r.id_insumo || 0))
    );

    let baseList =
      insumosDisponibles && insumosDisponibles.length
        ? insumosDisponibles
        : insumos;

    let opts = baseList.filter((ins) => {
      const idIns = Number(ins.id_insumo ?? ins.id ?? 0);
      if (!idIns) return false;
      if (idIns === selectedId) return true;
      return !usedIds.has(idIns);
    });

    if (
      selectedId &&
      !opts.some(
        (ins) => Number(ins.id_insumo ?? ins.id ?? 0) === selectedId
      )
    ) {
      const extra = insumos.find(
        (ins) => Number(ins.id_insumo ?? ins.id ?? 0) === selectedId
      );
      if (extra) {
        opts = [extra, ...opts];
      }
    }

    return opts;
  };

  // ===== Guardar =====
  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.id_empleado || !form.id_estado_compra) {
      setMsg("Falta información de cabecera (empleado/estado).");
      return;
    }
    if (!form.id_proveedor) {
      setMsg("Falta el proveedor.");
      return;
    }

    if (!rows.length || rows.every((r) => !r.id_insumo)) {
      setMsg("La compra debe tener al menos un insumo.");
      return;
    }

    for (const r of rows) {
      if (!r.id_insumo) {
        setMsg("Completá todos los insumos.");
        return;
      }
      if (!(Number(r.detcom_cantidad) > 0)) {
        setMsg("La cantidad debe ser mayor a 0.");
        return;
      }
      if (!(Number(r.detcom_precio_uni) > 0)) {
        setMsg("El precio debe ser mayor a 0.");
        return;
      }
    }

    try {
      // 1) Actualizar cabecera
      await api.put(`/api/compras/${id}/`, {
        id_empleado: Number(form.id_empleado),
        id_estado_compra: Number(form.id_estado_compra),
        id_proveedor: Number(form.id_proveedor),
        com_monto: Number(total.toFixed(2)),
        com_descripcion: form.com_descripcion || "",
        com_fecha_hora: form.com_fecha_hora || null,
        com_pagado: Number(form.com_pagado || 2),
      });

      // 2) Borrar detalles existentes
      const detResp = await api.get(`/api/detalle-compras/?id_compra=${id}`);
      for (const d of norm(detResp)) {
        const detId = d.id_detalle_compra ?? d.id;
        if (detId) {
          await api.delete(`/api/detalle-compras/${detId}/`);
        }
      }

      // 3) Crear nuevos detalles
      for (const r of rows) {
        await api.post("/api/detalle-compras/", {
          id_compra: Number(id),
          id_insumo: Number(r.id_insumo),
          detcom_cantidad: Number(r.detcom_cantidad),
          detcom_precio_uni: Number(r.detcom_precio_uni),
        });
      }

      setMsg("Compra actualizada correctamente.");
      setTimeout(() => navigate("/compras"), 800);
    } catch (err) {
      console.error(err);
      const apiMsg =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : "No se pudo actualizar la compra.");
      setMsg(apiMsg);
    }
  };

  const handleCancel = () => navigate("/compras");

  return (
    <DashboardLayout>
      <div className="compra-editar-scope">
        <CompraEditarHeader id={id} msg={msg} />
        <form onSubmit={onSubmit} className="form">
          <CompraEditarCabecera
            form={form}
            empleados={empleados}
            estados={estados}
            proveedores={proveedores}
          />

          <h3 style={{ marginTop: 18, marginBottom: 8 }}>Detalle</h3>

          <CompraEditarDetalleTable
            rows={rows}
            setRow={setRow}
            removeRow={removeRow}
            opcionesInsumosPorFila={opcionesInsumosPorFila}
            blockInvalidDecimal={blockInvalidDecimal}
            calcSubtotal={calcSubtotal}
          />

          <CompraEditarFooter
            total={total}
            onCancel={handleCancel}
            addRow={addRow}
            form={form}
            insumosDisponibles={insumosDisponibles}
          />
        </form>
      </div>
    </DashboardLayout>
  );
}











