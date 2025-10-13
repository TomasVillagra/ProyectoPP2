import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './EmployeesListPage.css';
import { FaPlus, FaEye, FaEdit, FaLock } from 'react-icons/fa';

const StatusBadge = ({ status }) => <span className={`employee-status-badge status-${status.toLowerCase()}`}>{status}</span>;

const EmployeesListPage = ({ employees }) => {
    const navigate = useNavigate();

    return (
        <div className="employees-list-page">
            <header className="employees-header"><h1>EMPLEADOS</h1></header>
            <div className="employees-container">
                <div className="employees-actions-bar">
                    <Link to="/empleados/nuevo" className="add-new-btn-light-blue"><FaPlus /> Nuevo empleado</Link>
                </div>
                <table className="employees-table">
                    <thead><tr><th>N°</th><th>Nombre</th><th>Cargo</th><th>Telefono</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {employees.length > 0 ? employees.map(emp => (
                            <tr key={emp.id}>
                                <td>{emp.id}</td><td>{emp.nombre}</td><td>{emp.cargo}</td><td>{emp.telefono}</td>
                                <td><StatusBadge status={emp.estado} /></td>
                                <td>
                                    <div className="action-buttons">
                                        <button onClick={() => navigate(`/empleados/detalles/${emp.id}`)} className="btn-action btn-view-details"><FaEye /></button>
                                        <button onClick={() => navigate(`/empleados/editar/${emp.id}`)} className="btn-action btn-edit-details"><FaEdit /></button>
                                        <button onClick={() => navigate(`/empleados/credenciales/${emp.id}`)} className="btn-action btn-credentials"><FaLock /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6">No hay empleados registrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeesListPage;