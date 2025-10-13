from datetime import datetime, date
from django.db.models import Sum
from rest_framework import viewsets, permissions, decorators, response
from pizzeria.models import (
    Empleados, Clientes, Insumos, Platos, Pedidos, Ventas,
    MovimientosCaja, TipoPedidos, EstadoPedidos, MetodoDePago
)
from .serializers import (
    EmpleadoSerializer, ClienteSerializer, InsumoSerializer, PlatoSerializer,
    PedidoSerializer, VentaSerializer, MovimientoCajaSerializer,
    TipoPedidoSerializer, EstadoPedidoSerializer, MetodoPagoSerializer
)

class EmpleadoViewSet(viewsets.ModelViewSet):
    queryset = Empleados.objects.all()
    serializer_class = EmpleadoSerializer
    permission_classes = [permissions.IsAuthenticated]

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Clientes.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

class InsumoViewSet(viewsets.ModelViewSet):
    queryset = Insumos.objects.all()
    serializer_class = InsumoSerializer
    permission_classes = [permissions.IsAuthenticated]

class PlatoViewSet(viewsets.ModelViewSet):
    queryset = Platos.objects.all()
    serializer_class = PlatoSerializer
    permission_classes = [permissions.IsAuthenticated]

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedidos.objects.all().order_by('-id_pedido')
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['get'])
    def en_proceso(self, request):
        qs = self.queryset.filter(id_estado_pedido__estped_nombre__iexact='en proceso')
        ser = self.get_serializer(qs, many=True)
        return response.Response(ser.data)

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Ventas.objects.all().order_by('-ven_fecha_hora')
    serializer_class = VentaSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['get'])
    def hoy(self, request):
        today = date.today()
        qs = self.queryset.filter(ven_fecha_hora__date=today)
        total = qs.aggregate(total=Sum('ven_monto'))['total'] or 0
        return response.Response({'fecha': str(today), 'total': total})

class MovimientoCajaViewSet(viewsets.ModelViewSet):
    queryset = MovimientosCaja.objects.all().order_by('-mv_fecha_hora')
    serializer_class = MovimientoCajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['get'])
    def turno(self, request):
        hoy = date.today()
        inicio = datetime.combine(hoy, datetime.min.time()).replace(hour=8)
        fin = datetime.combine(hoy, datetime.min.time()).replace(hour=23, minute=59, second=59)
        qs = self.queryset.filter(mv_fecha_hora__range=(inicio, fin))
        total = qs.aggregate(total=Sum('mv_monto'))['total'] or 0
        return response.Response({'inicio': inicio.isoformat(), 'fin': fin.isoformat(), 'total': total})

class TipoPedidoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoPedidos.objects.all()
    serializer_class = TipoPedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

class EstadoPedidoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EstadoPedidos.objects.all()
    serializer_class = EstadoPedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

class MetodoPagoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MetodoDePago.objects.all()
    serializer_class = MetodoPagoSerializer
    permission_classes = [permissions.IsAuthenticated]
