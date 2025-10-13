import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FormPage.css';
import { FaArrowLeft, FaSave, FaTimesCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const FormField = ({ label, name, value, onChange, type = 'text' }) => (
    <div className="form-field"><label>{label}</label><input type={type} name={name} value={value} onChange={onChange} required /></div>
);

const AddInsumoPage = ({ setInventory }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nombre: '', categoria: '', stockMin: '', stockMax: '', precio: '', proveedor: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); setIsModalOpen(true); };
    
    const handleConfirm = () => {
        const newItem = {
            id: Date.now(),
            stock: 0, // El stock inicial al agregar es 0
            ...formData,
        };
        setInventory(prev => [...prev, newItem]);
        setIsModalOpen(false);
        setNotification('Guardado con éxito');
        setTimeout(() => navigate('/inventario'), 2000);
    };

    return (
        <div className="form-page">
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}
            <header className="form-header">
                <Link to="/inventario" className="back-button"><FaArrowLeft /></Link>
                <h1>Agregar Insumo</h1>
            </header>
            <div className="form-container">
                <h2 className="form-title">Datos de Insumo</h2>
                <form onSubmit={handleSubmit} className="order-form">
                    <div className="form-grid">
                        <FormField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} />
                        <FormField label="Categoría" name="categoria" value={formData.categoria} onChange={handleChange} />
                        <FormField label="Stock Min" name="stockMin" value={formData.stockMin} onChange={handleChange} type="number" />
                        <FormField label="Stock Max" name="stockMax" value={formData.stockMax} onChange={handleChange} type="number" />
                        <FormField label="Precio Unitario" name="precio" value={formData.precio} onChange={handleChange} type="number" />
                        <FormField label="Proveedor" name="proveedor" value={formData.proveedor} onChange={handleChange} />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-save"><FaSave /> Guardar</button>
                        <button type="button" className="btn btn-cancel" onClick={() => navigate('/inventario')}><FaTimesCircle /> Cancelar</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} title="Agregar">
                <p>¿Seguro que desea Agregar este insumo?</p>
            </Modal>
        </div>
    );
};

export default AddInsumoPage;