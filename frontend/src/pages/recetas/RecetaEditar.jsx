// src/pages/recetas/RecetaEditar.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalizeList(respData) {
  if (Array.isArray(respData)) return respData;
  if (respData?.results && Array.isArray(respData.results)) return respData.results;
  if (respData?.data && Array.isArray(respData.data)) return respData.data;
  return [];
}

// Solo insumos activos (id_estado_insumo = 1)
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
        // Cabecera (tolerando nombres)
        setForm({
          rec_nombre: data.rec_nombre ?? data.plato_nombre ?? "",
          id_plato: String(data.id_plato ?? data?.plato?.id_plato ?? ""),
          rec_descripcion: data.rec_desc ?? data.rec_descripcion ?? "",
          id_estado_receta: String(data.id_estado_receta ?? data.estado ?? "1"),
        });

        // Intento 1: detalles embebidos
        let dets = data.detalles;
        // Intento 2: fallback a endpoint de detalles
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

  // —— helpers
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
      case "id_plato": {
        if (!String(value).trim()) return "Seleccioná un plato.";
        return "";
      }
      case "rec_descripcion": {
        // opcional
        return "";
      }
      case "id_estado_receta": {
        if (!String(value).trim()) return "Seleccioná un estado.";
        return "";
      }
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
      } else {
        // Validaciones por unidad de medida
        const insumoSel = insumos.find(
          (i) => String(i.id_insumo ?? i.id) === String(r.id_insumo)
        );
        const unidad = (insumoSel?.ins_unidad ?? insumoSel?.unidad ?? "")
          .toString()
          .toLowerCase();

        if (unidad) {
          let min = 0;
          let max = Infinity;
          let debeSerEntero = false;

          switch (unidad) {
            case "kg":
              min = 0.001;
              max = 10;
              break;
            case "g":
              min = 1;
              max = 10000;
              break;
            case "u":
              min = 1;
              max = 10;
              debeSerEntero = true;
              break;
            case "l":
              min = 0.001;
              max = 10;
              break;
            case "ml":
              min = 1;
              max = 10000;
              break;
            default:
              break;
          }

          if (debeSerEntero && !Number.isInteger(num)) {
            e.detr_cant_unid =
              "Para unidad 'u' la cantidad debe ser un número entero entre 1 y 10.";
          } else if (num < min || num > max) {
            e.detr_cant_unid = `Para unidad '${unidad}', la cantidad debe estar entre ${min} y ${max}.`;
          }
        }
      }

      if (Object.keys(e).length) errs[idx] = e;
    });

    // 🔁 Validar que no haya insumos repetidos
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

    const re = validateDetalles(rows);
    setRowErrors(re);
  };

  const addDetalle = () => {
    setDetalles((r) => [...r, { id_insumo: "", detr_cant_unid: "" }]);
  };

  const removeDetalle = (idx) => {
    setDetalles((rows) => rows.filter((_, i) => i !== idx));
  };

  // igual que en otros lados
  const platoEstaEnPedidos = async (idPlato) => {
    const endpoints = ["/api/pedidos/"];
    for (const ep of endpoints) {
      try {
        const { data } = await api.get(ep, { params: { page_size: 1000 } });
        const list = normalizeList(data);
        for (const p of list) {
          const dets = p.detalles || p.items || [];
          if (
            Array.isArray(dets) &&
            dets.some((d) => Number(d.id_plato ?? d.plato) === Number(idPlato))
          ) {
            return true;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    return false;
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

    // ⛔ Si intento poner INACTIVO (2) y el PLATO está en pedidos -> bloquear
    if (String(form.id_estado_receta) === "2") {
      const enPedidos = await platoEstaEnPedidos(form.id_plato);
      if (enPedidos) {
        alert(
          "No se puede desactivar la receta: su plato aparece en uno o más pedidos."
        );
        return;
      }
    }

    try {
      // 1) Actualizar cabecera
      // Forzamos que el nombre de la receta sea SIEMPRE igual al nombre del plato,
      // y que el plato vinculado / estado no se puedan cambiar.
      const platoSel = platos.find(
        (p) => String(p.id_plato ?? p.id) === String(form.id_plato)
      );
      const nombrePlato = platoSel
        ? platoSel.pla_nombre ??
          platoSel.plt_nombre ??
          platoSel.nombre ??
          `#${platoSel.id_plato ?? platoSel.id}`
        : form.rec_nombre;

      const updateBody = {
        rec_nombre: nombrePlato,
        id_plato: Number(form.id_plato),
        rec_desc: form.rec_descripcion,
        id_estado_receta: Number(form.id_estado_receta),
      };
      await api.put(`/api/recetas/${id}/`, updateBody);

      // 2) Reemplazar detalles: borrar existentes y crear los nuevos
      try {
        const detRes = await api.get(`/api/detalle-recetas/?id_receta=${id}`);
        const current = normalizeList(detRes.data);
        for (const d of current) {
          const detId = d.id_detalle_receta ?? d.id;
          if (detId) await api.delete(`/api/detalle-recetas/${detId}/`);
        }
      } catch (e2) {
        // si no se puede listar, seguimos (puede que tu API no exponga filtro)
      }
      for (const d of detalles) {
        await api.post(`/api/detalle-recetas/`, {
          id_receta: Number(id),
          id_insumo:
            d.id_insumo === "" || d.id_insumo === null ? 0 : Number(d.id_insumo),
          detr_cant_unid: Number(d.detr_cant_unid),
        });
      }

      setMsg("Receta actualizada correctamente.");
      setTimeout(() => {
        navegarADetalleReceta();
      }, 600);
    } catch (e) {
      console.error(e);
      setMsg(
        e?.response?.data
          ? JSON.stringify(e.response.data, null, 2)
          : "No se pudo actualizar la receta."
      );
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ color: "#fff" }}>Editar receta</h2>

      {msg && (
        <p style={{ color: "#facc15", whiteSpace: "pre-wrap" }}>{msg}</p>
      )}

      <form onSubmit={onSubmit} className="form">
        {/* Cabecera */}
        <div className="row">
          <label>Plato vinculado =</label>
          <input
            value={(() => {
              const pSel = platos.find(
                (p) => String(p.id_plato ?? p.id) === String(form.id_plato)
              );
              return pSel
                ? pSel.pla_nombre ??
                    pSel.plt_nombre ??
                    pSel.nombre ??
                    `#${pSel.id_plato ?? pSel.id}`
                : "";
            })()}
            readOnly
            disabled
          />
        </div>

        <div className="row">
          <label htmlFor="rec_descripcion">Descripción =</label>
          <textarea
            id="rec_descripcion"
            name="rec_descripcion"
            rows={4}
            value={form.rec_descripcion}
            onChange={onChange}
          />
        </div>

        <div className="row">
          <label htmlFor="id_estado_receta">Estado =</label>
          <select
            id="id_estado_receta"
            name="id_estado_receta"
            value={form.id_estado_receta}
            disabled
          >
            <option value="1">Activo</option>
            <option value="2">Inactivo</option>
          </select>
        </div>

        {/* Detalles */}
        <h3 style={{ color: "#fff", marginTop: 20 }}>Insumos de la receta</h3>
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Insumo</th>
                <th style={{ width: "40%" }}>Cantidad</th>
                <th style={{ width: "20%" }}></th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((row, idx) => {
                const e = rowErrors[idx] || {};

                // IDs seleccionados en otras filas (para no repetir)
                const usadosEnOtrasFilas = new Set(
                  detalles
                    .map((r, i2) =>
                      i2 === idx ? null : String(r.id_insumo || "")
                    )
                    .filter(Boolean)
                );

                // lista de insumos activos
                const activos = insumos.filter(esInsumoActivo);

                // insumo actualmente seleccionado en esta fila (puede estar inactivo)
                const seleccionado = insumos.find(
                  (i) => String(i.id_insumo ?? i.id) === String(row.id_insumo)
                );

                // opciones = activos que NO estén ya usados en otras filas
                let opciones = activos.filter(
                  (i) =>
                    !usadosEnOtrasFilas.has(
                      String(i.id_insumo ?? i.id)
                    )
                );

                // si el seleccionado está inactivo o ya no está en activos,
                // lo agregamos igual para que no "desaparezca" en edición
                if (
                  seleccionado &&
                  !opciones.some(
                    (i) =>
                      String(i.id_insumo ?? i.id) ===
                      String(row.id_insumo)
                  )
                ) {
                  opciones = [...opciones, seleccionado];
                }

                return (
                  <tr key={idx}>
                    <td>
                      <select
                        value={row.id_insumo}
                        onChange={(ev) =>
                          onChangeDetalle(idx, "id_insumo", ev.target.value)
                        }
                      >
                        <option value="">-- Seleccioná insumo --</option>
                        {opciones.map((i) => {
                          const idIns = i.id_insumo ?? i.id;
                          const nombre =
                            i.ins_nombre ?? i.nombre ?? `#${idIns}`;
                          const unidad = i.ins_unidad ?? i.unidad ?? "";
                          return (
                            <option key={idIns} value={idIns}>
                              {nombre}
                              {unidad ? ` (${unidad})` : ""}
                            </option>
                          );
                        })}
                      </select>
                      {e.id_insumo && (
                        <small className="err-inline">{e.id_insumo}</small>
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.detr_cant_unid}
                        onChange={(ev) =>
                          onChangeDetalle(
                            idx,
                            "detr_cant_unid",
                            ev.target.value
                          )
                        }
                        onKeyDown={blockInvalidDecimal}
                        placeholder="0.00"
                      />
                      {e.detr_cant_unid && (
                        <small className="err-inline">
                          {e.detr_cant_unid}
                        </small>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => removeDetalle(idx)}
                        disabled={detalles.length === 1}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={addDetalle}
          style={{ marginTop: 8 }}
        >
          Agregar insumo
        </button>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button type="submit" className="btn btn-primary">
            Guardar cambios
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={navegarADetalleReceta}
          >
            Cancelar
          </button>
        </div>
      </form>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.form { max-width: 900px; }
.row { display:flex; align-items:center; margin-bottom:8px; gap:8px; }
.row label { width:220px; color:#eaeaea; }
.row input, .row select, .row textarea {
  flex:1;
  background:#0f0f0f;
  color:#fff;
  border:1px solid #2a2a2a;
  border-radius:8px;
  padding:8px 10px;
}
.table-wrap { overflow:auto; margin-top:6px; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }

/* inputs y selects dentro de la tabla también en negro */
.table-dark select,
.table-dark input {
  background:#0f0f0f;
  color:#fff;
  border:1px solid #2a2a2a;
  border-radius:8px;
  padding:6px 8px;
}

.err { color:#fca5a5; font-size:12px; margin-top:-6px; display:block; margin-left:232px; }
.err-inline { color:#fca5a5; font-size:12px; display:block; margin-top:6px; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;








