import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './FormPage.css';
import { FaArrowLeft, FaSave, FaTimesCircle } from 'react-icons/fa';

const CredentialsPage = ({ employees }) => {
    const { employeeId } = useParams();
    const employee = employees.find(e => e.id === parseInt(employeeId));

    if (!employee) {
        return <div className="not-found-container"><h2>Empleado no encontrado</h2></div>;
    }

    return (
        <div className="form-page">
            <header className="form-header">
                <Link to="/empleados" className="back-button"><FaArrowLeft /></Link>
                <h1>Usuario / Contraseña</h1>
            </header>
            <div className="form-container">
                <h2 className="form-title">Usuario</h2>
                <form className="order-form">
                    <div className="form-grid">
                        <div className="form-field"><label>Usuario</label><input type="text" defaultValue={employee.usuario} /></div>
                        <div className="form-field"><label>Nuevo usuario</label><input type="text" /></div>
                        <div className="form-field"><label>Contraseña</label><input type="password" defaultValue={employee.password} /></div>
                        <div className="form-field"><label>Nueva contraseña</label><input type="password" /></div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-save"><FaSave /> Guardar</button>
                        <button type="button" className="btn btn-cancel" onClick={() => window.history.back()}><FaTimesCircle /> Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CredentialsPage;