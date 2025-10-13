from rest_framework import serializers
from pizzeria.models import (
    Empleados, Clientes, Insumos, Platos, Pedidos,
    Ventas, MovimientosCaja, TipoPedidos, EstadoPedidos, MetodoDePago
)

class EmpleadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleados
        fields = "__all__"

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clientes
        fields = "__all__"

class InsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumos
        fields = "__all__"

class PlatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Platos
        fields = "__all__"

class PedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedidos
        fields = "__all__"

class VentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ventas
        fields = "__all__"

class MovimientoCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientosCaja
        fields = "__all__"

class TipoPedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPedidos
        fields = "__all__"

class EstadoPedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoPedidos
        fields = "__all__"

class MetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetodoDePago
        fields = "__all__"
