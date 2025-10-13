import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './InventoryListPage.css'; // Reutilizamos estilos
// ======================================================================
// ¡CORRECCIÓN! Eliminamos 'FaSearch' de la importación.
import { FaPlus, FaEdit } from 'react-icons/fa';
// ======================================================================

const ProvidersListPage = ({ providers, setProviders }) => {
    const navigate = useNavigate();
    const handleEdit = (id) => navigate(`/proveedores/editar/${id}`);

    return (
        <div className="inventory-list-page">
            <header className="inventory-header"><h1>PROVEEDORES</h1></header>
            <div className="inventory-container">
                <div className="inventory-actions-bar">
                    <Link to="/proveedores/nuevo" className="add-new-btn"><FaPlus /> Nuevo Proveedor</Link>
                </div>
                
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>N° Prov</th>
                            <th>Nombre</th>
                            <th>Rubro</th>
                            <th>Teléfono</th>
                            <th>Email</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {providers.length > 0 ? providers.map(provider => (
                            <tr key={provider.id}>
                                <td>{provider.id}</td>
                                <td>{provider.nombre}</td>
                                <td>{provider.rubro}</td>
                                <td>{provider.telefono}</td>
                                <td>{provider.email}</td>
                                <td>{provider.estado}</td>
                                <td>
                                    <button onClick={() => handleEdit(provider.id)} className="btn-action btn-edit-turq"><FaEdit /></button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="7">No hay proveedores registrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProvidersListPage;