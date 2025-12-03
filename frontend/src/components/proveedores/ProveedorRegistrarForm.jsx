export default function ProveedorRegistrarForm({
  form,
  errors,
  estados,
  categorias,
  nuevaCategoria,
  catMsg,
  catLoading,
  onChange,
  onBlur,
  setNuevaCategoria,
  handleCrearCategoria,
}) {
  return (
    <>
      {/* Nombre (compacto y más chico) */}
      <div className="prov-reg-row prov-reg-row--compact">
        <label htmlFor="prov_nombre">Nombre</label>
        <input
          id="prov_nombre"
          name="prov_nombre"
          className="prov-reg-input-nombre"
          value={form.prov_nombre}
          onChange={onChange}
          onBlur={onBlur}
          required
          maxLength={120}
        />
        {errors.prov_nombre && (
          <small className="prov-reg-error">
            {errors.prov_nombre}
          </small>
        )}
      </div>

      {/* Categoría + crear categoría */}
      <div className="prov-reg-row">
        <label htmlFor="id_categoria_prov">Categoría</label>
        <select
          id="id_categoria_prov"
          name="id_categoria_prov"
          value={form.id_categoria_prov}
          onChange={onChange}
          onBlur={onBlur}
          required
        >
          <option value="">Elegí una categoría…</option>
          {categorias.map((c) => (
            <option
              key={c.id_categoria_prov ?? c.id}
              value={c.id_categoria_prov ?? c.id}
            >
              {c.catprov_nombre ?? c.nombre}
            </option>
          ))}
        </select>
        {errors.id_categoria_prov && (
          <small className="prov-reg-error">
            {errors.id_categoria_prov}
          </small>
        )}

        {/* Crear nueva categoría */}
        <div className="prov-reg-newcat">
          <span className="prov-reg-newcat-label">
            O crear nueva categoría
          </span>
          <div className="prov-reg-newcat-row">
            <input
              type="text"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              placeholder="Nombre nueva categoría"
              maxLength={60}
              disabled={catLoading}
            />
            <button
              type="button"
              className="prov-reg-btn prov-reg-btn-secondary prov-reg-btn-sm"
              onClick={handleCrearCategoria}
              disabled={catLoading || !nuevaCategoria.trim()}
            >
              {catLoading ? "Agregando..." : "Agregar"}
            </button>
          </div>
          {catMsg && (
            <small
              className={
                "prov-reg-info" +
                (catMsg.toLowerCase().includes("error")
                  ? " prov-reg-info-error"
                  : "")
              }
            >
              {catMsg}
            </small>
          )}
        </div>
      </div>

      {/* Teléfono */}
      <div className="prov-reg-row">
        <label htmlFor="prov_tel">Teléfono</label>
        <input
          id="prov_tel"
          name="prov_tel"
          value={form.prov_tel}
          onChange={onChange}
          onBlur={onBlur}
          required
          maxLength={14}
          placeholder="+549..."
        />
        {errors.prov_tel && (
          <small className="prov-reg-error">
            {errors.prov_tel}
          </small>
        )}
      </div>

      {/* Correo (también compacto) */}
      <div className="prov-reg-row prov-reg-row--compact">
        <label htmlFor="prov_correo">Correo (Opcional)</label>
        <input
          id="prov_correo"
          name="prov_correo"
          type="email"
          value={form.prov_correo}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={30}
        />
        {errors.prov_correo && (
          <small className="prov-reg-error">
            {errors.prov_correo}
          </small>
        )}
      </div>

      {/* Dirección (ocupa todo el ancho) */}
      <div className="prov-reg-row prov-reg-row-span-2">
        <label htmlFor="prov_direccion">Dirección</label>
        <input
          id="prov_direccion"
          name="prov_direccion"
          value={form.prov_direccion}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={150}
        />
        {errors.prov_direccion && (
          <small className="prov-reg-error">
            {errors.prov_direccion}
          </small>
        )}
      </div>

      {/* Estado */}
      <div className="prov-reg-row prov-reg-row--compact">
        <label htmlFor="id_estado_prov">Estado</label>
        <select
          id="id_estado_prov"
          name="id_estado_prov"
          value={form.id_estado_prov}
          onChange={onChange}
          onBlur={onBlur}
          required
        >
          <option value="">Elegí un estado…</option>
          {estados.map((e) => (
            <option
              key={e.id_estado_prov ?? e.id}
              value={e.id_estado_prov ?? e.id}
            >
              {e.estprov_nombre ?? e.nombre}
            </option>
          ))}
        </select>
        {errors.id_estado_prov && (
          <small className="prov-reg-error">
            {errors.id_estado_prov}
          </small>
        )}
      </div>
    </>
  );
}

