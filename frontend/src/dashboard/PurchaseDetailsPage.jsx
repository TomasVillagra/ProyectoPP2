import React, { useState } from 'react';
// ======================================================================
// ¡CORRECCIÓN! Eliminamos 'useNavigate' porque no se usa en este componente
import { useParams, Link } from 'react-router-dom';
// ======================================================================
import './OrderDetailsPage.css';
import { FaArrowLeft, FaPrint, FaBell, FaUserCircle } from 'react-icons/fa';
import Modal from './Modal';

const StatusBadge = ({ status }) => {
    const statusClass = `status-${status.toLowerCase()}`;
    return <span className={`purchase-status-badge ${statusClass}`}>{status}</span>;
};

const PurchaseDetailsPage = ({ purchases }) => {
    const { purchaseId } = useParams();
    const purchase = purchases.find(p => p.id === parseInt(purchaseId));
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!purchase) {
        return <div className="not-found-container"><h2>Compra no encontrada</h2></div>;
    }

    return (
        <div className="order-details-page">
            <header className="details-header">
                <Link to="/compras" className="back-button"><FaArrowLeft /></Link>
                <h1>Detalles de Compra</h1>
                <div className="header-right"><span className="cash-status">Caja: Abierta</span><FaBell /><FaUserCircle /></div>
            </header>
            <div className="details-container">
                <div className="details-section">
                    <h3><FaPrint /> Detalles</h3>
                    <table className="details-table">
                        <thead><tr><th>Numero</th><th>Insumos</th><th>N° Proveedor</th><th>Estado</th><th>Fecha</th><th>Hora</th></tr></thead>
                        <tbody><tr>
                            <td>{purchase.id}</td><td>Lacteos</td><td>{purchase.proveedorId}</td>
                            <td><StatusBadge status={purchase.estado} /></td><td>{purchase.fecha}</td><td>07:15 hs</td>
                        </tr></tbody>
                    </table>
                </div>
                <div className="details-section">
                    <h3>Productos</h3>
                    <table className="products-table">
                        <thead><tr><th>Productos</th><th>Cantidad</th><th>Precio unitario</th><th>Sub total</th></tr></thead>
                        <tbody>
                            {purchase.products.map((p, i) => (
                                <tr key={i}>
                                    <td>{p.producto}</td><td>{p.cantidad}</td>
                                    <td>${(parseFloat(p.precio) || 0).toLocaleString('es-AR')}</td>
                                    <td>${(p.cantidad * p.precio).toLocaleString('es-AR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="total-section">
                        <span className="total-label">Total:</span>
                        <span className="total-value">${purchase.total.toLocaleString('es-AR')}</span>
                    </div>
                </div>
                <div className="details-section notes-section"><span className="notes-label">Nota:</span><div className="notes-content">Sin notas.</div></div>
                <div className="print-action">
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-print"><FaPrint /> Imprimir</button>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={() => { alert('Imprimiendo...'); setIsModalOpen(false); }} title="Imprimir">
                <p>¿Seguro que desea Imprimir?</p>
            </Modal>
        </div>
    );
};

export default PurchaseDetailsPage;