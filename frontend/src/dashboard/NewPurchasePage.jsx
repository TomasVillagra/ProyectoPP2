import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FormPage.css';
import { FaArrowLeft, FaPlus, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const NewPurchasePage = ({ setPurchases }) => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([
        { insumo: '', producto: '', cantidad: 1, precio: '' }
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    const handleProductChange = (index, event) => {
        const values = [...products];
        values[index][event.target.name] = event.target.value;
        setProducts(values);
    };

    const handleAddProduct = () => {
        setProducts([...products, { insumo: '', producto: '', cantidad: 1, precio: '' }]);
    };

    const handleSubmit = (e) => { e.preventDefault(); setIsModalOpen(true); };

    const handleConfirm = () => {
        const total = products.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
        const newPurchase = {
            id: Date.now(),
            fecha: new Date().toLocaleDateString('es-ES'),
            proveedorId: 11, // Placeholder
            total: total,
            estado: 'Pendiente',
            products: products,
        };
        setPurchases(prev => [...prev, newPurchase]);
        setIsModalOpen(false);
        setNotification('Compra realizada');
        setTimeout(() => navigate('/compras'), 2000);
    };

    const totalGeneral = products.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);

    return (
        <div className="form-page">
            {notification && <Notification message={notification} onClose={() => setNotification('')} />}
            <header className="form-header"><Link to="/compras" className="back-button"><FaArrowLeft /></Link><h1>Nueva compra</h1></header>
            <div className="form-container">
                <h2 className="form-title">Datos de Insumo</h2>
                <form onSubmit={handleSubmit} className="order-form">
                    <div className="form-grid">
                        {products.map((product, index) => (
                            <div key={index} className="product-row">
                                <div className="form-field"><label>T. Insumo</label><input name="insumo" value={product.insumo} onChange={e => handleProductChange(index, e)} /></div>
                                <div className="form-field"><label>Producto</label><input name="producto" value={product.producto} onChange={e => handleProductChange(index, e)} /></div>
                                <div className="form-field"><label>Cantidad</label><input name="cantidad" type="number" value={product.cantidad} onChange={e => handleProductChange(index, e)} /></div>
                                <div className="form-field"><label>Precio unitario</label><input name="precio" type="number" value={product.precio} onChange={e => handleProductChange(index, e)} /></div>
                                <div className="subtotal">Sub total: ${(product.cantidad * product.precio).toLocaleString('es-AR')}</div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddProduct} className="add-product-row-btn"><FaPlus /></button>
                        <div className="form-field notes-field"><label>Nota:</label><textarea rows="3"></textarea></div>
                    </div>
                    <div className="total-general">Total: ${totalGeneral.toLocaleString('es-AR')}</div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-confirm"><FaCheckCircle /> Confirmar</button>
                        <button type="button" className="btn btn-cancel" onClick={() => navigate('/compras')}><FaTimesCircle /> Cancelar</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} title="Realizar compra">
                <p>¿Seguro que desea realizar esta compra?</p>
            </Modal>
        </div>
    );
};

export default NewPurchasePage;