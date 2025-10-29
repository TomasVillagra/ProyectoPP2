from rest_framework import serializers
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User
from pizzeria.models import (
    Empleados, Clientes, Insumos, Platos, Pedidos,
    Ventas, MovimientosCaja, TipoPedidos, EstadoPedidos, MetodoDePago,
    CargoEmpleados, EstadoEmpleados,
    # ─── NUEVO: modelos de proveedores ────────────────────────────────────────
    Proveedores, EstadoProveedores, CategoriaProveedores,Recetas,DetalleRecetas,CategoriaPlatos,
    EstadoReceta,DetallePedidos,Mesas,EstadoCompra,DetalleCompra,Compras,ProveedoresXInsumos,
    EstadoMesas,EstadoVentas,DetalleVentas
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
class EmpleadosSerializer(serializers.ModelSerializer):
    cargo_nombre = serializers.SerializerMethodField(read_only=True)
    estado_nombre = serializers.SerializerMethodField(read_only=True)

    # opcional: crear user y vincular
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
            # campos “bonitos”
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


# --- Estados de Venta (catálogo para selects) ---
class EstadoVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoVentas
        fields = ["id_estado_venta", "estven_nombre"]

class VentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ventas
        fields = "__all__"

# --- Detalle de Venta ---
class DetalleVentaSerializer(serializers.ModelSerializer):
    detven_subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    class Meta:
        model = DetalleVentas
        fields = [
            "id_detalle_venta",
            "id_venta",
            "id_plato",
            "detven_precio_uni",
            "detven_cantidad",
            "detven_subtotal",  # read_only
        ]

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

# --- al final del archivo, debajo de tus serializers actuales ---

# --- Detalle de Receta (LECTURA+ESCRITURA) ---
class DetalleRecetaSerializer(serializers.ModelSerializer):
    # FK explícitas para escritura
    id_receta = serializers.PrimaryKeyRelatedField(
        queryset=Recetas.objects.all(), write_only=True
    )
    id_insumo = serializers.PrimaryKeyRelatedField(
        queryset=Insumos.objects.all()
    )

    # Lecturas “bonitas” (solo lectura)
    insumo_nombre = serializers.SerializerMethodField(read_only=True)
    insumo_unidad = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DetalleRecetas
        fields = [
            "id_detalle_receta",
            "id_receta",       # ⬅️ NECESARIO para crear
            "id_insumo",
            "detr_cant_unid",
            # read-only decorativos
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
    # ⬇️ Campos calculados / “bonitos”
    estado_nombre = serializers.SerializerMethodField(read_only=True)
    plato_nombre = serializers.SerializerMethodField(read_only=True)

    # Si querés enviar/recibir detalles anidados:
    # detalles = DetalleRecetaSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Recetas
        fields = [
            "id_receta",
            "id_plato",
            "rec_desc",
            "id_estado_receta",
            # "detalles,  # ← descomentá si usás nested create/update
            "estado_nombre",
            "plato_nombre",
        ]

    def get_estado_nombre(self, obj):
        # tolerante si aún no tenés FK o viene en null
        try:
            # si el modelo ya tiene FK: id_estado_receta -> EstadoReceta(estrec_nombre)
            return getattr(obj.id_estado_receta, "estrec_nombre", None)
        except Exception:
            return None

    def get_plato_nombre(self, obj):
        try:
            # según tu modelo de Platos: plt_nombre
            return getattr(obj.id_plato, "plt_nombre", None)
        except Exception:
            return None

    # Si usás nested detalles, dejá estos create/update; si no, borralos
    # def create(self, validated_data):
    #     detalles = validated_data.pop("detalles", [])
    #     receta = Recetas.objects.create(**validated_data)
    #     bulk = []
    #     for d in detalles:
    #         bulk.append(DetalleRecetas(
    #             id_receta=receta,
    #             id_insumo=Insumos.objects.get(pk=d["id_insumo"]),
    #             detr_cant_unid=d["detr_cant_unid"],
    #         ))
    #     if bulk:
    #         DetalleRecetas.objects.bulk_create(bulk)
    #     return receta

    # def update(self, instance, validated_data):
    #     detalles = validated_data.pop("detalles", None)
    #     for attr, val in validated_data.items():
    #         setattr(instance, attr, val)
    #     instance.save()
    #     if detalles is not None:
    #         DetalleRecetas.objects.filter(id_receta=instance).delete()
    #         bulk = []
    #         for d in detalles:
    #             bulk.append(DetalleRecetas(
    #                 id_receta=instance,
    #                 id_insumo=Insumos.objects.get(pk=d["id_insumo"]),
    #                 detr_cant_unid=d["detr_cant_unid"],
    #             ))
    #         if bulk:
    #             DetalleRecetas.objects.bulk_create(bulk)
    #     return instance
class CategoriaPlatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaPlatos
        fields = "__all__"

class EstadoRecetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoReceta
        fields = ["id_estado_receta", "estrec_nombre"]

# --- Detalle de Pedido con datos “bonitos” de plato ---
class DetallePedidoSerializer(serializers.ModelSerializer):
    # Podés dejar el nombre del plato como solo lectura. Si no lo querés, eliminá las 2 líneas de abajo
    plato_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DetallePedidos
        fields = [
            'id_detalle_pedido',   # o 'id' si tu PK del detalle es 'id'
            'id_pedido',
            'id_plato',
            'plato_nombre',        # <-- eliminá esta línea si NO querés mostrar el nombre
            'detped_cantidad',
        ]

    def get_plato_nombre(self, obj):
        """
        Deja esto si querés mostrar el nombre del plato en el JSON.
        Ajustá 'plt_nombre' si en tu modelo se llama distinto.
        """
        try:
            plato = getattr(obj, 'id_plato', None) or getattr(obj, 'plato', None)
            if plato:
                return getattr(plato, 'plt_nombre', None) or getattr(plato, 'nombre', None)
        except Exception:
            pass
        return None


# --- Pedido con labels, fechas y total calculado ---
class PedidoSerializer(serializers.ModelSerializer):
    # detalles (solo lectura) desde la relación reversa detallepedidos_set
    detalles = DetallePedidoSerializer(source="detallepedidos_set", many=True, read_only=True)

    # campos “bonitos”
    mesa_numero = serializers.SerializerMethodField(read_only=True)
    empleado_nombre = serializers.SerializerMethodField(read_only=True)
    cliente_nombre = serializers.SerializerMethodField(read_only=True)
    estado_nombre = serializers.SerializerMethodField(read_only=True)
    tipo_nombre = serializers.SerializerMethodField(read_only=True)
    total = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Pedidos
        fields = [
            # DB
            "id_pedido",
            "id_mesa",
            "id_empleado",
            "id_cliente",
            "id_estado_pedido",
            "id_tipo_pedido",
            "ped_fecha_hora_ini",
            "ped_fecha_hora_fin",
            "ped_descripcion",
            # decorativos / calculados
            "mesa_numero",
            "empleado_nombre",
            "cliente_nombre",
            "estado_nombre",
            "tipo_nombre",
            "total",
            # nested
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
        # suma: cantidad * precio del plato
        try:
            total = 0.0
            for d in obj.detallepedidos_set.select_related("id_plato").all():
                precio = float(d.id_plato.plt_precio)
                qty = int(d.detped_cantidad)
                total += precio * qty
            return total
        except Exception:
            return None

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

# --- Estados de Compra (catálogo para selects) ---
class EstadoCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoCompra
        fields = ["id_estado_compra", "estcom_nombre"]


# --- Detalle de Compra ---
# --- Detalle de Compra ---
# --- Detalle de Compra ---
class DetalleCompraSerializer(serializers.ModelSerializer):
    # Mostrar subtotal como cálculo (read-only). La BD también lo calcula, pero el ORM no lo inserta.
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
            "detcom_subtotal",   # ← ahora es method field
            "insumo_nombre",
        ]

    def get_detcom_subtotal(self, obj):
        try:
          # cálculo seguro en Python (coincide con la columna GENERATED)
          return (obj.detcom_cantidad or 0) * (obj.detcom_precio_uni or 0)
        except Exception:
          return None

    def get_insumo_nombre(self, obj):
        try:
            return obj.id_insumo.ins_nombre
        except Exception:
            return None




# --- Compra (con campos bonitos y detalles en solo-lectura) ---
class CompraSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.SerializerMethodField(read_only=True)
    estado_nombre   = serializers.SerializerMethodField(read_only=True)
    proveedor_nombre = serializers.SerializerMethodField(read_only=True)

    detalles = DetalleCompraSerializer(source="detallecompra_set", many=True, read_only=True)

    class Meta:
        model = Compras
        fields = [
            "id_compra",
            "id_empleado",
            "id_estado_compra",
            "id_proveedor",          # ⬅️ NUEVO (escritura/lectura)
            "com_fecha_hora",
            "com_monto",
            "com_descripcion",
            # bonitos
            "empleado_nombre",
            "estado_nombre",
            "proveedor_nombre",      # ⬅️ NUEVO (lectura)
            # nested read-only
            "detalles",
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

class ProveedorInsumoSerializer(serializers.ModelSerializer):
    # Para escritura: FKs como PK
    id_proveedor = serializers.PrimaryKeyRelatedField(queryset=Proveedores.objects.all())
    id_insumo    = serializers.PrimaryKeyRelatedField(queryset=Insumos.objects.all())

    # precio_unitario: 3 decimales para matchear el modelo (DECIMAL(12,3))
    precio_unitario = serializers.DecimalField(
        max_digits=12,
        decimal_places=3,
        required=False,   # obligatorio solo en create (lo validamos abajo)
        allow_null=True
    )

    # Lecturas “bonitas”
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
            # solo lectura
            "proveedor_nombre",
            "insumo_nombre",
            "insumo_unidad",
        ]

    # ------- GETTERS DE SOLO LECTURA -------
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

    # ------- VALIDACIONES -------
    def validate_precio_unitario(self, v):
        if v is not None and v < 0:
            raise serializers.ValidationError("El precio unitario no puede ser negativo.")
        return v

    def validate(self, attrs):
        """
        - Evita duplicados por unique_together (id_proveedor, id_insumo).
        - En creación (self.instance is None), exige precio_unitario.
        - En actualización, permite omitir precio_unitario.
        """
        prov = attrs.get("id_proveedor", getattr(getattr(self, "instance", None), "id_proveedor", None))
        ins  = attrs.get("id_insumo",    getattr(getattr(self, "instance", None), "id_insumo", None))

        # Duplicados (soporta create y update)
        if prov and ins:
            qs = ProveedoresXInsumos.objects.filter(id_proveedor=prov, id_insumo=ins)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Ese insumo ya está vinculado a este proveedor.")

        # Requerir precio en CREATE
        if self.instance is None:
            # En create el valor puede venir en attrs; si no está, es error
            if attrs.get("precio_unitario", None) is None:
                raise serializers.ValidationError({"precio_unitario": "El precio es obligatorio al vincular."})

        return attrs