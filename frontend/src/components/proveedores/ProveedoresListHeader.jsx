import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";

export default function ProveedoresListHeader() {
  return (
    <div className="prov-list-header">
      <h2 className="prov-list-title">Proveedores</h2>
      <div className="prov-list-header-actions">
        <Link
          to="/proveedores/inactivos"
          className="prov-list-btn prov-list-btn-secondary"
        >
          Ver inactivos
        </Link>
        <Link
          to="/proveedores/registrar"
          className="prov-list-btn prov-list-btn-primary"
        >
          <FaPlus /> Registrar proveedor
        </Link>
      </div>
    </div>
  );
}
