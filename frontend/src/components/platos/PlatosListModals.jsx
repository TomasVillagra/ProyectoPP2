export default function PlatosListModals({
  // producir
  showProd,
  onCloseProd,
  prodPlato,
  prodCantidad,
  setProdCantidad,
  prodMsg,
  producir,
  producing,
  // categoría
  showCatModal,
  onCloseCat,
  catName,
  setCatName,
  catError,
  guardarCategoria,
  savingCat,
}) {
  return (
    <>
      {showProd && (
        <div
          className="platos-modal-backdrop"
          onClick={onCloseProd}
        >
          <div
            className="platos-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="platos-modal-title">
              Cargar stock de plato
            </h3>
            <p className="platos-modal-text">
              Ingresá la <strong>cantidad</strong> a producir. Se
              validará el stock de insumos según la{" "}
              <strong>receta</strong>. Si falta algún insumo, no se
              descontará nada.
            </p>
            <div className="platos-modal-body">
              <div className="platos-modal-line">
                Plato:{" "}
                <strong>
                  {prodPlato?.pla_nombre ??
                    prodPlato?.plt_nombre ??
                    prodPlato?.nombre ??
                    `#${prodPlato?.id_plato ?? prodPlato?.id}`}
                </strong>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Cantidad"
                value={prodCantidad}
                onChange={(e) => setProdCantidad(e.target.value)}
                className="platos-modal-input"
                disabled={producing}
              />
            </div>
            {prodMsg && (
              <pre className="platos-modal-warn">
                {prodMsg}
              </pre>
            )}
            <div className="platos-modal-actions">
              <button
                type="button"
                className="platos-btn-secondary"
                onClick={onCloseProd}
                disabled={producing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="platos-btn-primary"
                onClick={producir}
                disabled={producing}
              >
                {producing ? "Procesando..." : "Producir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCatModal && (
        <div
          className="platos-modal-backdrop"
          onClick={onCloseCat}
        >
          <div
            className="platos-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="platos-modal-title">
              Agregar categoría de plato
            </h3>
            <p className="platos-modal-text">
              Ingresá el nombre de la categoría. No se permiten
              nombres repetidos.
            </p>
            <input
              type="text"
              placeholder="Ej. Pizzas especiales"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="platos-modal-input"
              disabled={savingCat}
            />
            {catError && (
              <div className="platos-modal-error">
                {catError}
              </div>
            )}
            <div className="platos-modal-actions">
              <button
                type="button"
                className="platos-btn-secondary"
                onClick={onCloseCat}
                disabled={savingCat}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="platos-btn-primary"
                onClick={guardarCategoria}
                disabled={savingCat}
              >
                {savingCat ? "Guardando..." : "Guardar categoría"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
