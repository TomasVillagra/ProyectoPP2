import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './InventoryListPage.css';
// ======================================================================
// ¡CORRECCIÓN! Eliminamos 'FaSearch' de la importación porque no se usa.
import { FaEye, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
// ======================================================================
import Modal from './Modal';

const StatusBadge = ({ stock, stockMin }) => {
    let status = 'Suficiente';
    let statusClass = 'status-suficiente';

    if (stock <= 0) {
        status = 'Sin Stock';
        statusClass = 'status-critico';
    } else if (stock <= stockMin) {
        status = 'Crítico';
        statusClass = 'status-critico';
    } else if (stock <= stockMin * 1.5) {
        status = 'Normal';
        statusClass = 'status-normal';
    }

    return <span className={`inventory-status-badge ${statusClass}`}>{status}</span>;
};

const InventoryListPage = ({ inventory, setInventory }) => {
    const navigate = useNavigate();
    const [itemToDelete, setItemToDelete] = useState(null);

    const criticalItems = inventory.filter(item => item.stock <= item.stockMin);
    const otherItems = inventory.filter(item => item.stock > item.stockMin);
    
    const handleView = (id) => navigate(`/inventario/${id}`);
    const handleEdit = (id) => navigate(`/inventario/editar/${id}`);
    
    const handleDeleteClick = (id) => {
        setItemToDelete(id);
    };

    const confirmDelete = () => {
        setInventory(prev => prev.filter(item => item.id !== itemToDelete));
        setItemToDelete(null);
    };

    const InventoryTable = ({ title, items }) => (
        <div className="inventory-section">
            {title && <h2>{title}</h2>}
            <table className="inventory-table">
                <thead>
                    <tr><th>N° Insumo</th><th>Nombre</th><th>Stock actual</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    {items.length > 0 ? items.map(item => (
                        <tr key={item.id}>
                            <td>{item.id}</td><td>{item.nombre}</td><td>{item.stock}</td>
                            <td><StatusBadge stock={item.stock} stockMin={item.stockMin} /></td>
                            <td>
                                <div className="action-buttons">
                                    <button onClick={() => handleView(item.id)} className="btn-action btn-view-blue"><FaEye /></button>
                                    <button onClick={() => handleEdit(item.id)} className="btn-action btn-edit-turq"><FaEdit /></button>
                                    <button onClick={() => handleDeleteClick(item.id)} className="btn-action btn-delete-red"><FaTrash /></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="5">No hay insumos para mostrar.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="inventory-list-page">
            <header className="inventory-header"><h1>INVENTARIO</h1></header>
            <div className="inventory-container">
                <div className="inventory-actions-bar">
                    <Link to="/inventario/nuevo" className="add-new-btn"><FaPlus /> Nuevo Insumo</Link>
                </div>
                
                {inventory.length === 0 ? (
                    <div className="empty-state">No hay insumos registrados. Comienza agregando uno nuevo.</div>
                ) : (
                    <>
                        <InventoryTable title="Insumos Generales" items={otherItems} />
                        {criticalItems.length > 0 && <InventoryTable title="Insumos Críticos" items={criticalItems} />}
                    </>
                )}
            </div>
            <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={confirmDelete} title="Confirmar Eliminación">
                <p>¿Seguro que desea eliminar este insumo?</p>
            </Modal>
        </div>
    );
};

export default InventoryListPage;