import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

const ESTADOS = [
  { id: 1, label: "Activo" },
  { id: 2, label: "Inactivo" },
];

export default function InsumoRegistrar() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    ins_nombre: "",
    ins_unidad: "",
    ins_stock_actual: "",
    ins_punto_reposicion: "",
    ins_stock_min: "",
    ins_stock_max: "",
    id_estado_insumo: "1",
  });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/api/insumos/", {
        ...form,
        id_estado_insumo: Number(form.id_estado_insumo),
        ins_stock_actual: form.ins_stock_actual ? Number(form.ins_stock_actual) : 0,
        ins_punto_reposicion: form.ins_punto_reposicion ? Number(form.ins_punto_reposicion) : 0,
        ins_stock_min: form.ins_stock_min ? Number(form.ins_stock_min) : 0,
        ins_stock_max: form.ins_stock_max ? Number(form.ins_stock_max) : null,
      });
      setMsg("Insumo creado correctamente ✅");
      setTimeout(() => navigate("/inventario"), 1200);
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.detail || "Error al registrar insumo");
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Registrar Insumo</h2>
      {msg && <p style={{ marginBottom: 12 }}>{msg}</p>}

      <form onSubmit={onSubmit} className="form">
        <div className="row">
          <label htmlFor="ins_nombre">Nombre =</label>
          <input id="ins_nombre" name="ins_nombre" value={form.ins_nombre} onChange={onChange} required placeholder="Ej. Harina 000" />
        </div>
        <div className="row">
          <label htmlFor="ins_unidad">Unidad =</label>
          <input id="ins_unidad" name="ins_unidad" value={form.ins_unidad} onChange={onChange} required placeholder="kg, lt, un…" />
        </div>
        <div className="row">
          <label htmlFor="ins_stock_actual">Stock actual =</label>
          <input id="ins_stock_actual" name="ins_stock_actual" type="number" step="0.01" value={form.ins_stock_actual} onChange={onChange} required />
        </div>
        <div className="row">
          <label htmlFor="ins_punto_reposicion">Punto de reposición =</label>
          <input id="ins_punto_reposicion" name="ins_punto_reposicion" type="number" step="0.01" value={form.ins_punto_reposicion} onChange={onChange} required />
        </div>
        <div className="row">
          <label htmlFor="ins_stock_min">Stock mínimo =</label>
          <input id="ins_stock_min" name="ins_stock_min" type="number" step="0.01" value={form.ins_stock_min} onChange={onChange} required />
        </div>
        <div className="row">
          <label htmlFor="ins_stock_max">Stock máximo =</label>
          <input id="ins_stock_max" name="ins_stock_max" type="number" step="0.01" value={form.ins_stock_max} onChange={onChange} placeholder="" />
        </div>
        <div className="row">
          <label htmlFor="id_estado_insumo">Estado =</label>
          <select id="id_estado_insumo" name="id_estado_insumo" value={form.id_estado_insumo} onChange={onChange} required>
            {ESTADOS.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>

        <div className="actions">
          <button type="submit" className="btn primary">Registrar insumo</button>
          <button type="button" className="btn ghost" onClick={() => navigate("/inventario")}>Cancelar</button>
        </div>
      </form>

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
  .form { display: grid; gap: 12px; max-width: 980px; }
  .row {
    display: grid; grid-template-columns: 220px 1fr;
    gap: 12px; align-items: center;
    background: #121212; border: 1px solid #232323;
    border-radius: 12px; padding: 12px 14px;
  }
  label { color: #bdbdbd; font-weight: 600; letter-spacing: .2px; justify-self: end; }
  input, select {
    width: 100%; background: #0f0f0f; color: #fff;
    border: 1px solid #2a2a2a; border-radius: 10px; padding: 10px 12px; outline: none;
  }
  input:focus, select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.2); }
  .actions { display: flex; gap: 10px; margin-top: 6px; }
  .btn { padding: 10px 14px; border-radius: 10px; border: 1px solid #2a2a2a; cursor: pointer; }
  .btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 700; }
  .btn.primary:hover { filter: brightness(1.05); }
  .btn.ghost { background: transparent; color: #eaeaea; }
  .btn.ghost:hover { background: #1b1b1b; }
`;
