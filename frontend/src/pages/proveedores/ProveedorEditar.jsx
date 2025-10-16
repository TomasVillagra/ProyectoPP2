import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function ProveedorEditar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [estados, setEstados] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [form, setForm] = useState({
    prov_nombre: "", prov_tel: "", prov_correo: "", prov_direccion: "",
    id_estado_prov: "1",
    id_categoria_prov: "",
  });

  useEffect(() => {
    Promise.all([
      api.get(`/api/proveedores/${id}/`),
      api.get("/api/estados-proveedor/"),
      api.get("/api/categorias-proveedor/"),
    ]).then(([pRes, eRes, cRes]) => {
      const p = pRes.data || {};
      setForm({
        prov_nombre: p.prov_nombre ?? "",
        prov_tel: p.prov_tel ?? "",
        prov_correo: p.prov_correo ?? "",
        prov_direccion: p.prov_direccion ?? "",
        id_estado_prov: String(p.id_estado_prov ?? 1),
        id_categoria_prov: String(p.id_categoria_prov ?? ""),
      });
      setEstados(Array.isArray(eRes.data?.results) ? eRes.data.results : eRes.data);
      setCategorias(Array.isArray(cRes.data?.results) ? cRes.data.results : cRes.data);
    });
  }, [id]);

  const onChange = (e) => setForm((f)=>({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.put(`/api/proveedores/${id}/`, {
        ...form,
        id_estado_prov: Number(form.id_estado_prov),
        id_categoria_prov: form.id_categoria_prov ? Number(form.id_categoria_prov) : null,
      });
      setMsg("Proveedor actualizado correctamente ✅");
      setTimeout(()=> navigate("/proveedores"), 1100);
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.detail || "Error al actualizar proveedor");
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ margin:0, marginBottom:12 }}>Editar Proveedor</h2>
      {msg && <p style={{ marginBottom:12 }}>{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <div className="row">
          <label htmlFor="prov_nombre">Nombre =</label>
          <input id="prov_nombre" name="prov_nombre" value={form.prov_nombre} onChange={onChange} required />
        </div>
        <div className="row">
          <label htmlFor="prov_tel">Teléfono =</label>
          <input id="prov_tel" name="prov_tel" value={form.prov_tel} onChange={onChange} />
        </div>
        <div className="row">
          <label htmlFor="prov_correo">Correo =</label>
          <input id="prov_correo" name="prov_correo" value={form.prov_correo} onChange={onChange} />
        </div>
        <div className="row">
          <label htmlFor="prov_direccion">Dirección =</label>
          <input id="prov_direccion" name="prov_direccion" value={form.prov_direccion} onChange={onChange} />
        </div>

        <div className="row">
          <label htmlFor="id_estado_prov">Estado =</label>
          <select id="id_estado_prov" name="id_estado_prov" value={form.id_estado_prov} onChange={onChange} required>
            {estados.map((e) => (
              <option key={e.id_estado_prov} value={e.id_estado_prov}>{e.estprov_nombre}</option>
            ))}
          </select>
        </div>

        <div className="row">
          <label htmlFor="id_categoria_prov">Categoría =</label>
          <select
            id="id_categoria_prov"
            name="id_categoria_prov"
            value={form.id_categoria_prov}
            onChange={onChange}
            required
          >
            <option value="">Elegí una categoría…</option>
            {categorias.map((c) => (
              <option key={c.id_categoria_prov} value={c.id_categoria_prov}>{c.catprov_nombre}</option>
            ))}
          </select>
        </div>

        <div className="actions">
          <button type="submit" className="btn primary">Guardar cambios</button>
          <button type="button" className="btn ghost" onClick={()=>navigate("/proveedores")}>Cancelar</button>
        </div>
      </form>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
  .form { display:grid; gap:12px; max-width: 980px; }
  .row {
    display:grid; grid-template-columns: 220px 1fr; gap:12px; align-items:center;
    background:#121212; border:1px solid #232323; border-radius:12px; padding:12px 14px;
  }
  label { color:#bdbdbd; font-weight:600; letter-spacing:.2px; justify-self:end; }
  input, select {
    width:100%; background:#0f0f0f; color:#fff; border:1px solid #2a2a2a; border-radius:10px; padding:10px 12px; outline:none;
  }
  input:focus, select:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.2); }
  .actions { display:flex; gap:10px; margin-top:6px; }
  .btn { padding:10px 14px; border-radius:10px; border:1px solid #2a2a2a; cursor:pointer; }
  .btn.primary { background:#2563eb; border-color:#2563eb; color:#fff; font-weight:700; }
  .btn.primary:hover { filter:brightness(1.05); }
  .btn.ghost { background:transparent; color:#eaeaea; }
  .btn.ghost:hover { background:#1b1b1b; }
`;
