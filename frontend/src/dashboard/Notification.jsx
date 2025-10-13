import React, { useEffect } from 'react';
import './Notification.css';
import { FaCheckCircle } from 'react-icons/fa';

const Notification = ({ message, onClose }) => {
  // Este efecto programará el cierre automático de la notificación
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // La notificación desaparecerá después de 3 segundos

    // Limpiamos el temporizador si el componente se desmonta antes
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification-container">
      <FaCheckCircle className="notification-icon" />
      <span>{message}</span>
    </div>
  );
};

export default Notification;