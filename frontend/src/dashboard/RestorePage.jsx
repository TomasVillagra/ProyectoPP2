import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProgressPage.css';
import { FaHistory } from 'react-icons/fa';

// Componente similar a BackupPage para simular la restauración
const RestorePage = () => {
    // ... (lógica similar a BackupPage con otro icono y texto)
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    navigate('/configuracion');
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
        return () => clearInterval(timer);
    }, [navigate]);

     return (
        <div className="progress-page">
            <header className="progress-header"><h1>Restaurando Copia</h1></header>
            <div className="progress-container">
                <FaHistory className="progress-icon" />
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <p>Restaurando copia de seguridad</p>
            </div>
        </div>
    );
};

export default RestorePage;