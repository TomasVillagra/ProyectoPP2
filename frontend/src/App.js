// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";

// Otras secciones
import PedidosPage from "./pages/PedidosPage";
import VentasPage from "./pages/VentasPage";
import CajaPage from "./pages/CajaPage";
import InventarioList from "./pages/inventario/InventarioList";
import InsumoRegistrar from "./pages/inventario/InsumoRegistrar";
import InsumoEditar from "./pages/inventario/InsumoEditar";

// Empleados (rutas nuevas separadas)
import EmpleadosList from "./pages/empleados/EmpleadosList";
import EmpleadoRegistrar from "./pages/empleados/EmpleadoRegistrar";
import EmpleadoEditar from "./pages/empleados/EmpleadoEditar";
import ProveedoresList from "./pages/proveedores/ProveedoresList";
import ProveedorRegistrar from "./pages/proveedores/ProveedorRegistrar";
import ProveedorEditar from "./pages/proveedores/ProveedorEditar";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard (Home) */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        {/* Secciones */}
        <Route path="/pedidos" element={<ProtectedRoute><PedidosPage /></ProtectedRoute>} />
        <Route path="/ventas" element={<ProtectedRoute><VentasPage /></ProtectedRoute>} />
        <Route path="/caja" element={<ProtectedRoute><CajaPage /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><InventarioList /></ProtectedRoute>} />
        <Route path="/inventario/registrar" element={<ProtectedRoute><InsumoRegistrar /></ProtectedRoute>} />
        <Route path="/inventario/editar/:id" element={<ProtectedRoute><InsumoEditar /></ProtectedRoute>} />

        {/* Empleados */}
        <Route path="/empleados" element={<ProtectedRoute><EmpleadosList /></ProtectedRoute>} />
        <Route path="/empleados/registrar" element={<ProtectedRoute><EmpleadoRegistrar /></ProtectedRoute>} />
        <Route path="/empleados/editar/:id" element={<ProtectedRoute><EmpleadoEditar /></ProtectedRoute>} />

        {/* Proveedores */}
        <Route path="/proveedores" element={<ProtectedRoute><ProveedoresList /></ProtectedRoute>} />
        <Route path="/proveedores/registrar" element={<ProtectedRoute><ProveedorRegistrar /></ProtectedRoute>} />
        <Route path="/proveedores/editar/:id" element={<ProtectedRoute><ProveedorEditar /></ProtectedRoute>} />
        <Route path="/proveedores" element={<ProveedoresList />} />
        <Route path="/proveedores/registrar" element={<ProveedorRegistrar />} />
        <Route path="/proveedores/editar/:id" element={<ProveedorEditar />} />
      </Routes>
    </BrowserRouter>
  );
}
