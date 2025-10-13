import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConfigurationPage.css';
import { FaEdit, FaEyeSlash, FaCloudUploadAlt, FaCloudDownloadAlt } from 'react-icons/fa';
import Modal from './Modal';
import pizzaHeader from '../assets/pizza-header.jpg';

const ConfigurationPage = ({ currentUser }) => {
    const navigate = useNavigate();
    const [modalInfo, setModalInfo] = useState({ isOpen: false, type: null });

    const handleActionClick = (type) => {
        setModalInfo({ isOpen: true, type: type });
    };

    const handleConfirm = () => {
        const path = modalInfo.type === 'backup' ? '/configuracion/backup' : '/configuracion/restore';
        setModalInfo({ isOpen: false, type: null });
        navigate(path);
    };

    return (
        <div className="config-page">
            <header className="config-header"><h1>CONFIGURACION</h1></header>

            <div className="config-container">
                {/* --- Tarjeta de Información del Negocio --- */}
                <div className="config-card">
                    <img src={pizzaHeader} alt="Pizzeria" className="business-banner" />
                    <div className="business-info">
                        <h2>Pizzas Rex <button className="inline-edit-btn"><FaEdit /></button></h2>
                        <p>Tel: 387-4455616 <button className="inline-edit-btn"><FaEdit /></button></p>
                        <p>Horarios: 12:00 a 15:00 y 20:00 a 00:00 <button className="inline-edit-btn"><FaEdit /></button></p>
                    </div>
                </div>

                {/* --- Tarjeta de Credenciales --- */}
                <div className="config-card">
                    <div className="card-title-bar">
                        <h3>Credenciales</h3>
                        <button onClick={() => navigate('/configuracion/usuario')} className="inline-edit-btn main"><FaEdit /></button>
                    </div>
                    <div className="form-field-config">
                        <label>Usuario</label>
                        <input type="text" value={currentUser ? currentUser.nombre : ''} readOnly />
                    </div>
                    <div className="form-field-config">
                        <label>Contraseña</label>
                        <input type="password" value="********" readOnly />
                        <FaEyeSlash className="password-icon" />
                    </div>
                </div>

                {/* --- Tarjeta de Copia de Seguridad --- */}
                <div className="config-card">
                     <h3>Copia de Seguridad</h3>
                    <div className="actions-container">
                        <button onClick={() => handleActionClick('backup')} className="action-btn backup">
                            <FaCloudUploadAlt /> Realizar copia de seguridad
                        </button>
                        <button onClick={() => handleActionClick('restore')} className="action-btn restore">
                            <FaCloudDownloadAlt /> Restaurar copia de seguridad
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Modal de Confirmación --- */}
            <Modal
                isOpen={modalInfo.isOpen}
                onClose={() => setModalInfo({ isOpen: false, type: null })}
                onConfirm={handleConfirm}
                title={modalInfo.type === 'backup' ? "Copia de seguridad" : "Restaurar"}
            >
                <p>¿Seguro que desea Realizar una {modalInfo.type === 'backup' ? "copia de seguridad" : "Restauracion de seguridad"}?</p>
            </Modal>
        </div>
    );
};

export default ConfigurationPage;