import { Link } from "react-router-dom";

export default function ProveedorInsumosVincular({
  id,
  q,
  setQ,
  open,
  setOpen,
  active,
  setActive,
  inputRef,
  listRef,
  clickingListRef,
  priceInput,
  setPriceInput,
  priceRef,
  selInsumo,
  setSelInsumo,
  insumosFiltrados,
  insumosDisponibles,
  handleVincular,
  isValidPrice,
  isPriceAtLeastMin,
  onKeyDown,
}) {
  return (
    <div className="prov-ins-card">
      <h3 style={{ marginTop: 0 }}>
        Vincular insumo
      </h3>

      <div className="prov-ins-combo">
        <div
          className="prov-ins-combo-input-wrap"
          role="combobox"
          aria-expanded={open}
          aria-controls="insumo-listbox"
          aria-owns="insumo-listbox"
          aria-haspopup="listbox"
        >
          <input
            ref={inputRef}
            type="text"
            className="prov-ins-combo-input"
            placeholder="Buscar insumo por nombre, unidad, código o ID…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(0);
              setSelInsumo("");
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setTimeout(() => {
                if (clickingListRef.current) {
                  clickingListRef.current = false;
                } else {
                  setOpen(false);
                }
              }, 0);
            }}
            onKeyDown={onKeyDown}
          />

          <input
            ref={priceRef}
            type="number"
            step="0.001"
            min="0"
            className="prov-ins-price-input"
            placeholder="Precio (ej. 123.450)"
            value={priceInput}
            onChange={(e) =>
              setPriceInput(e.target.value)
            }
            title="Precio unitario (> 100, obligatorio)"
          />

          <button
            className="prov-ins-btn prov-ins-btn-primary"
            disabled={
              !selInsumo ||
              !isValidPrice(priceInput) ||
              !isPriceAtLeastMin(priceInput)
            }
            onClick={handleVincular}
            title="Vincular insumo seleccionado con precio"
          >
            Vincular
          </button>

          <span className="prov-ins-search-count">
            {insumosFiltrados.length} de{" "}
            {insumosDisponibles.length}
          </span>
        </div>

        {open && (
          <div
            id="insumo-listbox"
            ref={listRef}
            role="listbox"
            className="prov-ins-combo-list"
            onMouseDownCapture={() => {
              clickingListRef.current = true;
            }}
          >
            {insumosFiltrados.map((i, idx) => (
              <div
                key={i.id_insumo}
                role="option"
                aria-selected={idx === active}
                className={`prov-ins-combo-option ${
                  idx === active ? "is-active" : ""
                }`}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelInsumo(i.id_insumo);
                  setQ(
                    `${i.ins_nombre}${
                      i.ins_unidad
                        ? ` (${i.ins_unidad})`
                        : ""
                    }`
                  );
                  setOpen(false);
                  setActive(-1);
                  setTimeout(
                    () => priceRef.current?.focus(),
                    0
                  );
                }}
              >
                <div className="prov-ins-opt-title">
                  {i.ins_nombre}
                  {i.ins_unidad && (
                    <span className="prov-ins-opt-unit">
                      ({i.ins_unidad})
                    </span>
                  )}
                </div>
                <div className="prov-ins-opt-meta">
                  <span>ID: {i.id_insumo}</span>
                  {typeof i.ins_stock_actual !==
                    "undefined" && (
                    <span>
                      • Stock: {i.ins_stock_actual}
                    </span>
                  )}
                  {i.codigo && (
                    <span>• Cód: {i.codigo}</span>
                  )}
                </div>
              </div>
            ))}

            {insumosFiltrados.length === 0 && (
              <div className="prov-ins-combo-empty">
                <div>
                  No se encontraron insumos que
                  coincidan con “{q}”.
                </div>
                <Link
                  to="/inventario/registrar"
                  state={{
                    backTo: `/proveedores/${id}/insumos`,
                  }}
                  className="prov-ins-btn prov-ins-btn-secondary prov-ins-btn-small"
                  onMouseDown={(e) =>
                    e.preventDefault()
                  }
                >
                  Crear insumo…
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <small className="prov-ins-muted">
        Elegí un insumo, cargá el{" "}
        <strong>precio</strong> (mayor a 100) y tocá{" "}
        <strong>Vincular</strong>. Con{" "}
        <strong>↑/↓</strong> navegás y con{" "}
        <strong>Enter</strong> seleccionás.
      </small>
    </div>
  );
}
