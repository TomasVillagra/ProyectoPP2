// src/components/recetas/RecetaEditarForm.jsx

export default function RecetaEditarForm({
  form,
  platos,
  onChange,
}) {
  return (
    <>
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
    </>
  );
}
