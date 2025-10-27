import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalize(resp) {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}
async function fetchCatalog(candidates) {
  for (const url of candidates) {
    try {
      const res = await api.get(url);
      const arr = normalize(res);
      if (Array.isArray(arr)) return arr;
    } catch {}
  }
  return [];
}

const mesaLabel = (m) =>
  m?.ms_numero != null
    ? `Mesa ${m.ms_numero}`
    : m?.numero != null
    ? `Mesa ${m.numero}`
    : `#${m?.id_mesa ?? m?.id ?? "?"}`;

const empleadoLabel = (e) => {
  const nom = [e?.emp_nombre ?? e?.nombre, e?.emp_apellido ?? e?.apellido]
    .filter(Boolean)
    .join(" ");
  return nom || `Empleado #${e?.id_empleado ?? e?.id ?? "?"}`;
};
const clienteLabel = (c) =>
  c?.cli_nombre ?? c?.nombre ?? `Cliente #${c?.id_cliente ?? c?.id ?? "?"}`;
const estadoLabel = (s) =>
  s?.estped_nombre ?? s?.nombre ?? `Estado #${s?.id_estado_pedido ?? s?.id ?? "?"}`;
const tipoLabel = (t) =>
  t?.tipped_nombre ?? t?.nombre ?? `Tipo #${t?.id_tipo_pedido ?? t?.id ?? "?"}`;
const platoLabel = (p) => {
  const id = p?.id_plato ?? p?.id;
  const nombre = p?.plt_nombre ?? p?.nombre ?? `#${id}`;
  const precio = p?.plt_precio ?? p?.precio;
  return precio != null ? `${nombre} ($${Number(precio).toFixed(2)})` : nombre;
};

const mesaEstadoNombre = (m) =>
  (m?.estado_mesa_nombre ?? m?.id_estado_mesa?.estms_nombre ?? "").toLowerCase();
const isMesaDisponible = (m) => mesaEstadoNombre(m) === "disponible";

// input datetime-local
function toInputDateTime(val) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (!isNaN(d)) return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    return String(val).slice(0, 16);
  } catch {
    return "";
  }
}

export default function PedidoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mesas, setMesas] = useState([]);
  const [empleadoActual, setEmpleadoActual] = useState(null); // NUEVO
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [estadosMesa, setEstadosMesa] = useState([]);

  const [form, setForm] = useState({
    id_mesa: "",
    id_empleado: "",
    id_cliente: "",
    id_estado_pedido: "", // En Proceso
    id_tipo_pedido: "1",
    ped_descripcion: "",
    ped_fecha_hora_ini: "",
  });
  const [detalles, setDetalles] = useState([{ id_plato: "", detped_cantidad: "" }]);
  const [rowErrors, setRowErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [catalogMsg, setCatalogMsg] = useState([]);

  const getEmpleadoActual = async () => {
    try {
      const { data } = await api.get("/api/empleados/me/");
      const idEmp = data.id_empleado ?? data.id;
      setEmpleadoActual(data);
      setForm((p) => ({ ...p, id_empleado: String(idEmp || "") }));
    } catch {
      console.warn("No se pudo obtener el empleado actual (/api/empleados/me/).");
    }
  };

  useEffect(() => {
    (async () => {
      const msgs = [];

      const [mesasArr, clientesArr, estadosArr, tiposArr, platosArr] = await Promise.all([
        fetchCatalog(["/api/mesas/", "/api/mesa/", "/api/mesas?limit=500"]),
        fetchCatalog(["/api/clientes/", "/api/cliente/", "/api/clientes?limit=500"]),
        fetchCatalog(["/api/estado-pedidos/", "/api/estado_pedidos/", "/api/estados-pedido/"]),
        fetchCatalog(["/api/tipo-pedidos/", "/api/tipo_pedidos/", "/api/tipos-pedido/"]),
        fetchCatalog(["/api/platos/", "/api/plato/", "/api/platos?limit=1000"]),
      ]);

      setMesas(mesasArr); if (mesasArr.length === 0) msgs.push("No se pudieron cargar Mesas.");
      setClientes(clientesArr); if (clientesArr.length === 0) msgs.push("No se pudieron cargar Clientes.");
      setEstados(estadosArr); if (estadosArr.length === 0) msgs.push("No se pudieron cargar Estados de pedido.");
      setTipos(tiposArr); if (tiposArr.length === 0) msgs.push("No se pudieron cargar Tipos de pedido.");
      setPlatos(platosArr); if (platosArr.length === 0) msgs.push("No se pudieron cargar Platos.");

      const estMesaArr = await fetchCatalog(["/api/estados-mesa/", "/api/estado-mesas/"]);
      setEstadosMesa(estMesaArr || []);

      // cargar pedido
      const pedRes = await api.get(`/api/pedidos/${id}/`);
      const ped = pedRes.data;

      // Empleado actual
      await getEmpleadoActual();

      // Fijar "En Proceso"
      const enProc =
        estadosArr.find((s) => String(s.estped_nombre ?? s.nombre ?? "").toLowerCase() === "en proceso") ||
        estadosArr.find((s) => String(s.nombre ?? "").toLowerCase() === "en proceso");

      setForm((p) => ({
        ...p,
        id_mesa: String(ped.id_mesa ?? ""),
        id_cliente: String(ped.id_cliente ?? ""),
        id_estado_pedido: String(enProc ? (enProc.id_estado_pedido ?? enProc.id) : (ped.id_estado_pedido ?? "")),
        id_tipo_pedido: String(ped.id_tipo_pedido ?? "1"),
        ped_descripcion: ped.ped_descripcion ?? "",
        ped_fecha_hora_ini: toInputDateTime(ped.ped_fecha_hora_ini) || "",
      }));

      // detalles
      let dets = ped.detalles;
      if (!Array.isArray(dets)) {
        const detRes = await api.get(`/api/detalle-pedidos/?id_pedido=${id}`);
        dets = normalize(detRes);
      }
      const rows = (dets || []).map((d) => ({
        id_plato: String(d.id_plato ?? d.plato ?? d.id ?? ""),
        detped_cantidad: String(d.detped_cantidad ?? d.cantidad ?? ""),
        _id_det: d.id_detalle_pedido ?? d.id ?? undefined,
      }));
      setDetalles(rows.length ? rows : [{ id_plato: "", detped_cantidad: "" }]);
      setCatalogMsg(msgs);
    })();
  }, [id]);

  const sanitizeInt = (raw) => (raw === "" || raw == null ? "" : String(raw).replace(/[^\d]/g, ""));
  const blockInvalidInt = (e) => {
    const invalid = ["-", "+", "e", "E", ".", ",", " "];
    if (invalid.includes(e.key)) e.preventDefault();
  };

  const validateRows = (rows) => {
    const out = {};
    rows.forEach((r, i) => {
      const e = {};
      if (!String(r.id_plato).trim()) e.id_plato = "Seleccioná un plato.";
      const q = Number(r.detped_cantidad);
      if (r.detped_cantidad === "" || !Number.isFinite(q) || q <= 0) e.detped_cantidad = "Cantidad > 0.";
      if (Object.keys(e).length) out[i] = e;
    });
    return out;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    const v = ["id_mesa", "id_empleado", "id_cliente", "id_estado_pedido", "id_tipo_pedido"].includes(name)
      ? sanitizeInt(value)
      : value;
    setForm((p) => ({ ...p, [name]: v }));
  };

  const onRowChange = (idx, name, value) => {
    const rows = [...detalles];
    const v = name === "detped_cantidad" ? sanitizeInt(value) : value;
    rows[idx] = { ...rows[idx], [name]: v };
    setDetalles(rows);
    setRowErrors(validateRows(rows));
  };

  const addRow = () => setDetalles((p) => [...p, { id_plato: "", detped_cantidad: "" }]);
  const removeRow = (idx) => {
    setDetalles((p) => p.filter((_, i) => i !== idx));
    setRowErrors((prev) => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const total = useMemo(() => {
    const getPrecio = (pid) => {
      const p = platos.find((pp) => (pp.id_plato ?? pp.id) === Number(pid));
      return Number(p?.plt_precio ?? p?.precio ?? 0);
    };
    return detalles.reduce((acc, r) => {
      const q = Number(r.detped_cantidad || 0);
      const price = getPrecio(r.id_plato);
      if (!Number.isFinite(q) || !Number.isFinite(price)) return acc;
      return acc + q * price;
    }, 0);
  }, [detalles, platos]);

  const getEstadoMesaId = (nombre) => {
    const n = String(nombre || "").toLowerCase();
    return estadosMesa.find((e) => String(e.estms_nombre).toLowerCase() === n)?.id_estado_mesa;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const detErrs = validateRows(detalles);
    setRowErrors(detErrs);
    if (Object.keys(detErrs).length) return;

    try {
      // 1) actualizar cabecera (empleado y estado ya fijados)
      await api.put(`/api/pedidos/${id}/`, {
        id_mesa: form.id_mesa ? Number(form.id_mesa) : null,
        id_empleado: form.id_empleado ? Number(form.id_empleado) : null,
        id_cliente: form.id_cliente ? Number(form.id_cliente) : null,
        id_estado_pedido: Number(form.id_estado_pedido), // En Proceso
        id_tipo_pedido: Number(form.id_tipo_pedido),
        ped_descripcion: form.ped_descripcion || "",
        ped_fecha_hora_ini: form.ped_fecha_hora_ini,
      });

      // 2) Reemplazar detalles
      const existing = await api.get(`/api/detalle-pedidos/?id_pedido=${id}`);
      const rows = normalize(existing);
      await Promise.all(rows.map((r) => api.delete(`/api/detalle-pedidos/${r.id_detalle_pedido || r.id}/`)));
      await Promise.all(detalles.map((d) =>
        api.post(`/api/detalle-pedidos/`, {
          id_pedido: Number(id),
          id_plato: Number(d.id_plato),
          detped_cantidad: Number(d.detped_cantidad),
        })
      ));

      // 3) En Proceso ⇒ mesa Ocupada
      try {
        if (form.id_mesa) {
          const ocupadaId = getEstadoMesaId("ocupada");
          if (ocupadaId) {
            await api.patch(`/api/mesas/${form.id_mesa}/`, { id_estado_mesa: Number(ocupadaId) });
          }
        }
      } catch (e2) {
        console.warn("No se pudo actualizar la mesa:", e2?.response?.data || e2?.message);
      }

      setMsg("Pedido actualizado");
      setTimeout(() => navigate("/pedidos"), 700);
    } catch (err) {
      console.error(err);
      const apiMsg = err?.response?.data ? JSON.stringify(err.response.data, null, 2) : "Error inesperado";
      setMsg(`No se pudo actualizar el pedido:\n${apiMsg}`);
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Editar Pedido</h2>
      {catalogMsg.length > 0 && (
        <div style={{ background: "#3a3a3c", color: "#facc15", padding: "10px 12px", borderRadius: 8, marginBottom: 12 }}>
          {catalogMsg.map((m, i) => <div key={i}>• {m}</div>)}
        </div>
      )}
      {msg && <pre style={{ whiteSpace: "pre-wrap" }}>{msg}</pre>}

      <form onSubmit={onSubmit} className="form">
        <div className="row">
          <label>Empleado =</label>
          <input value={empleadoActual ? empleadoLabel(empleadoActual) : "—"} disabled />
        </div>

        <div className="row">
          <label htmlFor="id_mesa">Mesa =</label>
          <select id="id_mesa" name="id_mesa" value={form.id_mesa} onChange={onChange}>
            <option value="">— Seleccioná mesa —</option>
            {mesas
              .filter((m) => {
                const idm = String(m.id_mesa ?? m.id);
                // Mostrar la actual aunque no esté disponible
                return isMesaDisponible(m) || idm === form.id_mesa;
              })
              .map((m) => (
                <option key={m.id_mesa ?? m.id} value={m.id_mesa ?? m.id}>
                  {mesaLabel(m)}
                </option>
              ))}
          </select>
        </div>

        <div className="row">
          <label htmlFor="id_cliente">Cliente =</label>
          <select id="id_cliente" name="id_cliente" value={form.id_cliente} onChange={onChange}>
            <option value="">— Seleccioná cliente —</option>
            {clientes.map((c) => (
              <option key={c.id_cliente ?? c.id} value={c.id_cliente ?? c.id}>
                {clienteLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label>Estado =</label>
          <input value="En Proceso" disabled />
        </div>

        <div className="row">
          <label htmlFor="id_tipo_pedido">Tipo =</label>
          <select id="id_tipo_pedido" name="id_tipo_pedido" value={form.id_tipo_pedido} onChange={onChange} required>
            {tipos.map((t) => (
              <option key={t.id_tipo_pedido ?? t.id} value={t.id_tipo_pedido ?? t.id}>
                {tipoLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label htmlFor="ped_fecha_hora_ini">Fecha y hora de inicio =</label>
          <input
            type="datetime-local"
            id="ped_fecha_hora_ini"
            name="ped_fecha_hora_ini"
            value={form.ped_fecha_hora_ini}
            onChange={onChange}
            required
          />
        </div>

        <div className="row">
          <label htmlFor="ped_descripcion">Descripción =</label>
          <textarea id="ped_descripcion" name="ped_descripcion" rows={3} value={form.ped_descripcion} onChange={onChange} />
        </div>

        {/* Detalles */}
        <h3 style={{ marginTop: 18, marginBottom: 8, color: "#fff" }}>Detalles</h3>
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th style={{ width: "60%" }}>Plato</th>
                <th style={{ width: "20%" }}>Cantidad</th>
                <th style={{ width: "20%" }}></th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((row, idx) => {
                const e = rowErrors[idx] || {};
                return (
                  <tr key={idx}>
                    <td>
                      <select value={row.id_plato} onChange={(ev) => onRowChange(idx, "id_plato", ev.target.value)}>
                        <option value="">— Seleccioná plato —</option>
                        {platos.map((p) => (
                          <option key={p.id_plato ?? p.id} value={p.id_plato ?? p.id}>
                            {platoLabel(p)}
                          </option>
                        ))}
                      </select>
                      {e.id_plato && <small className="err-inline">{e.id_plato}</small>}
                    </td>
                    <td>
                      <input
                        type="text" inputMode="numeric"
                        value={row.detped_cantidad}
                        onChange={(ev) => onRowChange(idx, "detped_cantidad", ev.target.value)}
                        onKeyDown={blockInvalidInt}
                        placeholder="0"
                      />
                      {e.detped_cantidad && <small className="err-inline">{e.detped_cantidad}</small>}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => {
                        setDetalles((p) => p.filter((_, i) => i !== idx));
                        setRowErrors((prev) => { const n = { ...prev }; delete n[idx]; return n; });
                      }} disabled={detalles.length === 1}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 8, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" className="btn btn-secondary" onClick={() => setDetalles((p) => [...p, { id_plato: "", detped_cantidad: "" }])}>
            Agregar renglón
          </button>
          <div style={{ color: "#eaeaea" }}>
            Total estimado: <strong>${total.toFixed(2)}</strong>
          </div>
        </div>

        <div>
          <button type="submit" className="btn btn-primary">Guardar cambios</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/pedidos")} style={{ marginLeft: 10 }}>
            Cancelar
          </button>
        </div>
      </form>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.form .row { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
.form label { min-width:220px; text-align:right; color:#d1d5db; }
textarea, input, select { width:100%; background:#0f0f0f; color:#fff; border:1px solid #2a2a2a; border-radius:8px; padding:10px 12px; }
.table-wrap { overflow:auto; margin-top:6px; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }
.err-inline { color:#fca5a5; font-size:12px; display:block; margin-top:6px; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;


