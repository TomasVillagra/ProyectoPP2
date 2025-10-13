import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './EditOrderPage.css';
import { FaArrowLeft, FaBell, FaUserCircle, FaSave, FaTimesCircle, FaPlusCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const StatusBadge = ({ status }) => {
    const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
};

const EditOrderPage = ({ orders, setOrders }) => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    // Cargar los datos del pedido cuando el componente se monta
    useEffect(() => {
        const orderToEdit = orders.find(o => o.numero === parseInt(orderId, 10));
        if (orderToEdit) {
            setOrder(orderToEdit);
            // Si el pedido no tiene una lista de productos, creamos una de ejemplo
            setProducts(orderToEdit.products || [
                { id: 1, nombre: 'Pizza Muzarella (Grande)', cantidad: 2, precio: 4000 },
                { id: 2, nombre: 'Pizza Napolitana (Chica)', cantidad: 1, precio: 2500 },
                { id: 3, nombre: 'Gaseosa 1.5L', cantidad: 1, precio: 1800 },
            ]);
        }
    }, [orderId, orders]);

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...products];
        updatedProducts[index][field] = value;
        setProducts(updatedProducts);
    };

    const handleAddProduct = () => {
        setProducts([...products, { id: Date.now(), nombre: '', cantidad: 1, precio: 0 }]);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
    };

    const handleConfirmSave = () => {
        const updatedOrder = { ...order, products: products };
        setOrders(prevOrders => prevOrders.map(o => (o.numero === updatedOrder.numero ? updatedOrder : o)));
        
        setIsModalOpen(false);
        setNotification('Guardado con éxito');

        setTimeout(() => {
            navigate('/pedidos');
        }, 2000);
    };

    if (!order) {
        return <div className="not-found-container"><h2>Pedido no encontrado</h2></div>;
    }

    const total = products.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);

    return (
        <div className="edit-order-page">
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}

            <header className="details-header">
                <div className="header-left">
                    <Link to="/pedidos" className="back-button"><FaArrowLeft /></Link>
                    <h1>Modificación</h1>
                </div>
                <div className="header-right">
                    <span className="cash-status">Caja: Abierta</span>
                    <FaBell className="notification-icon" />
                    <FaUserCircle className="user-avatar" />
                </div>
            </header>

            <div className="details-container">
                <form onSubmit={handleSubmit}>
                    <div className="details-section">
                        <h3><FaSave /> Modificación</h3>
                        {/* Aquí los campos principales del pedido podrían ser editables también si quisieras */}
                        <table className="details-table">
                            <thead><tr><th>Numero</th><th>Mesa</th><th>Empleado</th><th>Estado</th><th>Fecha</th><th>Hora</th></tr></thead>
                            <tbody><tr>
                                <td>{order.numero}</td><td>{order.mesa}</td><td>{order.empleado}</td>
                                <td><StatusBadge status={order.estado} /></td>
                                <td>03/09/2025</td><td>21:15 hs</td>
                            </tr></tbody>
                        </table>
                    </div>

                    <div className="details-section">
                        <h3>Productos</h3>
                        <table className="products-table editable">
                            <thead><tr><th>Productos</th><th>Cantidad</th><th>Precio unitario</th><th>Sub total</th></tr></thead>
                            <tbody>
                                {products.map((p, index) => (
                                    <tr key={p.id}>
                                        <td><input type="text" value={p.nombre} onChange={(e) => handleProductChange(index, 'nombre', e.target.value)} /></td>
                                        <td><input type="number" value={p.cantidad} onChange={(e) => handleProductChange(index, 'cantidad', e.target.value)} /></td>
                                        <td><input type="number" value={p.precio} onChange={(e) => handleProductChange(index, 'precio', e.target.value)} /></td>
                                        <td>${(p.cantidad * p.precio).toLocaleString('es-AR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="add-product-container">
                            <button type="button" onClick={handleAddProduct} className="add-product-btn">
                                <FaPlusCircle /> Agregar producto
                            </button>
                        </div>
                        <div className="total-section">
                            <span className="total-label">Total:</span>
                            <span className="total-value">${total.toLocaleString('es-AR')}</span>
                        </div>
                    </div>

                    <div className="details-section notes-section">
                        <span className="notes-label">Nota:</span>
                        <textarea className="notes-content-editable" defaultValue={order.nota || "Una pizza muzarella sin aceitunas"} />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-save"><FaSave /> Guardar</button>
                        <button type="button" className="btn btn-cancel" onClick={() => navigate('/pedidos')}><FaTimesCircle /> Cancelar</button>
                    </div>
                </form>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmSave} title="Modificar">
                <p>¿Seguro que desea Guardar?</p>
            </Modal>
        </div>
    );
};

export default EditOrderPage;