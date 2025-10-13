import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PurchasesListPage.css';
import { FaPlus, FaSearch, FaEye } from 'react-icons/fa';

const StatusBadge = ({ status }) => {
    const statusClass = `status-${status.toLowerCase()}`;
    return <span className={`purchase-status-badge ${statusClass}`}>{status}</span>;
};

const PurchasesListPage = ({ purchases }) => {
    const navigate = useNavigate();
    const handleViewDetails = (id) => navigate(`/compras/${id}`);

    return (
        <div className="purchases-list-page">
            <header className="purchases-header"><h1>COMPRAS</h1></header>
            <div className="purchases-container">
                <div className="purchases-actions-bar">
                    <Link to="/compras/nueva" className="add-new-purchase-btn"><FaPlus /> Nueva compra</Link>
                    <div className="search-bar">
                        <input type="text" placeholder="Buscar insumo" />
                        <FaSearch />
                    </div>
                </div>
                <table className="purchases-table">
                    <thead><tr><th>N° Compra</th><th>Fecha</th><th>N° Proveedor</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {purchases.length > 0 ? purchases.map(p => (
                            <tr key={p.id}>
                                <td>{p.id}</td><td>{p.fecha}</td><td>{p.proveedorId}</td>
                                <td>${p.total.toLocaleString('es-AR')}</td>
                                <td><StatusBadge status={p.estado} /></td>
                                <td>
                                    <button onClick={() => handleViewDetails(p.id)} className="btn-action btn-view-blue"><FaEye /></button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6">No hay compras registradas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PurchasesListPage;