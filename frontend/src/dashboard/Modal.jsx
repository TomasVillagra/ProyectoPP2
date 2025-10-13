import React from 'react';
import './Modal.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) {
    return null; // Si no está abierto, no renderiza nada
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>{title}</h4>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-actions">
          <button onClick={onConfirm} className="btn btn-accept">
            <FaCheckCircle /> Aceptar
          </button>
          <button onClick={onClose} className="btn btn-cancel-modal">
            <FaTimesCircle /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;