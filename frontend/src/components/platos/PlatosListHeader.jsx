import { Link } from "react-router-dom";

export default function PlatosListHeader({ abrirAgregarCategoria }) {
  return (
    <div className="platos-header">
      <h2>Platos</h2>
      <div className="platos-header-actions">
        <button
          type="button"
          className="platos-btn-secondary"
          onClick={abrirAgregarCategoria}
        >
          Agregar categoría
        </button>
        <Link to="/platos/registrar" className="platos-btn-primary">
          Registrar plato
        </Link>
      </div>
    </div>
  );
}

