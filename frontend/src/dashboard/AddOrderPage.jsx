import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddOrderPage.css';
import { FaArrowLeft, FaBell, FaUserCircle, FaSave, FaTimesCircle } from 'react-icons/fa';
import Modal from './Modal';
import Notification from './Notification';

const FormField = ({ label, name, value, onChange, type = 'text' }) => (
  <div className="form-field">
    <label>{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} required />
  </div>
);

const AddOrderPage = ({ setOrders }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    numero: '',
    mesa: '',
    empleado: '',
    estado: 'Pendiente',
    producto: '',
    cantidad: '1',
    precioUnitario: '',
    nota: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.numero || !formData.mesa || !formData.empleado || !formData.producto) {
      alert("Por favor, complete los campos principales.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmOrder = () => {
    setOrders(prevOrders => [...prevOrders, formData]);
    setIsModalOpen(false);
    setNotification('Pedido agregado');
    setTimeout(() => {
      navigate('/pedidos');
    }, 3000);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="add-order-page">
      {notification && <Notification message={notification} onClose={() => setNotification('')} />}

      {/* ====================================================================== */}
      {/* ESTE ES EL HEADER QUE FALTA Y CAUSA LAS ADVERTENCIAS */}
      <header className="add-order-header">
        <div className="header-left">
          <Link to="/pedidos" className="back-button">
            <FaArrowLeft />
          </Link>
          <h1>Agregar pedido</h1>
        </div>
        <div className="header-right">
          <span className="cash-status">Caja: Abierta</span>
          <FaBell className="notification-icon" />
          <FaUserCircle className="user-avatar" />
        </div>
      </header>
      {/* ====================================================================== */}

      <div className="form-container">
        <h2 className="form-title">Agregar pedido</h2>
        <form className="order-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormField label="Numero" name="numero" value={formData.numero} onChange={handleChange} />
            <FormField label="Mesa" name="mesa" value={formData.mesa} onChange={handleChange} />
            <FormField label="Empleado" name="empleado" value={formData.empleado} onChange={handleChange} />
            <FormField label="Estado" name="estado" value={formData.estado} onChange={handleChange} />
            <FormField label="Producto" name="producto" value={formData.producto} onChange={handleChange} />
            <FormField label="Cantidad" name="cantidad" value={formData.cantidad} onChange={handleChange} type="number" />
            <FormField label="Precio Unitario" name="precioUnitario" value={formData.precioUnitario} onChange={handleChange} type="number" />
            
            <div className="form-field notes-field">
              <label>Nota:</label>
              <textarea name="nota" value={formData.nota} onChange={handleChange} rows="4"></textarea>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-save"><FaSave /> Guardar</button>
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/pedidos')}><FaTimesCircle /> Cancelar</button>
          </div>
        </form>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onConfirm={handleConfirmOrder}
        title="Pedido"
      >
        <p>¿Seguro que desea agregar el pedido?</p>
      </Modal>
    </div>
  );
};

export default AddOrderPage;