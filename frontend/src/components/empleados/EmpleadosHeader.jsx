import React from "react";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";

export default function EmpleadosHeader() {
  return (
    <div className="page-header">
      <h2>Empleados</h2>
      <Link to="/empleados/registrar" className="btn btn-primary">
        <FaPlus /> Registrar empleado
      </Link>
    </div>
  );
}
