from django.urls import path, include
from rest_framework.routers import DefaultRouter
from pizzeria.api.views import (
    EmpleadosViewSet, ClienteViewSet, InsumoViewSet, PlatoViewSet,
    PedidoViewSet, VentaViewSet, MovimientoCajaViewSet, TipoPedidoViewSet,
    EstadoPedidoViewSet, MetodoPagoViewSet,
    CargoViewSet, EstadoEmpleadoViewSet,ProveedorViewSet, EstadoProveedorViewSet, CategoriaProveedorViewSet,RecetaViewSet,DetalleRecetaViewSet,
    CategoriaPlatoViewSet,EstadoRecetaViewSet,DetallePedidoViewSet,EstadoCompraViewSet,CompraViewSet,DetalleCompraViewSet,
    CompraViewSet,DetalleCompraViewSet,ProveedorInsumoViewSet,EstadoMesasViewSet,MesasViewSet
)

router = DefaultRouter()
router.register(r"empleados", EmpleadosViewSet, basename="empleados")
router.register(r"clientes", ClienteViewSet, basename="clientes")
router.register(r"insumos", InsumoViewSet, basename="insumos")
router.register(r"platos", PlatoViewSet, basename="platos")
router.register(r"pedidos", PedidoViewSet, basename="pedidos")
router.register(r"ventas", VentaViewSet, basename="ventas")
router.register(r"movimientos-caja", MovimientoCajaViewSet, basename="movimientos-caja")
router.register(r"tipos-pedido", TipoPedidoViewSet, basename="tipos-pedido")
router.register(r"estados-pedido", EstadoPedidoViewSet, basename="estados-pedido")
router.register(r"metodos-pago", MetodoPagoViewSet, basename="metodos-pago")
router.register(r'proveedores', ProveedorViewSet, basename='proveedor')
router.register(r'estados-proveedor', EstadoProveedorViewSet, basename='estado-proveedor')
router.register(r'categorias-proveedor', CategoriaProveedorViewSet, basename='categoria-proveedor')
# ← NUEVOS catálogos para selects:
router.register(r"cargos", CargoViewSet, basename="cargos")
router.register(r"estados-empleado", EstadoEmpleadoViewSet, basename="estados-empleado")
router.register(r"recetas", RecetaViewSet, basename="recetas")
router.register(r"detalle-recetas", DetalleRecetaViewSet, basename="detalle-recetas")
router.register(r"categorias-plato", CategoriaPlatoViewSet, basename="categorias-plato")
router.register(r"estado-recetas", EstadoRecetaViewSet, basename="estados-receta")
router.register(r"detalle-pedidos", DetallePedidoViewSet, basename="detalle-pedidos")
router.register(r"mesas", MesasViewSet, basename="mesas")
router.register(r"estados-compra", EstadoCompraViewSet, basename="estados-compra")
router.register(r"compras", CompraViewSet, basename="compras")
router.register(r"detalle-compras", DetalleCompraViewSet, basename="detalle-compras")
router.register(r"proveedores-insumos", ProveedorInsumoViewSet, basename="proveedores-insumos")
router.register(r"estados-mesa", EstadoMesasViewSet, basename="estados-mesa")
urlpatterns = [
    path("api/", include(router.urls)),
    # ... (tus rutas de auth/me/logout/JWT si las tenés)
]


urlpatterns = [
    path('', include(router.urls)),
]
