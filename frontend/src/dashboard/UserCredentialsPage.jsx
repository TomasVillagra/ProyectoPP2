import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FormPage.css'; // Reutiliza el CSS de formularios que ya tenemos
import { FaArrowLeft, FaSave, FaTimesCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const UserCredentialsPage = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    const handleSubmit = (e) => { e.preventDefault(); setIsModalOpen(true); };
    
    const handleConfirm = () => {
        setIsModalOpen(false);
        setNotification('Cambio exitoso');
        setTimeout(() => navigate('/configuracion'), 2000);
    };

    return (
        <div className="form-page">
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}
            <header className="form-header">
                <Link to="/configuracion" className="back-button"><FaArrowLeft /></Link>
                <h1>Usuario / Contraseña</h1>
            </header>
            <div className="form-container">
                <h2 className="form-title">Usuario</h2>
                <form onSubmit={handleSubmit} className="order-form">
                    <div className="form-grid">
                        <div className="form-field"><label>Usuario</label><input type="text" defaultValue="Pablo Cueto" readOnly /></div>
                        <div className="form-field"><label>Nuevo usuario</label><input type="text" /></div>
                        <div className="form-field"><label>Contraseña</label><input type="password" defaultValue="cueto1234" readOnly /></div>
                        <div className="form-field"><label>Nueva contraseña</label><input type="password" /></div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-save"><FaSave /> Guardar</button>
                        <button type="button" className="btn btn-cancel" onClick={() => navigate('/configuracion')}><FaTimesCircle /> Cancelar</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} title="Login">
                <p>¿Seguro que desea cambiar Usua/Contra?</p>
            </Modal>
        </div>
    );
};

export default UserCredentialsPage;