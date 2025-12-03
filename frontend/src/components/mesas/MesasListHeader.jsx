import { Link } from "react-router-dom";

export default function MesasListHeader() {
  return (
    <div className="mesas-header">
      <h2>Mesas</h2>
      <Link
        to="/mesas/registrar"
        className="mesas-btn mesas-btn-primary"
      >
        Registrar mesa
      </Link>
    </div>
  );
}
