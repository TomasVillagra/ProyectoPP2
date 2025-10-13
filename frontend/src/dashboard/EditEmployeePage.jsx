import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './FormPage.css';
import { FaArrowLeft, FaSave, FaTimesCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const FormField = ({ label, name, value, onChange, type = 'text' }) => (
    <div className="form-field"><label>{label}</label><input type={type} name={name} value={value} onChange={onChange} /></div>
);

const EditEmployeePage = ({ employees, setEmployees }) => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nombre: '', cargo: '', telefono: '', telEmergencia: '', email: '', dni: '', estado: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    useEffect(() => {
        const itemToEdit = employees.find(e => e.id === parseInt(employeeId));
        if (itemToEdit) {
            setFormData(itemToEdit);
        }
    }, [employeeId, employees]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); setIsModalOpen(true); };
    
    const handleConfirm = () => {
        setEmployees(prev => prev.map(e => e.id === parseInt(employeeId) ? formData : e));
        setIsModalOpen(false);
        setNotification('Guardado con exito');
        setTimeout(() => navigate('/empleados'), 2000);
    };

    return (
        <div className="form-page">
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}
            <header className="form-header">
                <Link to="/empleados" className="back-button"><FaArrowLeft /></Link>
                <h1>Editar Empleado</h1>
            </header>
            <div className="form-container">
                <h2 className="form-title">Detalle de empleado</h2>
                <form onSubmit={handleSubmit} className="order-form">
                    <div className="form-grid">
                        <FormField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} />
                        <FormField label="Cargo" name="cargo" value={formData.cargo} onChange={handleChange} />
                        <FormField label="Telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
                        <FormField label="Tel Emergencia" name="telEmergencia" value={formData.telEmergencia} onChange={handleChange} />
                        <FormField label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
                        <FormField label="DNI" name="dni" value={formData.dni} onChange={handleChange} />
                        <FormField label="Estado" name="estado" value={formData.estado} onChange={handleChange} />
                        <div className="form-field notes-field"><label>Nota:</label><textarea rows="4"></textarea></div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-save"><FaSave /> Guardar</button>
                        <button type="button" className="btn btn-cancel" onClick={() => navigate('/empleados')}><FaTimesCircle /> Cancelar</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} title="Editar Empleado">
                <p>¿Seguro que desea editar este Empleado?</p>
            </Modal>
        </div>
    );
};

export default EditEmployeePage;