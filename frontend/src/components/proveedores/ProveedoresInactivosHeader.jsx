import { Link } from "react-router-dom";

export default function ProveedoresInactivosHeader() {
  return (
    <div className="prov-inactivos-header">
      <h2>Proveedores Inactivos</h2>
      <Link to="/proveedores" className="prov-inactivos-btn-secondary">
        ← Volver a activos
      </Link>
    </div>
  );
}
