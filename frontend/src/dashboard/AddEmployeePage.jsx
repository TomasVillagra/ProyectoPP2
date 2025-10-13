import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FormPage.css';
import { FaArrowLeft, FaSave, FaTimesCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const FormField = ({ label, name, value, onChange, type = 'text' }) => (
    <div className="form-field"><label>{label}</label><input type={type} name={name} value={value} onChange={onChange} required /></div>
);

const AddEmployeePage = ({ setEmployees }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre: '', ingreso: '', cargo: '', telefono: '', telEmergencia: '', email: '', dni: '', usuario: '', password: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); setIsModalOpen(true); };
    
    const handleConfirm = () => {
        const newEmployee = {
            id: Date.now(), // ID temporal
            estado: 'Activo', // Estado por defecto
            ...formData,
        };
        setEmployees(prev => [...prev, newEmployee]);
        setIsModalOpen(false);
        setNotification('Guardado con exito');
        setTimeout(() => navigate('/empleados'), 2000);
    };

    return (
        <div className="form-page">
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}
            <header className="form-header">
                <Link to="/empleados" className="back-button"><FaArrowLeft /></Link>
                <h1>Agregar Empleado</h1>
            </header>
            <div className="form-container">
                <h2 className="form-title">Detalle de empleado</h2>
                <form onSubmit={handleSubmit} className="order-form">
                    <div className="form-grid">
                        <FormField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} />
                        <FormField label="Ingreso" name="ingreso" value={formData.ingreso} onChange={handleChange} type="date" />
                        <FormField label="Cargo" name="cargo" value={formData.cargo} onChange={handleChange} />
                        <FormField label="Telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
                        <FormField label="Tel Emergencia" name="telEmergencia" value={formData.telEmergencia} onChange={handleChange} />
                        <FormField label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
                        <FormField label="DNI" name="dni" value={formData.dni} onChange={handleChange} />
                        <FormField label="Usuario" name="usuario" value={formData.usuario} onChange={handleChange} />
                        <FormField label="Contraseña" name="password" value={formData.password} onChange={handleChange} type="password" />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-save"><FaSave /> Guardar</button>
                        <button type="button" className="btn btn-cancel" onClick={() => navigate('/empleados')}><FaTimesCircle /> Cancelar</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} title="Guardar Empleado">
                <p>¿Seguro que desea Guardar?</p>
            </Modal>
        </div>
    );
};

export default AddEmployeePage;