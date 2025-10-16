from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from pizzeria.models import (
    Empleados, Clientes, Insumos, Platos, Pedidos,
    Ventas, MovimientosCaja, TipoPedidos, EstadoPedidos, MetodoDePago,
    CargoEmpleados, EstadoEmpleados,
    # ─── NUEVO: modelos de proveedores ────────────────────────────────────────
    Proveedores, EstadoProveedores, CategoriaProveedores,
)

from .serializers import (
    EmpleadoSerializer, ClienteSerializer, InsumoSerializer, PlatoSerializer,
    PedidoSerializer, VentaSerializer, MovimientoCajaSerializer, TipoPedidoSerializer,
    EstadoPedidoSerializer, MetodoPagoSerializer,
    CargoSerializer, EstadoEmpleadoSerializer,
    # ─── NUEVO: serializers de proveedores ────────────────────────────────────
    ProveedorSerializer, EstadoProveedorSerializer, CategoriaProveedorSerializer,
)

# ──────────────────────────────────────────────────────────────────────────────
# Catálogos (para selects)
# ──────────────────────────────────────────────────────────────────────────────
class CargoViewSet(ReadOnlyModelViewSet):
    queryset = CargoEmpleados.objects.all().order_by("id_cargo_emp")
    serializer_class = CargoSerializer
    permission_classes = [IsAuthenticated]

class EstadoEmpleadoViewSet(ReadOnlyModelViewSet):
    queryset = EstadoEmpleados.objects.all().order_by("id_estado_empleado")
    serializer_class = EstadoEmpleadoSerializer
    permission_classes = [IsAuthenticated]


# ──────────────────────────────────────────────────────────────────────────────
# Proveedores: catálogos (para selects)
# ──────────────────────────────────────────────────────────────────────────────
class EstadoProveedorViewSet(ReadOnlyModelViewSet):
    queryset = EstadoProveedores.objects.all().order_by("id_estado_prov")
    serializer_class = EstadoProveedorSerializer
    permission_classes = [IsAuthenticated]

class CategoriaProveedorViewSet(ReadOnlyModelViewSet):
    queryset = CategoriaProveedores.objects.all().order_by("id_categoria_prov")
    serializer_class = CategoriaProveedorSerializer
    permission_classes = [IsAuthenticated]


# ──────────────────────────────────────────────────────────────────────────────
# Empleados
# ──────────────────────────────────────────────────────────────────────────────
class EmpleadoViewSet(ModelViewSet):
    queryset = (
        Empleados.objects
        .select_related("id_cargo_emp", "id_estado_empleado")
        .all()
        .order_by("-id_empleado")
    )
    serializer_class = EmpleadoSerializer
    permission_classes = [IsAuthenticated]


# ──────────────────────────────────────────────────────────────────────────────
# Proveedores
# ──────────────────────────────────────────────────────────────────────────────
class ProveedorViewSet(ModelViewSet):
    queryset = (
        Proveedores.objects
        .select_related("id_estado_prov", "id_categoria_prov")
        .all()
        .order_by("-id_proveedor")
    )
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]


# ──────────────────────────────────────────────────────────────────────────────
# Resto (sin cambios)
# ──────────────────────────────────────────────────────────────────────────────
class ClienteViewSet(ModelViewSet):
    queryset = Clientes.objects.all().order_by("-id_cliente")
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

class InsumoViewSet(ModelViewSet):
    queryset = Insumos.objects.all().order_by("-id_insumo")
    serializer_class = InsumoSerializer
    permission_classes = [IsAuthenticated]

class PlatoViewSet(ModelViewSet):
    queryset = Platos.objects.all().order_by("-id_plato")
    serializer_class = PlatoSerializer
    permission_classes = [IsAuthenticated]

class PedidoViewSet(ModelViewSet):
    queryset = Pedidos.objects.all().order_by("-id_pedido")
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]

class VentaViewSet(ModelViewSet):
    queryset = Ventas.objects.all().order_by("-id_venta")
    serializer_class = VentaSerializer
    permission_classes = [IsAuthenticated]

class MovimientoCajaViewSet(ModelViewSet):
    queryset = MovimientosCaja.objects.all().order_by("-id_movimiento_caja")
    serializer_class = MovimientoCajaSerializer
    permission_classes = [IsAuthenticated]

class TipoPedidoViewSet(ModelViewSet):
    queryset = TipoPedidos.objects.all().order_by("-id_tipo_pedido")
    serializer_class = TipoPedidoSerializer
    permission_classes = [IsAuthenticated]

class EstadoPedidoViewSet(ModelViewSet):
    queryset = EstadoPedidos.objects.all().order_by("-id_estado_pedido")
    serializer_class = EstadoPedidoSerializer
    permission_classes = [IsAuthenticated]

class MetodoPagoViewSet(ModelViewSet):
    queryset = MetodoDePago.objects.all().order_by("-id_metodo_pago")
    serializer_class = MetodoPagoSerializer
    permission_classes = [IsAuthenticated]
