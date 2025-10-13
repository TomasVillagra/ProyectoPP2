import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './FormPage.css'; // Reutilizamos el CSS del formulario
import { FaArrowLeft, FaSave, FaTimesCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const FormField = ({ label, name, value, onChange, type = 'text' }) => (
    <div className="form-field"><label>{label}</label><input type={type} name={name} value={value} onChange={onChange} required /></div>
);

const EditInsumoPage = ({ inventory, setInventory }) => {
    const { insumoId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nombre: '', categoria: '', stockMin: '', stockMax: '', precio: '', proveedor: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    useEffect(() => {
        const itemToEdit = inventory.find(i => i.id === parseInt(insumoId));
        if (itemToEdit) {
            setFormData(itemToEdit);
        }
    }, [insumoId, inventory]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); setIsModalOpen(true); };
    
    const handleConfirm = () => {
        setInventory(prev => prev.map(item => item.id === parseInt(insumoId) ? { ...item, ...formData } : item));
        setIsModalOpen(false);
        setNotification('Guardado con éxito');
        setTimeout(() => navigate('/inventario'), 2000);
    };

    return (
        <div className="form-page">
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}
            <header className="form-header">
                <Link to="/inventario" className="back-button"><FaArrowLeft /></Link>
                <h1>Editar Insumo</h1>
            </header>
            <div className="form-container">
                <h2 className="form-title">Modificación</h2>
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
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} title="Modificar">
                <p>¿Seguro que desea Guardar los cambios?</p>
            </Modal>
        </div>
    );
};

export default EditInsumoPage;