import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { FaHome, FaClipboardList, FaChartLine, FaCashRegister, FaWarehouse, FaTruck, FaUsers, FaUserTie, FaCog } from 'react-icons/fa';
import logo from '../assets/crown-logo.png';

const menuItems = [
  { icon: <FaHome />, name: 'Inicio', path: '/dashboard' },
  { icon: <FaClipboardList />, name: 'Pedidos', path: '/pedidos' },
  { icon: <FaChartLine />, name: 'Ventas', path: '/ventas' },
  { icon: <FaCashRegister />, name: 'Caja', path: '/caja' },
  { icon: <FaWarehouse />, name: 'Inventario', path: '/inventario' },
  { icon: <FaTruck />, name: 'Compras', path: '/compras' },
  { icon: <FaUsers />, name: 'Proveedores', path: '/proveedores' },
  { icon: <FaUserTie />, name: 'Empleados', path: '/empleados' },
  { icon: <FaCog />, name: 'Configuracion', path: '/configuracion' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Pizzeria REX Logo" className="sidebar-logo" />
        <h2>Pizzeria REX</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index} className={location.pathname.startsWith(item.path) && item.path !== '#' ? 'active' : ''}>
              <Link to={item.path}>
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;