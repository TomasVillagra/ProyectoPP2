import { Link } from "react-router-dom";

export default function ProveedorInsumosHeader({
  id,
  nombre,
}) {
  return (
    <div className="prov-ins-header">
      <div>
        <h2>Insumos del Proveedor #{id}</h2>
        <p className="prov-ins-sub">
          {nombre || "-"}
        </p>
      </div>
      <div className="prov-ins-header-actions">
        <Link
          to="/proveedores"
          className="prov-ins-btn prov-ins-btn-secondary"
        >
          Volver
        </Link>
      </div>
    </div>
  );
}
