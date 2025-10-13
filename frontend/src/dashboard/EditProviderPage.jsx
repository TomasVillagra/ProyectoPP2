import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './FormPage.css'; // Reutilizamos el CSS de formularios
import { FaArrowLeft, FaSave, FaTimesCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const FormField = ({ label, name, value, onChange, type = 'text' }) => (
    <div className="form-field"><label>{label}</label><input type={type} name={name} value={value} onChange={onChange} required /></div>
);

const EditProviderPage = ({ providers, setProviders }) => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nombre: '', rubro: '', telefono: '', email: '', estado: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    useEffect(() => {
        const providerToEdit = providers.find(p => p.id === parseInt(providerId));
        if (providerToEdit) {
            setFormData(providerToEdit);
        }
    }, [providerId, providers]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); setIsModalOpen(true); };
    
    const handleConfirm = () => {
        setProviders(prev => prev.map(p => p.id === parseInt(providerId) ? formData : p));
        setIsModalOpen(false);
        setNotification('Agregacion Exitosa'); // El texto de tu imagen
        setTimeout(() => navigate('/proveedores'), 2000);
    };

    return (
        <div className="form-page">
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}
            <header className="form-header">
                <Link to="/proveedores" className="back-button"><FaArrowLeft /></Link>
                <h1>Editar Proveedor</h1>
            </header>
            <div className="form-container">
                <h2 className="form-title">Datos del Proveedor</h2>
                <form onSubmit={handleSubmit} className="order-form">
                    <div className="form-grid">
                        <FormField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} />
                        <FormField label="Rubro" name="rubro" value={formData.rubro} onChange={handleChange} />
                        <FormField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
                        <FormField label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
                        <FormField label="Estado" name="estado" value={formData.estado} onChange={handleChange} />
                        <div className="form-field notes-field"><label>Nota:</label><textarea rows="4"></textarea></div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-save"><FaSave /> Guardar</button>
                        <button type="button" className="btn btn-cancel" onClick={() => navigate('/proveedores')}><FaTimesCircle /> Cancelar</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} title="Editar proveedor">
                <p>¿Seguro que desea editar este proveedor?</p>
            </Modal>
        </div>
    );
};

export default EditProviderPage;