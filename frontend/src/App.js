import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./component/LoginForm";
import OrdersListPage from "./dashboard/OrdersListPage";
import AddOrderPage from "./dashboard/AddOrderPage";
import InventoryListPage from "./dashboard/InventoryListPage";
import CashPage from "./dashboard/CashPage";

function Layout({ children }) {
  return (
    <div>
      <nav style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #ddd" }}>
        <Link to="/orders">Pedidos</Link>
        <Link to="/orders/new">Nuevo pedido</Link>
        <Link to="/inventory">Inventario</Link>
        <Link to="/cash">Caja</Link>
        <Link to="/login" style={{ marginLeft: "auto" }}>Login</Link>
      </nav>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function RequireAuth({ children }) {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout>Bienvenido a Pizzería Rex</Layout>} />
      <Route path="/orders" element={<RequireAuth><Layout><OrdersListPage /></Layout></RequireAuth>} />
      <Route path="/orders/new" element={<RequireAuth><Layout><AddOrderPage /></Layout></RequireAuth>} />
      <Route path="/inventory" element={<RequireAuth><Layout><InventoryListPage /></Layout></RequireAuth>} />
      <Route path="/cash" element={<RequireAuth><Layout><CashPage /></Layout></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
