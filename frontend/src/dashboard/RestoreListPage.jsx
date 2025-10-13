import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './RestoreListPage.css'; // Crearemos este CSS a continuación
import Modal from './Modal';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const RestoreListPage = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Datos de ejemplo para las copias de seguridad
    const backups = [
        { id: 1, date: '02/09/2025', time: '07:30', description: 'Copia de Seguridad Automática' },
        { id: 2, date: '01/09/2025', time: '08:00', description: 'Copia Manual' },
        { id: 3, date: '31/08/2025', time: '07:30', description: 'Copia de Seguridad Automática' },
    ];

    return(
        <div className="restore-list-page">
            <header className="restore-header">
                <Link to="/configuracion" className="back-button"><FaArrowLeft /></Link>
                <h1>Restaurar Copia</h1>
            </header>
            <div className="restore-container">
                <table className="restore-table">
                    <thead><tr><th>Fecha</th><th>Hora</th><th>Descripcion</th><th></th></tr></thead>
                    <tbody>
                        {backups.map(b => (
                            <tr key={b.id}>
                                <td>{b.date}</td>
                                <td>{b.time}</td>
                                <td>{b.description}</td>
                                <td><input type="radio" name="backup"/></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="form-actions">
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-save"><FaCheckCircle /> Confirmar</button>
                    <button type="button" onClick={() => navigate('/configuracion')} className="btn btn-cancel"><FaTimesCircle /> Cancelar</button>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={() => { alert("Restaurando..."); setIsModalOpen(false); navigate('/configuracion'); }} title="Restaurar">
                <p>¿Seguro que desea Realizar una Restauracion de seguridad?</p>
            </Modal>
        </div>
    );
};

export default RestoreListPage;