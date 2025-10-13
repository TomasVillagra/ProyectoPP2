import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './InsumoDetailsPage.css'; // Usaremos estilos específicos
import { FaArrowLeft, FaEdit, FaShoppingCart } from 'react-icons/fa';

const InsumoDetailsPage = ({ inventory }) => {
    const { insumoId } = useParams();
    const navigate = useNavigate();
    const item = inventory.find(i => i.id === parseInt(insumoId));

    if (!item) {
        return <div className="not-found-container"><h2>Insumo no encontrado</h2></div>;
    }

    return (
        <div className="details-page">
            <header className="details-header"><Link to="/inventario" className="back-button"><FaArrowLeft /></Link><h1>Detalles de Insumo</h1></header>
            <div className="details-container">
                <div className="details-section">
                    <h3>Detalles</h3>
                    <table className="details-table">
                        <thead><tr><th>N° Insumo</th><th>Nombre</th><th>Stock Actual</th><th>Stock Min</th><th>Stock Max</th></tr></thead>
                        <tbody><tr><td>{item.id}</td><td>{item.nombre}</td><td>{item.stock}</td><td>{item.stockMin}</td><td>{item.stockMax}</td></tr></tbody>
                    </table>
                    <table className="details-table">
                         <thead><tr><th>Precio Unitario</th><th>N° Proveedor</th><th>Ultima compra</th></tr></thead>
                         <tbody><tr><td>${item.precio}</td><td>{item.proveedor}</td><td>(no disponible)</td></tr></tbody>
                    </table>
                </div>
                <div className="details-section notes-section"><span className="notes-label">Nota:</span><div className="notes-content">{item.nota || "Sin notas."}</div></div>
                <div className="details-actions">
                    <button onClick={() => navigate(`/inventario/editar/${item.id}`)} className="btn btn-edit-details"><FaEdit /> Editar</button>
                    <button className="btn btn-buy-details"><FaShoppingCart /></button>
                </div>
            </div>
        </div>
    );
};

export default InsumoDetailsPage;