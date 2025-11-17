// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";

// Otras secciones
  
import CobroRegistrar from "./pages/cobros/CobroRegistrar";
import CajaPanel from "./pages/caja/CajaPanel";
import MovimientosCajaList from "./pages/caja/MovimientosCajaList";
import CajaHistorial from "./pages/caja/CajaHistorial";

import InventarioList from "./pages/inventario/InventarioList";
import InsumoRegistrar from "./pages/inventario/InsumoRegistrar";
import InsumoEditar from "./pages/inventario/InsumoEditar";
import InventarioInactivosList from "./pages/inventario/InventarioInactivosList";

// Empleados (rutas nuevas separadas)
import EmpleadosList from "./pages/empleados/EmpleadosList";
import EmpleadoRegistrar from "./pages/empleados/EmpleadoRegistrar";
import EmpleadoEditar from "./pages/empleados/EmpleadoEditar";
import ProveedoresList from "./pages/proveedores/ProveedoresList";
import ProveedorRegistrar from "./pages/proveedores/ProveedorRegistrar";
import ProveedorEditar from "./pages/proveedores/ProveedorEditar";
import ProveedoresInactivosList from "./pages/proveedores/ProveedoresInactivosList";
// Platos
import PlatosList from "./pages/platos/PlatosList";
import PlatoRegistrar from "./pages/platos/PlatoRegistrar";
import PlatoEditar from "./pages/platos/PlatoEditar";

// Recetas
import RecetasList from "./pages/recetas/RecetasList";
import RecetaRegistrar from "./pages/recetas/RecetaRegistrar";
import RecetaEditar from "./pages/recetas/RecetaEditar";

//pedidos
import PedidosList from "./pages/pedidos/PedidosList";
import PedidoRegistrar from "./pages/pedidos/PedidoRegistrar";
import PedidoEditar from "./pages/pedidos/PedidoEditar";
import PedidoDetalle from "./pages/pedidos/PedidoDetalle";

import ComprasList from "./pages/compras/ComprasList";
import CompraRegistrar from "./pages/compras/CompraRegistrar";
import CompraEditar from "./pages/compras/CompraEditar";

import ProveedorInsumos from "./pages/proveedores/ProveedorInsumos";

import MesasList from "./pages/mesas/MesasList";
import MesaRegistrar from "./pages/mesas/MesaRegistrar";
import MesaEditar from "./pages/mesas/MesaEditar";

import VentasList from "./pages/ventas/VentasList";
import VentaDetalle from "./pages/ventas/VentaDetalle";

import ComprasDetalle from "./pages/compras/ComprasDetalle";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard (Home) */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        {/* Secciones */}

        <Route path="/ventas" element={<ProtectedRoute><VentasList /></ProtectedRoute>} />
        <Route path="/ventas/:id" element={<ProtectedRoute><VentaDetalle /></ProtectedRoute>} />
        <Route path="/caja" element={<ProtectedRoute><CajaPanel /></ProtectedRoute>} />
        <Route path="/cobros/registrar/:id_venta" element={<ProtectedRoute><CobroRegistrar /></ProtectedRoute>} />
        <Route path="/cobros/:id_venta" element={<CobroRegistrar />} />
        <Route path="/caja/historial" element={ <ProtectedRoute> <CajaHistorial /></ProtectedRoute>}
/>


    
        <Route path="/caja/movimientos" element={<ProtectedRoute><MovimientosCajaList /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><InventarioList /></ProtectedRoute>} />
        <Route path="/inventario/registrar" element={<ProtectedRoute><InsumoRegistrar /></ProtectedRoute>} />
        <Route path="/inventario/editar/:id" element={<ProtectedRoute><InsumoEditar /></ProtectedRoute>} />
        <Route path="/inventario/inactivos" element={<InventarioInactivosList />} />
        {/* Empleados */}
        <Route path="/empleados" element={<ProtectedRoute><EmpleadosList /></ProtectedRoute>} />
        <Route path="/empleados/registrar" element={<ProtectedRoute><EmpleadoRegistrar /></ProtectedRoute>} />
        <Route path="/empleados/editar/:id" element={<ProtectedRoute><EmpleadoEditar /></ProtectedRoute>} />

        {/* Proveedores */}
        <Route path="/proveedores" element={<ProtectedRoute><ProveedoresList /></ProtectedRoute>} />
        <Route path="/proveedores/registrar" element={<ProtectedRoute><ProveedorRegistrar /></ProtectedRoute>} />
        <Route path="/proveedores/editar/:id" element={<ProtectedRoute><ProveedorEditar /></ProtectedRoute>} />
        <Route path="/proveedores/:id/insumos" element={<ProveedorInsumos />} />

        <Route path="/proveedores/inactivos" element={<ProveedoresInactivosList />} />
        {/* Platos */}
          <Route path="/platos" element={<PlatosList />} />
          <Route path="/platos/registrar" element={<PlatoRegistrar />} />
          <Route path="/platos/:id/editar" element={<PlatoEditar />} />

          <Route path="/recetas" element={<RecetasList />} />
          <Route path="/recetas/registrar" element={<RecetaRegistrar />} />
          <Route path="/recetas/:id/editar" element={<RecetaEditar />} />
        {/* Pedidos */}
          <Route path="/pedidos" element={<PedidosList />} />
          <Route path="/pedidos/registrar" element={<PedidoRegistrar />} />
          <Route path="/pedidos/:id/editar" element={<PedidoEditar />} />
          <Route path="/pedidos/:id" element={<PedidoDetalle />} />

          <Route path="/compras" element={<ComprasList />} />
          <Route path="/compras/registrar" element={<CompraRegistrar />} />
          <Route path="/compras/editar/:id" element={<CompraEditar />} />
          <Route path="/compras/detalles/:id" element={<ComprasDetalle />} />


          <Route path="/mesas" element={<MesasList />} />
          <Route path="/mesas/registrar" element={<MesaRegistrar />} />
          <Route path="/mesas/:id/editar" element={<MesaEditar />} />

      </Routes>
    </BrowserRouter>
  );
}
