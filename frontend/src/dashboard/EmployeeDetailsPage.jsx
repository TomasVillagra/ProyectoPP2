import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './FormPage.css'; // Reutiliza la mayoría de los estilos
import { FaArrowLeft } from 'react-icons/fa';

// Componente simple para mostrar datos, no necesita ser editable
const DetailField = ({ label, value }) => (
    <div className="form-field"><label>{label}</label><div className="detail-value">{value}</div></div>
);

const EmployeeDetailsPage = ({ employees }) => {
    const { employeeId } = useParams();
    const employee = employees.find(e => e.id === parseInt(employeeId));

    if (!employee) {
        return <div className="not-found-container"><h2>Empleado no encontrado</h2></div>;
    }

    return (
        <div className="form-page">
            <header className="form-header">
                <Link to="/empleados" className="back-button"><FaArrowLeft /></Link>
                <h1>Detalles de empleados</h1>
            </header>
            <div className="form-container">
                <h2 className="form-title">Detalle de empleado</h2>
                <div className="form-grid">
                    <DetailField label="Nombre" value={employee.nombre} />
                    <DetailField label="Ingreso" value={employee.ingreso} />
                    <DetailField label="Cargo" value={employee.cargo} />
                    <DetailField label="Telefono" value={employee.telefono} />
                    <DetailField label="Tel Emergencia" value={employee.telEmergencia} />
                    <DetailField label="Email" value={employee.email} />
                    <DetailField label="DNI" value={employee.dni} />
                    <div className="form-field notes-field"><label>Nota:</label><div className="detail-value"></div></div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsPage;