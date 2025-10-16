from rest_framework import serializers
from django.contrib.auth.models import User
from pizzeria.models import (
    Empleados, Clientes, Insumos, Platos, Pedidos,
    Ventas, MovimientosCaja, TipoPedidos, EstadoPedidos, MetodoDePago,
    CargoEmpleados, EstadoEmpleados,
    # ─── NUEVO: modelos de proveedores ────────────────────────────────────────
    Proveedores, EstadoProveedores, CategoriaProveedores,
)

# ──────────────────────────────────────────────────────────────────────────────
# Catálogos para selects
# ──────────────────────────────────────────────────────────────────────────────
class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CargoEmpleados
        fields = ["id_cargo_emp", "carg_nombre"]  # FK id + nombre

class EstadoEmpleadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoEmpleados
        fields = ["id_estado_empleado", "estemp_nombre"]  # FK id + nombre


# ──────────────────────────────────────────────────────────────────────────────
# Proveedores: catálogos (para selects)
# ──────────────────────────────────────────────────────────────────────────────
class EstadoProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoProveedores
        fields = ["id_estado_prov", "estprov_nombre"]

class CategoriaProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaProveedores
        fields = ["id_categoria_prov", "catprov_nombre"]


# ──────────────────────────────────────────────────────────────────────────────
# Empleados
# ──────────────────────────────────────────────────────────────────────────────
class EmpleadoSerializer(serializers.ModelSerializer):
    # Opcionales para crear el User (login) a la vez
    username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=4)

    # Devolver nombre de FK en la respuesta (solo lectura)
    cargo_nombre = serializers.SerializerMethodField(read_only=True)
    estado_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Empleados
        fields = [
            # DB fields
            "id_empleado",
            "id_cargo_emp",
            "id_estado_empleado",
            "emp_nombre",
            "emp_apellido",
            "emp_tel",
            "emp_correo",
            "emp_dni",
            # write-only (para crear User de login)
            "username",
            "password",
            # read-only decorativos
            "cargo_nombre",
            "estado_nombre",
        ]

    def get_cargo_nombre(self, obj):
        try:
            return obj.id_cargo_emp.carg_nombre
        except Exception:
            return None

    def get_estado_nombre(self, obj):
        try:
            return obj.id_estado_empleado.estemp_nombre
        except Exception:
            return None

    def create(self, validated_data):
        username = (validated_data.pop("username", "") or "").strip()
        password = (validated_data.pop("password", "") or "").strip()

        # Si llega username+password, crear usuario de Django para login
        if username and password:
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({"username": "Ya existe un usuario con ese username."})

            first_name = validated_data.get("emp_nombre", "") or ""
            last_name = validated_data.get("emp_apellido", "") or ""
            email = validated_data.get("emp_correo", "") or ""

            User.objects.create_user(
                username=username,
                password=password,
                first_name=first_name,
                last_name=last_name,
                email=email,
            )

        # Crear el empleado normal (FKs por id)
        empleado = Empleados.objects.create(**validated_data)
        return empleado


# ──────────────────────────────────────────────────────────────────────────────
# Proveedores
# ──────────────────────────────────────────────────────────────────────────────
class ProveedorSerializer(serializers.ModelSerializer):
    # Lecturas “bonitas” de las FKs
    estado_nombre = serializers.SerializerMethodField(read_only=True)
    categoria_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Proveedores
        fields = [
            "id_proveedor",
            "prov_nombre",
            "prov_tel",
            "prov_correo",
            "prov_direccion",
            "id_estado_prov",
            "id_categoria_prov",
            # solo lectura
            "estado_nombre",
            "categoria_nombre",
        ]

    def get_estado_nombre(self, obj):
        try:
            return obj.id_estado_prov.estprov_nombre
        except Exception:
            return None

    def get_categoria_nombre(self, obj):
        try:
            return obj.id_categoria_prov.catprov_nombre
        except Exception:
            return None


# ──────────────────────────────────────────────────────────────────────────────
# El resto de tus serializers (sin cambios)
# ──────────────────────────────────────────────────────────────────────────────
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
