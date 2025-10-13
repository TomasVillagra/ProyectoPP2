from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmpleadoViewSet, ClienteViewSet, InsumoViewSet, PlatoViewSet,
    PedidoViewSet, VentaViewSet, MovimientoCajaViewSet,
    TipoPedidoViewSet, EstadoPedidoViewSet, MetodoPagoViewSet
)

router = DefaultRouter()
router.register(r'empleados', EmpleadoViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'insumos', InsumoViewSet)
router.register(r'platos', PlatoViewSet)
router.register(r'pedidos', PedidoViewSet, basename='pedidos')
router.register(r'ventas', VentaViewSet, basename='ventas')
router.register(r'movimientos-caja', MovimientoCajaViewSet, basename='movimientos-caja')
router.register(r'tipos-pedido', TipoPedidoViewSet, basename='tipos-pedido')
router.register(r'estados-pedido', EstadoPedidoViewSet, basename='estados-pedido')
router.register(r'metodos-pago', MetodoPagoViewSet, basename='metodos-pago')

urlpatterns = [
    path('', include(router.urls)),
]
