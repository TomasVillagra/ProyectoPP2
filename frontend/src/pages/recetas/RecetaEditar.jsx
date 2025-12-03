// src/pages/recetas/RecetaEditar.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import RecetaEditarHeader from "../../components/recetas/RecetaEditarHeader";
import RecetaEditarForm from "../../components/recetas/RecetaEditarForm";
import RecetaEditarDetalles from "../../components/recetas/RecetaEditarDetalles";

import "./RecetaEditar.css";

function normalizeList(respData) {
  if (Array.isArray(respData)) return respData;
  if (respData?.results && Array.isArray(respData.results)) return respData.results;
  if (respData?.data && Array.isArray(respData.data)) return respData.data;
  return [];
}

const esInsumoActivo = (i) => {
  const estado = i.id_estado_insumo ?? i.id_estado ?? null;
  return Number(estado) === 1;
};

export default function RecetaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [platos, setPlatos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [form, setForm] = useState({
    rec_nombre: "",
    id_plato: "",
    rec_descripcion: "",
    id_estado_receta: "1",
  });
  const [detalles, setDetalles] = useState([{ id_insumo: "", detr_cant_unid: "" }]);
  const [errors, setErrors] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchBase = async () => {
      try {
        const [plRes, insRes] = await Promise.all([
          api.get("/api/platos/"),
          api.get("/api/insumos/"),
        ]);
        setPlatos(normalizeList(plRes.data));
        setInsumos(normalizeList(insRes.data));
      } catch (e) {
        console.error(e);
      }
    };

    const fetchReceta = async () => {
      try {
        const { data } = await api.get(`/api/recetas/${id}/`);
        setForm({
          rec_nombre: data.rec_nombre ?? data.plato_nombre ?? "",
          id_plato: String(data.id_plato ?? data?.plato?.id_plato ?? ""),
          rec_descripcion: data.rec_desc ?? data.rec_descripcion ?? "",
          id_estado_receta: String(data.id_estado_receta ?? data.estado ?? "1"),
        });

        let dets = data.detalles;
        if (!Array.isArray(dets)) {
          const detRes = await api.get(`/api/detalle-recetas/?id_receta=${id}`);
          dets = normalizeList(detRes.data);
        }

        const rows = (dets || []).map((d) => ({
          id_insumo: String(d.id_insumo ?? d.insumo ?? d.id ?? ""),
          detr_cant_unid: String(d.detr_cant_unid ?? d.cantidad ?? d.cant ?? ""),
        }));
        setDetalles(rows.length ? rows : [{ id_insumo: "", detr_cant_unid: "" }]);
      } catch (e) {
        console.error(e);
        setDetalles([{ id_insumo: "", detr_cant_unid: "" }]);
      }
    };

    fetchBase();
    fetchReceta();
  }, [id]);

  const sanitizeDecimal = (raw) => {
    if (raw === "" || raw === null || raw === undefined) return "";
    let s = String(raw).replace(/,/g, ".").replace(/[^\d.]/g, "");
    const parts = s.split(".");
    if (parts.length > 2) s = parts.shift() + "." + parts.join("");
    return s;
  };

  const blockInvalidDecimal = (e) => {
    const invalid = ["-", "+", "e", "E", " "];
    if (invalid.includes(e.key)) e.preventDefault();
  };

  const validateField = (name, value) => {
    switch (name) {
      case "id_plato":
        if (!String(value).trim()) return "Seleccioná un plato.";
        return "";
      case "id_estado_receta":
        if (!String(value).trim()) return "Seleccioná un estado.";
        return "";
      default:
        return "";
    }
  };

  const validateDetalles = (rows) => {
    const errs = {};
    rows.forEach((r, idx) => {
      const e = {};
      if (!String(r.id_insumo).trim()) {
        e.id_insumo = "Seleccioná un insumo.";
      }

      const num = Number(r.detr_cant_unid);
      if (r.detr_cant_unid === "" || Number.isNaN(num) || num <= 0) {
        e.detr_cant_unid = "Cantidad debe ser > 0.";
      }

      if (Object.keys(e).length) errs[idx] = e;
    });

    const usados = {};
    rows.forEach((r, idx) => {
      const idIns = String(r.id_insumo || "");
      if (!idIns) return;
      if (!usados[idIns]) usados[idIns] = [];
      usados[idIns].push(idx);
    });

    Object.values(usados).forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((i) => {
          if (!errs[i]) errs[i] = {};
          errs[i].id_insumo = "Este insumo ya está agregado en otra fila.";
        });
      }
    });

    return errs;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const onChangeDetalle = (idx, name, value) => {
    const rows = [...detalles];
    let v = value;
    if (name === "detr_cant_unid") v = sanitizeDecimal(value);
    rows[idx] = { ...rows[idx], [name]: v };
    setDetalles(rows);
    setRowErrors(validateDetalles(rows));
  };

  const addDetalle = () => {
    setDetalles((r) => [...r, { id_insumo: "", detr_cant_unid: "" }]);
  };

  const removeDetalle = (idx) => {
    setDetalles((rows) => rows.filter((_, i) => i !== idx));
  };

  const navegarADetalleReceta = () => {
    if (form.id_plato) {
      navigate(`/platos/${form.id_plato}/receta`);
    } else {
      navigate("/platos");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const eAll = {};
    Object.keys(form).forEach((k) => {
      const m = validateField(k, form[k]);
      if (m) eAll[k] = m;
    });
    setErrors(eAll);

    const detErrs = validateDetalles(detalles);
    setRowErrors(detErrs);

    if (Object.keys(eAll).length || Object.keys(detErrs).length) return;

    try {
      await api.put(`/api/recetas/${id}/`, {
        rec_nombre: form.rec_nombre,
        id_plato: Number(form.id_plato),
        rec_desc: form.rec_descripcion,
        id_estado_receta: Number(form.id_estado_receta),
      });

      try {
        const detRes = await api.get(`/api/detalle-recetas/?id_receta=${id}`);
        const current = normalizeList(detRes.data);
        for (const d of current) {
          const detId = d.id_detalle_receta ?? d.id;
          if (detId) await api.delete(`/api/detalle-recetas/${detId}/`);
        }
      } catch {}

      for (const d of detalles) {
        await api.post(`/api/detalle-recetas/`, {
          id_receta: Number(id),
          id_insumo: Number(d.id_insumo),
          detr_cant_unid: Number(d.detr_cant_unid),
        });
      }

      setMsg("Receta actualizada correctamente.");
      setTimeout(() => navegarADetalleReceta(), 600);
    } catch (e) {
      setMsg("No se pudo actualizar la receta.");
    }
  };

  return (
    <DashboardLayout>
      <RecetaEditarHeader />

      {msg && <p className="receta-edit-msg">{msg}</p>}

      <form onSubmit={onSubmit} className="receta-edit-form">
        <RecetaEditarForm
          form={form}
          platos={platos}
          onChange={onChange}
          errors={errors}
        />

        <RecetaEditarDetalles
          detalles={detalles}
          insumos={insumos}
          rowErrors={rowErrors}
          onChangeDetalle={onChangeDetalle}
          removeDetalle={removeDetalle}
          addDetalle={addDetalle}
          blockInvalidDecimal={blockInvalidDecimal}
          esInsumoActivo={esInsumoActivo}
        />

        <div className="receta-edit-buttons">
          <button
            type="submit"
            className="receta-edit-btn receta-edit-btn-primary"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            className="receta-edit-btn receta-edit-btn-secondary"
            onClick={navegarADetalleReceta}
          >
            Cancelar
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}












