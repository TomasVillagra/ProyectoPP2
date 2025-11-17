# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
import math
class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.IntegerField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.IntegerField()
    is_active = models.IntegerField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class CargoEmpleados(models.Model):
    id_cargo_emp = models.AutoField(primary_key=True)
    carg_nombre = models.CharField(unique=True, max_length=80)

    class Meta:
        managed = False
        db_table = 'cargo_empleados'


class CategoriaPlatos(models.Model):
    id_categoria_plato = models.AutoField(primary_key=True)
    catplt_nombre = models.CharField(unique=True, max_length=80)

    class Meta:
        managed = False
        db_table = 'categoria_platos'


class CategoriaProveedores(models.Model):
    id_categoria_prov = models.AutoField(primary_key=True)
    catprov_nombre = models.CharField(unique=True, max_length=80)

    class Meta:
        managed = False
        db_table = 'categoria_proveedores'


class Clientes(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    cli_nombre = models.CharField(max_length=120)
    cli_tel = models.CharField(max_length=30, blank=True, null=True)
    cli_correo = models.CharField(max_length=120, blank=True, null=True)
    cli_dni = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'clientes'

class EstadoMesas(models.Model):
    id_estado_mesa = models.AutoField(primary_key=True)
    estms_nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        managed = False
        db_table = 'estado_mesas'

    def __str__(self):
        return self.estms_nombre

# ── Mesas (quitar ms_disponible y agregar FK) ─────────────
class Mesas(models.Model):
    id_mesa = models.AutoField(primary_key=True)
    ms_numero = models.PositiveIntegerField(unique=True)
    id_estado_mesa = models.ForeignKey(
        EstadoMesas, models.DO_NOTHING,
        db_column='id_estado_mesa',
        blank=True, null=True
        
    )

    class Meta:
        managed = False
        db_table = 'mesas'



class Compras(models.Model):
    id_compra = models.AutoField(primary_key=True)
    id_empleado = models.ForeignKey('Empleados', models.DO_NOTHING, db_column='id_empleado')
    id_estado_compra = models.ForeignKey('EstadoCompra', models.DO_NOTHING, db_column='id_estado_compra')
    com_fecha_hora = models.DateTimeField()
    com_monto = models.DecimalField(max_digits=12, decimal_places=2)
    com_descripcion = models.CharField(max_length=200, blank=True, null=True)
    com_pagado = models.PositiveSmallIntegerField(db_column='com_pagado', default=2)

    id_proveedor = models.ForeignKey(
        'Proveedores',
        models.PROTECT,
        db_column='id_proveedor',
        blank=True, null=True,
        related_name='compras'
    )
    id_metodo_pago = models.ForeignKey(
    'MetodoDePago',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='%(class)s_metodo_pago',
    db_column='id_metodo_pago'
)
    class Meta:
        managed = False
        db_table = 'compras'


class DetalleCompra(models.Model):
    id_detalle_compra = models.AutoField(primary_key=True)
    id_compra = models.ForeignKey(Compras, models.DO_NOTHING, db_column='id_compra')
    id_insumo = models.ForeignKey('Insumos', models.DO_NOTHING, db_column='id_insumo')
    detcom_cantidad = models.DecimalField(max_digits=12, decimal_places=3)
    detcom_precio_uni = models.DecimalField(max_digits=12, decimal_places=3)
    #detcom_subtotal = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'detalle_compra'
        unique_together = (('id_compra', 'id_insumo'),)


class DetallePedidos(models.Model):
    id_detalle_pedido = models.AutoField(primary_key=True)
    id_pedido = models.ForeignKey('Pedidos', models.DO_NOTHING, db_column='id_pedido')
    id_plato = models.ForeignKey('Platos', models.DO_NOTHING, db_column='id_plato')
    detped_cantidad = models.PositiveIntegerField()

    class Meta:
        managed = False
        db_table = 'detalle_pedidos'
        unique_together = (('id_pedido', 'id_plato'),)


class DetalleRecetas(models.Model):
    id_detalle_receta = models.AutoField(primary_key=True)
    id_receta = models.ForeignKey('Recetas', models.DO_NOTHING, db_column='id_receta')
    id_insumo = models.ForeignKey('Insumos', models.DO_NOTHING, db_column='id_insumo')
    detr_cant_unid = models.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        managed = False
        db_table = 'detalle_recetas'
        unique_together = (('id_receta', 'id_insumo'),)


class DetalleVentas(models.Model):
    id_detalle_venta = models.AutoField(primary_key=True)
    id_venta = models.ForeignKey('Ventas', models.DO_NOTHING, db_column='id_venta')
    id_plato = models.ForeignKey('Platos', models.DO_NOTHING, db_column='id_plato')
    detven_precio_uni = models.DecimalField(max_digits=12, decimal_places=2)
    detven_cantidad = models.PositiveIntegerField()
    detven_subtotal = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'detalle_ventas'
        unique_together = (('id_venta', 'id_plato'),)


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class EstadoEmpleados(models.Model):
    id_estado_empleado = models.AutoField(primary_key=True)
    estemp_nombre = models.CharField(unique=True, max_length=50)
    class Meta:
        managed = False
        db_table = 'estado_empleados'

class Empleados(models.Model):
    id_empleado = models.AutoField(primary_key=True)
    id_cargo_emp = models.ForeignKey(CargoEmpleados, models.DO_NOTHING, db_column='id_cargo_emp')
    id_estado_empleado = models.ForeignKey('EstadoEmpleados', models.DO_NOTHING, db_column='id_estado_empleado')
    emp_nombre = models.CharField(max_length=80)
    emp_apellido = models.CharField(max_length=80)
    emp_tel = models.CharField(max_length=30, blank=True, null=True)
    emp_correo = models.CharField(max_length=120, blank=True, null=True)
    emp_dni = models.CharField(max_length=20, blank=True, null=True)

    # OneToOne con auth_user a través de la columna existente id_usuario
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        db_column='id_usuario',
        related_name='empleado'
    )
    class Meta:
        managed = False
        db_table = 'empleados'


class EstadoCompra(models.Model):
    id_estado_compra = models.AutoField(primary_key=True)
    estcom_nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'estado_compra'





class EstadoInsumos(models.Model):
    id_estado_insumo = models.AutoField(primary_key=True)
    estins_nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'estado_insumos'


class EstadoPedidos(models.Model):
    id_estado_pedido = models.AutoField(primary_key=True)
    estped_nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'estado_pedidos'


class EstadoPlatos(models.Model):
    id_estado_plato = models.AutoField(primary_key=True)
    estplt_nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'estado_platos'


class EstadoProveedores(models.Model):
    id_estado_prov = models.AutoField(primary_key=True)
    estprov_nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'estado_proveedores'


class EstadoVentas(models.Model):
    id_estado_venta = models.AutoField(primary_key=True)
    estven_nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'estado_ventas'


class Insumos(models.Model):
    id_insumo = models.AutoField(primary_key=True)
    id_estado_insumo = models.ForeignKey(EstadoInsumos, models.DO_NOTHING, db_column='id_estado_insumo')
    ins_nombre = models.CharField(unique=True, max_length=120)
    ins_unidad = models.CharField(max_length=20)
    ins_cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        help_text="Cantidad de unidades compradas (fardos, bolsas, cajas...).",
    )
    ins_capacidad = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        help_text="Capacidad de cada unidad (ej. 6 botellas por fardo, 2 kg por bolsa...).",
    )
    ins_stock_actual = models.DecimalField(max_digits=12, decimal_places=3)
    ins_punto_reposicion = models.DecimalField(max_digits=12, decimal_places=3)
    ins_stock_min = models.DecimalField(max_digits=12, decimal_places=3)
    ins_stock_max = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'insumos'


    @property
    def insumos_completos(self):
        """
        Fardos ENTEROS que podés armar con el stock actual.
        Ej.: capacidad 6, stock 13 → 2 fardos completos (12) y 1 suelto.
        """
        if not self.ins_capacidad or self.ins_capacidad == 0 or self.ins_stock_actual is None:
            return None
        return int(self.ins_stock_actual // self.ins_capacidad)

    @property
    def unidades_sueltas(self):
        """
        Unidades que sobran luego de armar todos los fardos completos.
        Ej.: capacidad 6, stock 13 → 1 unidad suelta.
        """
        if not self.ins_capacidad or self.ins_capacidad == 0 or self.ins_stock_actual is None:
            return None
        return self.ins_stock_actual - (self.insumos_completos * self.ins_capacidad)

    @property
    def insumos_equivalentes(self):
        """
        Fardos 'equivalentes' REDONDEANDO PARA ARRIBA.
        Ejemplo que vos diste:
          cantidad = 2, capacidad = 6 → stock total = 12
          si el stock actual llega a 5 → math.ceil(5/6) = 1 fardo equivalente.
        """
        if not self.ins_capacidad or self.ins_capacidad == 0 or self.ins_stock_actual is None:
            return None
        return math.ceil(float(self.ins_stock_actual) / float(self.ins_capacidad))



class MetodoDePago(models.Model):
    id_metodo_pago = models.AutoField(primary_key=True)
    metpag_nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'metodo_de_pago'


class MovimientosCaja(models.Model):
    id_movimiento_caja = models.AutoField(primary_key=True)
    id_empleado = models.ForeignKey(Empleados, models.DO_NOTHING, db_column='id_empleado')
    id_metodo_pago = models.ForeignKey(MetodoDePago, models.DO_NOTHING, db_column='id_metodo_pago', blank=True, null=True)
    id_tipo_movimiento_caja = models.ForeignKey('TipoMovimientoCaja', models.DO_NOTHING, db_column='id_tipo_movimiento_caja')
    id_venta = models.ForeignKey('Ventas', models.DO_NOTHING, db_column='id_venta', blank=True, null=True)
    id_compra = models.ForeignKey(Compras, models.DO_NOTHING, db_column='id_compra', blank=True, null=True)
    mv_fecha_hora = models.DateTimeField()
    mv_monto = models.DecimalField(max_digits=12, decimal_places=2)
    mv_descripcion = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'movimientos_caja'


class Pedidos(models.Model):
    id_pedido = models.AutoField(primary_key=True)
    id_mesa = models.ForeignKey(Mesas, models.DO_NOTHING, db_column='id_mesa', blank=True, null=True)
    id_empleado = models.ForeignKey(Empleados, models.DO_NOTHING, db_column='id_empleado')
    id_cliente = models.ForeignKey(Clientes, models.DO_NOTHING, db_column='id_cliente', blank=True, null=True)
    id_estado_pedido = models.ForeignKey(EstadoPedidos, models.DO_NOTHING, db_column='id_estado_pedido')
    id_tipo_pedido = models.ForeignKey('TipoPedidos', models.DO_NOTHING, db_column='id_tipo_pedido')
    ped_fecha_hora_ini = models.DateTimeField()
    ped_fecha_hora_fin = models.DateTimeField(blank=True, null=True)
    ped_descripcion = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'pedidos'


class Platos(models.Model):
    id_plato = models.AutoField(primary_key=True)
    id_estado_plato = models.ForeignKey(EstadoPlatos, models.DO_NOTHING, db_column='id_estado_plato')
    id_categoria_plato = models.ForeignKey(CategoriaPlatos, models.DO_NOTHING, db_column='id_categoria_plato')
    plt_nombre = models.CharField(unique=True, max_length=120)
    plt_precio = models.DecimalField(max_digits=12, decimal_places=2)
    plt_stock = models.PositiveIntegerField()

    class Meta:
        managed = False
        db_table = 'platos'


class Proveedores(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    id_estado_prov = models.ForeignKey(EstadoProveedores, models.DO_NOTHING, db_column='id_estado_prov')
    id_categoria_prov = models.ForeignKey(CategoriaProveedores, models.DO_NOTHING, db_column='id_categoria_prov')
    prov_nombre = models.CharField(unique=True, max_length=120)
    prov_tel = models.CharField(max_length=30, blank=True, null=True)
    prov_correo = models.CharField(max_length=120, blank=True, null=True)
    prov_direccion = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'proveedores'


class ProveedoresXInsumos(models.Model):
    id_prov_x_ins = models.AutoField(primary_key=True)
    id_proveedor = models.ForeignKey(Proveedores, models.DO_NOTHING, db_column='id_proveedor')
    id_insumo = models.ForeignKey(Insumos, models.DO_NOTHING, db_column='id_insumo')
    precio_unitario = models.DecimalField(
        max_digits=12, 
        decimal_places=3,
        null=True, blank=True,
        validators=[MinValueValidator(0)],
        help_text="Precio unitario acordado para este insumo con el proveedor.",
    )

    class Meta:
        managed = False
        db_table = 'proveedores_x_insumos'
        unique_together = (('id_proveedor', 'id_insumo'),)


class Recetas(models.Model):
    id_receta = models.AutoField(primary_key=True)
    id_plato = models.OneToOneField(Platos, models.DO_NOTHING, db_column='id_plato')
    rec_desc = models.CharField(max_length=200, blank=True, null=True)
    id_estado_receta = models.ForeignKey(
        "EstadoReceta",
        on_delete=models.PROTECT,
        db_column="id_estado_receta",
        default=1,   # por defecto “Activo”
    )

    class Meta:
        managed = False
        db_table = 'recetas'


class TipoMovimientoCaja(models.Model):
    id_tipo_movimiento_caja = models.AutoField(primary_key=True)
    tmovc_nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'tipo_movimiento_caja'


class TipoPedidos(models.Model):
    id_tipo_pedido = models.AutoField(primary_key=True)
    tipped_nombre = models.CharField(unique=True, max_length=50)

    class Meta:
        managed = False
        db_table = 'tipo_pedidos'


class Ventas(models.Model):
    id_venta = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Clientes, models.DO_NOTHING, db_column='id_cliente')
    id_empleado = models.ForeignKey(Empleados, models.DO_NOTHING, db_column='id_empleado')
    id_estado_venta = models.ForeignKey(EstadoVentas, models.DO_NOTHING, db_column='id_estado_venta')
    ven_fecha_hora = models.DateTimeField()
    ven_monto = models.DecimalField(max_digits=12, decimal_places=2)
    ven_descripcion = models.CharField(max_length=200, blank=True, null=True)
    id_metodo_pago = models.ForeignKey(
    'MetodoDePago',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='%(class)s_metodo_pago',
    db_column='id_metodo_pago'
)

    class Meta:
        managed = False
        db_table = 'ventas'

# --- ESTADO RECETA ---
class EstadoReceta(models.Model):
    id_estado_receta = models.AutoField(primary_key=True)
    estrec_nombre = models.CharField(max_length=30, unique=True)

    class Meta:
        db_table = "estado_receta"
        verbose_name = "Estado de Receta"
        verbose_name_plural = "Estados de Receta"

    def __str__(self):
        return self.estrec_nombre

# --- NUEVO: tabla de estados de mesa ---
# ── NUEVO catálogo ─────────────────────────────────────────


