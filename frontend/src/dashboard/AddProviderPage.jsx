import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FormPage.css'; // Reutilizamos el CSS de formularios
import { FaArrowLeft, FaSave, FaTimesCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const FormField = ({ label, name, value, onChange, type = 'text' }) => (
    <div className="form-field"><label>{label}</label><input type={type} name={name} value={value} onChange={onChange} required /></div>
);

const AddProviderPage = ({ setProviders }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nombre: '', rubro: '', telefono: '', email: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); setIsModalOpen(true); };
    
    const handleConfirm = () => {
        const newProvider = {
            id: Date.now(), // ID temporal
            estado: 'Activo', // Estado por defecto
            ...formData,
        };
        setProviders(prev => [...prev, newProvider]);
        setIsModalOpen(false);
        setNotification('Agregacion Exitosa');
        setTimeout(() => navigate('/proveedores'), 2000);
    };

    return (
        <div className="form-page">
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}
            <header className="form-header">
                <Link to="/proveedores" className="back-button"><FaArrowLeft /></Link>
                <h1>Agregar Proveedor</h1>
            </header>
            <div className="form-container">
                <h2 className="form-title">Datos del Proveedor</h2>
                <form onSubmit={handleSubmit} className="order-form">
                    <div className="form-grid">
                        <FormField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} />
                        <FormField label="Rubro" name="rubro" value={formData.rubro} onChange={handleChange} />
                        <FormField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
                        <FormField label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-save"><FaSave /> Guardar</button>
                        <button type="button" className="btn btn-cancel" onClick={() => navigate('/proveedores')}><FaTimesCircle /> Cancelar</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} title="Agregar proveedor">
                <p>¿Seguro que desea agregar este proveedor?</p>
            </Modal>
        </div>
    );
};

export default AddProviderPage;