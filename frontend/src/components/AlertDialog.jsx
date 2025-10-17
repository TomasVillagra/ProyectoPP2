import React from 'react';

export default function AlertDialog({ open, title, message, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-primary">
            Aceptar
          </button>
        </div>
      </div>
      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        .modal-card {
          background-color: #2c2c2e;
          border: 1px solid #3a3a3c;
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 400px;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-title {
          margin: 0 0 12px 0;
          font-size: 1.25rem;
          color: #fff;
        }
        .modal-message {
          margin: 0 0 24px 0;
          color: #d1d5db;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s ease;
        }
        .btn-primary { background-color: #facc15; color: #111827; }
        .btn-primary:hover { background-color: #eab308; }
      `}</style>
    </div>
  );
}