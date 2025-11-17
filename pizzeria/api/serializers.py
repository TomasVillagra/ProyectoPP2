import math
from rest_framework import serializers
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User
from pizzeria.models import (
    Empleados, Clientes, Insumos, Platos, Pedidos,
    Ventas, MovimientosCaja, TipoPedidos, EstadoPedidos, MetodoDePago,
    CargoEmpleados, EstadoEmpleados,
    # ─── NUEVO: modelos de proveedores ────────────────────────────────────────
    Proveedores, EstadoProveedores, CategoriaProveedores, Recetas, DetalleRecetas, CategoriaPlatos,
    EstadoReceta, DetallePedidos, Mesas, EstadoCompra, DetalleCompra, Compras, ProveedoresXInsumos,
    EstadoMesas, EstadoVentas, DetalleVentas
)
from django.utils import timezone
# ──────────────────────────────────────────────────────────────────────────────
# Catálogos para selects
# ──────────────────────────────────────────────────────────────────────────────
class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CargoEmpleados
        fields = ["id_cargo_emp", "carg_nombre"]

class EstadoEmpleadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoEmpleados
        fields = ["id_estado_empleado", "estemp_nombre"]


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
class EmpleadosSerializer(serializers.ModelSerializer):
    cargo_nombre = serializers.SerializerMethodField(read_only=True)
    estado_nombre = serializers.SerializerMethodField(read_only=True)

    username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=4)

    class Meta:
        model = Empleados
        fields = [
            "id_empleado", "id_cargo_emp", "id_estado_empleado",
            "emp_nombre", "emp_apellido", "emp_tel", "emp_correo", "emp_dni",
            "cargo_nombre", "estado_nombre",
            "username", "password",
        ]

    def get_cargo_nombre(self, obj):
        cargo = getattr(obj, "id_cargo_emp", None)
        if not cargo:
            return None
        return getattr(cargo, "carg_nombre", None) or str(cargo)

    def get_estado_nombre(self, obj):
        est = getattr(obj, "id_estado_empleado", None)
        if not est:
            return None
        return getattr(est, "estemp_nombre", None) or str(est)

    def validate_username(self, v):
        v = (v or "").strip()
        if v and User.objects.filter(username__iexact=v).exists():
            raise serializers.ValidationError("El nombre de usuario ya existe.")
        return v

    def create(self, validated_data):
        username = (validated_data.pop("username", "") or "").strip()
        password = (validated_data.pop("password", "") or "").strip()
        empleado = Empleados.objects.create(**validated_data)

        if username:
            user = User.objects.create_user(username=username)
            if password:
                user.set_password(password)
            if getattr(empleado, "emp_correo", None):
                user.email = empleado.emp_correo
            user.save()
            empleado.usuario = user
            empleado.save(update_fields=["usuario"])

        return empleado

    def update(self, instance, validated_data):
        validated_data.pop("username", None)
        validated_data.pop("password", None)
        return super().update(instance, validated_data)


# ──────────────────────────────────────────────────────────────────────────────
# Proveedores
# ──────────────────────────────────────────────────────────────────────────────
class ProveedorSerializer(serializers.ModelSerializer):
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
# Catálogos varios
# ──────────────────────────────────────────────────────────────────────────────
class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clientes
        fields = "__all__"

class InsumoSerializer(serializers.ModelSerializer):
    # Campos calculados de sólo lectura para que el front pueda saber
    # cuántos fardos y cuántas unidades sueltas tiene.
    insumos_completos = serializers.SerializerMethodField(read_only=True)
    unidades_sueltas = serializers.SerializerMethodField(read_only=True)
    insumos_equivalentes = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Insumos
        # "__all__" incluye TODAS las columnas de la tabla (incluyendo ins_cantidad e ins_capacidad)
        # + estos SerializerMethodField que declaramos arriba.
        fields = "__all__"

    # ─────────── Helpers para los campos calculados ───────────
    def _capacidad_valida(self, obj):
        cap = getattr(obj, "ins_capacidad", None)
        if cap is None:
            return None
        try:
            if float(cap) <= 0:
                return None
        except Exception:
            return None
        return cap

    def get_insumos_completos(self, obj):
        cap = self._capacidad_valida(obj)
        stock = getattr(obj, "ins_stock_actual", None)
        if cap is None or stock is None:
            return None
        return int(stock // cap)

    def get_unidades_sueltas(self, obj):
        cap = self._capacidad_valida(obj)
        stock = getattr(obj, "ins_stock_actual", None)
        if cap is None or stock is None:
            return None
        return stock - (self.get_insumos_completos(obj) * cap)

    def get_insumos_equivalentes(self, obj):
        """
        Devuelve fardos equivalentes redondeando para arriba,
        para casos como:
        - capacidad = 6
        - stock_actual = 5 → devuelve 1 (como dijiste: “hay un fardo”)
        """
        cap = self._capacidad_valida(obj)
        stock = getattr(obj, "ins_stock_actual", None)
        if cap is None or stock is None:
            return None
        return math.ceil(float(stock) / float(cap))

    # ─────────── Lógica de creación/actualización ───────────
    def _set_stock_from_cant_y_cap(self, data):
        """
        Si vienen ins_cantidad e ins_capacidad,
        forzamos que ins_stock_actual = cantidad * capacidad.
        """
        cant = data.get("ins_cantidad")
        cap = data.get("ins_capacidad")
        if cant is not None and cap is not None:
            data["ins_stock_actual"] = cant * cap

    def create(self, validated_data):
        # Al crear SIEMPRE calculamos stock_actual = cantidad × capacidad
        self._set_stock_from_cant_y_cap(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Al editar, usamos los nuevos valores (o los que ya tenía el objeto)
        if "ins_cantidad" in validated_data or "ins_capacidad" in validated_data:
            data = {
                "ins_cantidad": validated_data.get("ins_cantidad", instance.ins_cantidad),
                "ins_capacidad": validated_data.get("ins_capacidad", instance.ins_capacidad),
            }
            self._set_stock_from_cant_y_cap(validated_data | data)
        return super().update(instance, validated_data)


class CategoriaPlatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaPlatos
        fields = "__all__"

class EstadoRecetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoReceta
        fields = ["id_estado_receta", "estrec_nombre"]

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

class EstadoMesasSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoMesas
        fields = ["id_estado_mesa", "estms_nombre"]

class MesasSerializer(serializers.ModelSerializer):
    estado_mesa_nombre = serializers.CharField(
        source="id_estado_mesa.estms_nombre", read_only=True
    )
    class Meta:
        model = Mesas
        fields = "__all__"


# ──────────────────────────────────────────────────────────────────────────────
# Platos y Recetas
# ──────────────────────────────────────────────────────────────────────────────
class PlatoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.SerializerMethodField(read_only=True)
    estado_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Platos
        fields = [
            "id_plato",
            "plt_nombre",
            "plt_precio",
            "plt_stock",
            "id_categoria_plato",
            "id_estado_plato",
            "categoria_nombre",
            "estado_nombre",
        ]

    def get_categoria_nombre(self, obj):
        try:
            return obj.id_categoria_plato.catplt_nombre
        except Exception:
            return None

    def get_estado_nombre(self, obj):
        try:
            return obj.id_estado_plato.estplt_nombre
        except Exception:
            return None


class DetalleRecetaSerializer(serializers.ModelSerializer):
    id_receta = serializers.PrimaryKeyRelatedField(queryset=Recetas.objects.all(), write_only=True)
    id_insumo = serializers.PrimaryKeyRelatedField(queryset=Insumos.objects.all())
    insumo_nombre = serializers.SerializerMethodField(read_only=True)
    insumo_unidad = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DetalleRecetas
        fields = [
            "id_detalle_receta",
            "id_receta",
            "id_insumo",
            "detr_cant_unid",
            "insumo_nombre",
            "insumo_unidad",
        ]

    def get_insumo_nombre(self, obj):
        try:
            return obj.id_insumo.ins_nombre
        except Exception:
            return None

    def get_insumo_unidad(self, obj):
        try:
            return obj.id_insumo.ins_unidad
        except Exception:
            return None


class RecetaSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.SerializerMethodField(read_only=True)
    plato_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Recetas
        fields = [
            "id_receta",
            "id_plato",
            "rec_desc",
            "id_estado_receta",
            "estado_nombre",
            "plato_nombre",
        ]

    def get_estado_nombre(self, obj):
        try:
            return getattr(obj.id_estado_receta, "estrec_nombre", None)
        except Exception:
            return None

    def get_plato_nombre(self, obj):
        try:
            return getattr(obj.id_plato, "plt_nombre", None)
        except Exception:
            return None


# ──────────────────────────────────────────────────────────────────────────────
# Pedidos
# ──────────────────────────────────────────────────────────────────────────────
class DetallePedidoSerializer(serializers.ModelSerializer):
    plato_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DetallePedidos
        fields = [
            'id_detalle_pedido',
            'id_pedido',
            'id_plato',
            'plato_nombre',
            'detped_cantidad',
        ]

    def get_plato_nombre(self, obj):
        try:
            plato = getattr(obj, 'id_plato', None) or getattr(obj, 'plato', None)
            if plato:
                return getattr(plato, 'plt_nombre', None) or getattr(plato, 'nombre', None)
        except Exception:
            pass
        return None


class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(source="detallepedidos_set", many=True, read_only=True)
    mesa_numero = serializers.SerializerMethodField(read_only=True)
    empleado_nombre = serializers.SerializerMethodField(read_only=True)
    cliente_nombre = serializers.SerializerMethodField(read_only=True)
    estado_nombre = serializers.SerializerMethodField(read_only=True)
    tipo_nombre = serializers.SerializerMethodField(read_only=True)
    total = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Pedidos
        fields = [
            "id_pedido",
            "id_mesa",
            "id_empleado",
            "id_cliente",
            "id_estado_pedido",
            "id_tipo_pedido",
            "ped_fecha_hora_ini",
            "ped_fecha_hora_fin",
            "ped_descripcion",
            "mesa_numero",
            "empleado_nombre",
            "cliente_nombre",
            "estado_nombre",
            "tipo_nombre",
            "total",
            "detalles",
        ]

    def get_mesa_numero(self, obj):
        try:
            return obj.id_mesa.ms_numero
        except Exception:
            return None

    def get_empleado_nombre(self, obj):
        try:
            return f"{obj.id_empleado.emp_nombre} {obj.id_empleado.emp_apellido}".strip()
        except Exception:
            return None

    def get_cliente_nombre(self, obj):
        try:
            return obj.id_cliente.cli_nombre
        except Exception:
            return None

    def get_estado_nombre(self, obj):
        try:
            return obj.id_estado_pedido.estped_nombre
        except Exception:
            return None

    def get_tipo_nombre(self, obj):
        try:
            return obj.id_tipo_pedido.tipped_nombre
        except Exception:
            return None

    def get_total(self, obj):
        try:
            total = 0.0
            for d in obj.detallepedidos_set.select_related("id_plato").all():
                precio = float(d.id_plato.plt_precio)
                qty = int(d.detped_cantidad)
                total += precio * qty
            return total
        except Exception:
            return None


# ──────────────────────────────────────────────────────────────────────────────
# Compras
# ──────────────────────────────────────────────────────────────────────────────
class EstadoCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoCompra
        fields = ["id_estado_compra", "estcom_nombre"]


class DetalleCompraSerializer(serializers.ModelSerializer):
    detcom_subtotal = serializers.SerializerMethodField(read_only=True)
    insumo_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DetalleCompra
        fields = [
            "id_detalle_compra",
            "id_compra",
            "id_insumo",
            "detcom_cantidad",
            "detcom_precio_uni",
            "detcom_subtotal",
            "insumo_nombre",
        ]

    def get_detcom_subtotal(self, obj):
        try:
            return (obj.detcom_cantidad or 0) * (obj.detcom_precio_uni or 0)
        except Exception:
            return None

    def get_insumo_nombre(self, obj):
        try:
            return obj.id_insumo.ins_nombre
        except Exception:
            return None


class CompraSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.SerializerMethodField(read_only=True)
    estado_nombre   = serializers.SerializerMethodField(read_only=True)
    proveedor_nombre = serializers.SerializerMethodField(read_only=True)
    metodo_pago_nombre = serializers.SerializerMethodField(read_only=True)

    detalles = DetalleCompraSerializer(source="detallecompra_set", many=True, read_only=True)

    class Meta:
        model = Compras
        fields = [
            "id_compra",
            "id_empleado",
            "id_estado_compra",
            "id_proveedor",
            "id_metodo_pago",        # FK añadida por migración manual
            "com_fecha_hora",
            "com_monto",
            "com_descripcion",
            "empleado_nombre",
            "estado_nombre",
            "proveedor_nombre",
            "metodo_pago_nombre",
            "detalles",
            "com_pagado",
        ]

    def get_empleado_nombre(self, obj):
        try:
            return f"{obj.id_empleado.emp_nombre} {obj.id_empleado.emp_apellido}".strip()
        except Exception:
            return None

    def get_estado_nombre(self, obj):
        try:
            return obj.id_estado_compra.estcom_nombre
        except Exception:
            return None

    def get_proveedor_nombre(self, obj):
        try:
            return obj.id_proveedor.prov_nombre
        except Exception:
            return None

    def get_metodo_pago_nombre(self, obj):
        try:
            # IMPORTANTE: usar el nombre real del campo en tu tabla (nos dijiste "metpag_nombre")
            return getattr(obj.id_metodo_pago, "metpag_nombre", None)
        except Exception:
            return None


class ProveedorInsumoSerializer(serializers.ModelSerializer):
    id_proveedor = serializers.PrimaryKeyRelatedField(queryset=Proveedores.objects.all())
    id_insumo    = serializers.PrimaryKeyRelatedField(queryset=Insumos.objects.all())

    precio_unitario = serializers.DecimalField(
        max_digits=12,
        decimal_places=3,
        required=False,
        allow_null=True
    )

    proveedor_nombre = serializers.SerializerMethodField(read_only=True)
    insumo_nombre    = serializers.SerializerMethodField(read_only=True)
    insumo_unidad    = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = ProveedoresXInsumos
        fields = [
            "id_prov_x_ins",
            "id_proveedor",
            "id_insumo",
            "precio_unitario",
            "proveedor_nombre",
            "insumo_nombre",
            "insumo_unidad",
        ]

    def get_proveedor_nombre(self, obj):
        try:
            return obj.id_proveedor.prov_nombre
        except Exception:
            return None

    def get_insumo_nombre(self, obj):
        try:
            return obj.id_insumo.ins_nombre
        except Exception:
            return None

    def get_insumo_unidad(self, obj):
        try:
            return obj.id_insumo.ins_unidad
        except Exception:
            return None

    def validate_precio_unitario(self, v):
        if v is not None and v < 0:
            raise serializers.ValidationError("El precio unitario no puede ser negativo.")
        return v

    def validate(self, attrs):
        prov = attrs.get("id_proveedor", getattr(getattr(self, "instance", None), "id_proveedor", None))
        ins  = attrs.get("id_insumo",    getattr(getattr(self, "instance", None), "id_insumo", None))

        if prov and ins:
            qs = ProveedoresXInsumos.objects.filter(id_proveedor=prov, id_insumo=ins)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Ese insumo ya está vinculado a este proveedor.")

        if self.instance is None and attrs.get("precio_unitario", None) is None:
            raise serializers.ValidationError({"precio_unitario": "El precio es obligatorio al vincular."})
        return attrs


# ──────────────────────────────────────────────────────────────────────────────
# Ventas (lectura y escritura)
# ──────────────────────────────────────────────────────────────────────────────
class EstadoVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoVentas
        fields = ["id_estado_venta", "estven_nombre"]


class DetalleVentaSerializer(serializers.ModelSerializer):
    detven_subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    plato_nombre = serializers.SerializerMethodField()

    class Meta:
        model = DetalleVentas
        fields = [
            "id_detalle_venta",
            "id_venta",
            "id_plato",
            "detven_precio_uni",
            "detven_cantidad",
            "detven_subtotal",
        ]

    def get_plato_nombre(self, obj):
        # Intento robusto por si el nombre del campo del modelo Plato difiere
        plato = getattr(obj, "id_plato", None)
        if not plato:
            return None
        # Probar nombres comunes sin romper nada:
        for attr in ("pla_nombre", "plato_nombre", "nombre", "pla_descripcion"):
            val = getattr(plato, attr, None)
            if val:
                return val
        return None

    class Meta:
        model = DetalleVentas
        # '__all__' incluye TODOS los campos del modelo + los declarados arriba,
        # evitando exactamente el AssertionError que tenés.
        fields = "__all__"


class VentaSerializer(serializers.ModelSerializer):
    metodo_pago_nombre = serializers.SerializerMethodField()
    estado_venta_nombre = serializers.SerializerMethodField()
    empleado_nombre = serializers.SerializerMethodField()
    cliente_nombre = serializers.SerializerMethodField()
    detalles = DetalleVentaSerializer(source="detalleventas_set", many=True, read_only=True)

    class Meta:
        model = Ventas
        fields = [
            "id_venta",
            "id_cliente",
            "id_empleado",
            "id_estado_venta",
            "id_metodo_pago",          # FK (existe en BD por migración manual)
            "ven_fecha_hora",
            "ven_monto",
            "ven_descripcion",
            "metodo_pago_nombre",
            "estado_venta_nombre",
            "empleado_nombre",
            "cliente_nombre",
            "detalles",
        ]

    def get_metodo_pago_nombre(self, obj):
        try:
            return getattr(obj.id_metodo_pago, "metpag_nombre", None)  # ← nombre real
        except Exception:
            return None

    def get_estado_venta_nombre(self, obj):
        try:
            return getattr(obj.id_estado_venta, "estven_nombre", None)
        except Exception:
            return None

    def get_empleado_nombre(self, obj):
        try:
            return f"{obj.id_empleado.emp_nombre} {obj.id_empleado.emp_apellido}".strip()
        except Exception:
            return None

    def get_cliente_nombre(self, obj):
        try:
            return getattr(obj.id_cliente, "cli_nombre", None)
        except Exception:
            return None


class VentaCreateSerializer(serializers.ModelSerializer):
    """
    Para crear/editar ventas desde el front:
    - Requiere id_metodo_pago.
    - Permite ven_descripcion opcional.
    El detalle se maneja por endpoint propio (como ya lo hacés).
    """
    class Meta:
        model = Ventas
        fields = [
            "id_venta",
            "id_cliente",
            "id_empleado",
            "id_estado_venta",
            "id_metodo_pago",
            "ven_descripcion",
        ]

    def validate(self, attrs):
        if not attrs.get("id_metodo_pago"):
            raise serializers.ValidationError({"id_metodo_pago": "El método de pago es obligatorio."})
        return attrs


# ──────────────────────────────────────────────────────────────────────────────
# Caja / Movimientos de Caja
# ──────────────────────────────────────────────────────────────────────────────
class MovimientoCajaSerializer(serializers.ModelSerializer):
    # Extras de sólo lectura para mostrar en listas
    metodo_pago_nombre = serializers.SerializerMethodField()
    tipo_nombre = serializers.SerializerMethodField()
    empleado_nombre = serializers.SerializerMethodField()
    venta_id = serializers.IntegerField(
        source="id_venta.id_venta", read_only=True, default=None
    )
    # Alias compatible con el antiguo "id_movimiento"
    id_movimiento = serializers.IntegerField(
        source="id_movimiento_caja", read_only=True
    )

    class Meta:
        model = MovimientosCaja
        fields = [
            "id_movimiento_caja",
            "id_movimiento",          # alias sólo lectura
            "id_empleado",
            "id_metodo_pago",
            "id_tipo_movimiento_caja",
            "id_venta",
            "id_compra",
            "mv_fecha_hora",
            "mv_monto",
            "mv_descripcion",
            "metodo_pago_nombre",
            "tipo_nombre",
            "empleado_nombre",
            "venta_id",
        ]

    def get_metodo_pago_nombre(self, obj):
        try:
            return getattr(obj.id_metodo_pago, "metpag_nombre", None)
        except Exception:
            return None

    def get_tipo_nombre(self, obj):
        try:
            return getattr(obj.id_tipo_movimiento_caja, "tmovc_nombre", None)
        except Exception:
            return None

    def get_empleado_nombre(self, obj):
        try:
            return f"{obj.id_empleado.emp_nombre} {obj.id_empleado.emp_apellido}".strip()
        except Exception:
            return None


class MovimientosCajaCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/editar movimientos de caja.
    El ViewSet se encarga de:
      - setear id_empleado a partir de request.user
      - ajustar campos según el tipo (APERTURA / INGRESO / EGRESO / CIERRE)
      - calcular mv_monto en el CIERRE
    """

    class Meta:
        model = MovimientosCaja
        fields = [
            "id_movimiento_caja",
            "id_empleado",
            "id_metodo_pago",
            "id_tipo_movimiento_caja",
            "id_venta",
            "id_compra",
            "mv_monto",
            "mv_descripcion",
        ]
        read_only_fields = ["id_movimiento_caja", "id_empleado"]


# ──────────────────────────────────────────────────────────────────────────────
# Arqueo de Caja (Serializers de I/O para endpoints de reporte)
# ──────────────────────────────────────────────────────────────────────────────
class ArqueoCajaInputSerializer(serializers.Serializer):
    """
    Filtros opcionales para el arqueo:
    - fecha_desde / fecha_hasta (YYYY-MM-DD), opcionales
    - id_empleado (opcional)
    """
    fecha_desde = serializers.DateField(required=False)
    fecha_hasta = serializers.DateField(required=False)
    id_empleado = serializers.IntegerField(required=False)


class ArqueoMetodoPagoSerializer(serializers.Serializer):
    id_metodo_pago = serializers.IntegerField()
    metodo_pago = serializers.CharField()
    ingresos = serializers.DecimalField(max_digits=14, decimal_places=2)
    egresos = serializers.DecimalField(max_digits=14, decimal_places=2)
    neto = serializers.DecimalField(max_digits=14, decimal_places=2)


class ArqueoCajaOutputSerializer(serializers.Serializer):
    por_metodo = ArqueoMetodoPagoSerializer(many=True)
    total_ingresos = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_egresos = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_neto = serializers.DecimalField(max_digits=14, decimal_places=2)

