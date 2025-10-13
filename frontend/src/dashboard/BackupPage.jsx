import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProgressPage.css'; // Un CSS para ambas páginas de progreso
import { FaFolderPlus } from 'react-icons/fa';

const BackupPage = () => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    navigate('/configuracion'); // Vuelve a la pág de config
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="progress-page">
            <header className="progress-header"><h1>Copia de Seguridad</h1></header>
            <div className="progress-container">
                <FaFolderPlus className="progress-icon" />
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <p>Realizando copia de seguridad</p>
            </div>
        </div>
    );
};

export default BackupPage;