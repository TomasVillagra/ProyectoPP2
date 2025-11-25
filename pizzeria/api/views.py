# api/views.py
from rest_framework.permissions import IsAuthenticated

from rest_framework import viewsets, status
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from decimal import Decimal
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import F
from django.db import connection
from django.db.models import Sum
from datetime import datetime
from datetime import timedelta
from django.utils.timezone import make_aware
from django.utils.timezone import localdate
from django.db.models.functions import TruncDate, TruncMonth, ExtractWeek, ExtractYear
from rest_framework.views import APIView
from django.db.models import Max, Sum, Case, When, Value, DecimalField
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError
from .permissions import RolePermission



from pizzeria.models import (
    Empleados, Clientes, Insumos, Platos, Pedidos,
    Ventas, MovimientosCaja,TipoMovimientoCaja, TipoPedidos, EstadoPedidos, MetodoDePago,
    CargoEmpleados, EstadoEmpleados,
    Proveedores, EstadoProveedores, CategoriaProveedores,
    Recetas, DetalleRecetas, CategoriaPlatos, EstadoReceta,
    DetallePedidos, Mesas, EstadoCompra, DetalleCompra, Compras,ProveedoresXInsumos,EstadoMesas,
    EstadoVentas,DetalleVentas,CategoriaProveedores
)

from .serializers import (
    EmpleadosSerializer, ClienteSerializer, InsumoSerializer, PlatoSerializer,
    PedidoSerializer, VentaSerializer, MovimientoCajaSerializer,MovimientosCajaCreateSerializer, TipoPedidoSerializer,
    EstadoPedidoSerializer, MetodoPagoSerializer,
    CargoSerializer, EstadoEmpleadoSerializer,
    ProveedorSerializer, EstadoProveedorSerializer, CategoriaProveedorSerializer,
    RecetaSerializer, DetalleRecetaSerializer, CategoriaPlatoSerializer,
    EstadoRecetaSerializer, DetallePedidoSerializer,EstadoCompraSerializer,
    CompraSerializer,DetalleCompraSerializer,ProveedorInsumoSerializer,MesasSerializer,
    EstadoMesasSerializer,EstadoVentaSerializer,DetalleVentaSerializer,

)
# ── Constantes de estados y helpers de caja/fechas
# ── IDs FIJOS cargados en tu BD ───────────────────────────────────────────────
ESTADO_PEDIDO = {
    "EN_PROCESO": 1,
    "ENTREGADO":  2,
    "CANCELADO":  3,
    "FINALIZADO": 4,
}

TIPO_MOV_CAJA = {
    "APERTURA": 1,
    "INGRESO":  2,
    "EGRESO":   3,
    "CIERRE":   4,
}

METODO_PAGO = {
    "EFECTIVO":      1,
    "TARJETA":       2,
    "TRANSFERENCIA": 3,
}
def _parse_fecha(s: str):
    # acepta "YYYY-MM-DD" o "YYYY-MM-DD HH:MM"
    if not s:
        return None
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return make_aware(datetime.strptime(s, fmt))
        except Exception:
            pass
    return None

def _rango_desde_hasta(request):
    desde = _parse_fecha(request.query_params.get("desde")) or _parse_fecha(request.data.get("desde"))
    hasta = _parse_fecha(request.query_params.get("hasta")) or _parse_fecha(request.data.get("hasta"))
    return desde, hasta

def _tipo_movimiento(nombre:str):
    # Crea si no existe (Ingreso / Egreso / Apertura / Cierre)
    from pizzeria.models import TipoMovimientoCaja
    obj, _ = TipoMovimientoCaja.objects.get_or_create(tmovc_nombre__iexact=nombre, defaults={"tmovc_nombre": nombre})
    # Si usamos get_or_create con __iexact, arriba no crea. Forzamos:
    if isinstance(obj, tuple):
        obj = TipoMovimientoCaja.objects.filter(tmovc_nombre__iexact=nombre).first()
        if not obj:
            obj = TipoMovimientoCaja.objects.create(tmovc_nombre=nombre)
    return obj

def caja_esta_abierta_hoy():
    """
    Devuelve True si el ÚLTIMO movimiento de caja de HOY
    NO es un cierre. Si no hay movimientos hoy, se considera cerrada.
    """
    hoy = timezone.localdate()
    inicio = timezone.make_aware(
        timezone.datetime.combine(hoy, timezone.datetime.min.time())
    )
    fin = timezone.make_aware(
        timezone.datetime.combine(hoy, timezone.datetime.max.time())
    )

    movimientos_hoy = (
        MovimientosCaja.objects
        .filter(mv_fecha_hora__range=(inicio, fin))
        .order_by("mv_fecha_hora")
    )

    ultimo = movimientos_hoy.last()
    if not ultimo:
        # Nunca se abrió caja hoy
        return False

    # Si el último movimiento del día es CIERRE → caja cerrada
    return ultimo.id_tipo_movimiento_caja_id != TIPO_MOV_CAJA["CIERRE"]


def asegurar_caja_abierta():
    """
    Lanza un 403 si la caja está cerrada.
    Usar al inicio de cualquier acción que MODIFIQUE pedidos/ventas.
    """
    if not caja_esta_abierta_hoy():
        raise PermissionDenied(
            "La caja está CERRADA. Solo se permite consultar pedidos y ventas."
        )
    
# ──────────────────────────────────────────────────────────────────────────────
# Base para ViewSets con control de roles
# ──────────────────────────────────────────────────────────────────────────────
class RoleProtectedViewSet(ModelViewSet):
    """
    ViewSet base que aplica:
      - IsAuthenticated
      - RolePermission (Mozo solo Pedidos, etc.)
    """
    permission_classes = [IsAuthenticated, RolePermission]

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
class EmpleadosViewSet(RoleProtectedViewSet):
    queryset = Empleados.objects.all().order_by("-id_empleado")
    serializer_class = EmpleadosSerializer
    

    # GET /api/empleados/me/
    @action(detail=False, methods=["get"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            emp = Empleados.objects.get(usuario=request.user)
        except Empleados.DoesNotExist:
            return Response({"detail": "No hay un empleado vinculado a este usuario."}, status=status.HTTP_404_NOT_FOUND)
        return Response(EmpleadosSerializer(emp).data)

    # POST /api/empleados/vincular/  { "id_empleado": 123 }
    @action(detail=False, methods=["post"], url_path="vincular", permission_classes=[IsAuthenticated])
    def vincular(self, request):
        emp_id = request.data.get("id_empleado")
        if not emp_id:
            return Response({"detail": "id_empleado es requerido."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            emp = Empleados.objects.get(pk=emp_id)
        except Empleados.DoesNotExist:
            return Response({"detail": "Empleado no existe."}, status=status.HTTP_404_NOT_FOUND)

        Empleados.objects.filter(usuario=request.user).exclude(pk=emp.pk).update(usuario=None)
        emp.usuario = request.user
        emp.save(update_fields=["usuario"])
        return Response({"detail": "Vinculado correctamente."}, status=status.HTTP_200_OK)

# ──────────────────────────────────────────────────────────────────────────────
# Proveedores
# ──────────────────────────────────────────────────────────────────────────────
class ProveedorViewSet(RoleProtectedViewSet):
    queryset = (
        Proveedores.objects
        .select_related("id_estado_prov", "id_categoria_prov")
        .all()
        .order_by("-id_proveedor")
    )
    serializer_class = ProveedorSerializer



# ──────────────────────────────────────────────────────────────────────────────
# Clientes, Insumos, Platos, Pedidos, etc.
# ──────────────────────────────────────────────────────────────────────────────
class ClienteViewSet(RoleProtectedViewSet):
    queryset = Clientes.objects.all().order_by("-id_cliente")
    serializer_class = ClienteSerializer
    

class InsumoViewSet(RoleProtectedViewSet):
    queryset = Insumos.objects.all().order_by("-id_insumo")
    serializer_class = InsumoSerializer
    

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_estado = int(request.data.get("id_estado_insumo", instance.id_estado_insumo_id))

        # si se intenta pasar a estado INACTIVO (2)
        if new_estado == 2:
            existe = DetalleRecetas.objects.filter(id_insumo=instance.id_insumo).exists()
            if existe:
                raise ValidationError({
                    "detail": f"No se puede desactivar el insumo '{instance.ins_nombre}' porque está asociado a una o más recetas."
                })

        return super().update(request, *args, **kwargs)


class PlatoViewSet(RoleProtectedViewSet):
    queryset = Platos.objects.all().order_by("-id_plato")
    serializer_class = PlatoSerializer
    

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Cuando se crea un plato, se crea automáticamente una receta vacía
        vinculada a ese plato. El nombre de la receta queda igual al nombre del plato.
        """
        # Primero creamos el plato normalmente
        response = super().create(request, *args, **kwargs)

        # Intentar obtener el id del plato recién creado
        plato_id = response.data.get("id_plato") or response.data.get("id")
        if not plato_id:
            return response

        plato = Platos.objects.filter(pk=plato_id).first()
        if not plato:
            return response

        # Si ya tiene receta, no duplicamos
        if Recetas.objects.filter(id_plato=plato).exists():
            return response

        # Nombre del plato (tolerando distintos nombres de campo)
        nombre_plato = (
            getattr(plato, "pla_nombre", None)
            or getattr(plato, "plt_nombre", None)
            or getattr(plato, "nombre", None)
            or f"Receta del plato {plato_id}"
        )

        # Estado por defecto: Activo (id_estado_receta = 1) o el primero que exista
        estado = (
            EstadoReceta.objects.filter(id_estado_receta=1).first()
            or EstadoReceta.objects.first()
        )

        # Armamos el cuerpo tal como lo espera el serializer de recetas
        receta_data = {
            "rec_nombre": nombre_plato,
            "rec_desc": "",
            "id_plato": plato.id_plato,  # ID numérico
        }
        if estado:
            receta_data["id_estado_receta"] = estado.id_estado_receta

        try:
            ser = RecetaSerializer(data=receta_data)
            ser.is_valid(raise_exception=True)
            ser.save()
        except Exception as e:
            # Si falla la creación de receta NO rompemos la creación del plato
            print("Error creando receta automática para el plato:", e)

        return response

    # …desde acá para abajo dejá TODO igual como lo tenías…
    @action(detail=True, methods=["post"])
    def producir(self, request, pk=None):
        try:
            cantidad = Decimal(str(request.data.get("cantidad", "0")))
        except Exception:
            return Response({"detail": "Cantidad inválida."}, status=400)
        if cantidad <= 0:
            return Response({"detail": "Cantidad debe ser > 0."}, status=400)

        plato = self.get_object()

        receta = Recetas.objects.filter(id_plato=plato).first()
        if not receta:
            return Response({"detail": "El plato no tiene receta definida."}, status=400)

        dets = DetalleRecetas.objects.filter(id_receta=receta)

        requeridos = []
        for det in dets:
            por_plato = getattr(det, "detr_cant_unid", 0) or Decimal("0")
            req = por_plato * cantidad
            if req <= 0:
                continue

            ins = det.id_insumo
            disp = Decimal(getattr(ins, "ins_stock_actual", 0) or 0)

            if disp - req < 0:
                return Response(
                    {
                        "detail": f"Insumo insuficiente: {ins.ins_nombre}. "
                                  f"Requiere {req}, disponible {disp}."
                    },
                    status=400,
                )
            requeridos.append((ins, req, disp))

        with transaction.atomic():
            # Descontar insumos
            for ins, req, disp in requeridos:
                nuevo = disp - req
                ins.ins_stock_actual = nuevo
                ins.save(update_fields=["ins_stock_actual"])

            # Sumar stock del plato
            stock_actual = Decimal(getattr(plato, "plt_stock", 0) or 0)
            setattr(plato, "plt_stock", stock_actual + cantidad)
            plato.save(update_fields=["plt_stock"])

        return Response(
            {"detail": "Producción realizada.", "cantidad": f"{cantidad}"},
            status=201,
        )
    

class PedidoViewSet(RoleProtectedViewSet):
    queryset = (
        Pedidos.objects
        .select_related(
            "id_mesa",
            "id_empleado",
            "id_cliente",
            "id_estado_pedido",
            "id_tipo_pedido",
        )
        .prefetch_related("detallepedidos_set__id_plato")
        .all()
        .order_by("-id_pedido")
    )
    serializer_class = PedidoSerializer
    
    
    @action(detail=True, methods=["post"], url_path="validar_stock_editar")
    def validar_stock_editar(self, request, pk=None):
        """
        Valida stock para la EDICIÓN de un pedido.

        - Recibe los 'detalles' que querés guardar.
        - Usa detped_cantidad (cantidad nueva) y _min_cant (cantidad original)
          para calcular SOLO el incremento (cantidad nueva - original).
        - Suma reservas de TODOS los pedidos EN PROCESO, EXCEPTO este mismo.
        - Suma insumos necesarios SOLO por el incremento.
        - Si no alcanza stock de algún insumo -> 400 con mensaje corto.
        - Si el pedido YA está ENTREGADO, además DESCUENTA del stock
          solo el incremento (platos + insumos).
        """
        asegurar_caja_abierta()
        from decimal import Decimal
        from django.db import transaction

        data = request.data
        detalles = data.get("detalles", [])

        if not detalles:
            return Response({"detail": "El pedido no contiene ítems."}, status=400)

        # { id_insumo: {"nombre":..., "unidad":..., "total": Decimal} }
        requeridos = {}

        # 0) Reservas por pedidos EN PROCESO, EXCLUYENDO este pedido
        pedidos_abiertos = Pedidos.objects.filter(
            id_estado_pedido_id=ESTADO_PEDIDO["EN_PROCESO"]
        ).exclude(pk=pk)

        if pedidos_abiertos.exists():
            dets_abiertos = (
                DetallePedidos.objects
                .select_related("id_plato")
                .filter(id_pedido__in=pedidos_abiertos)
            )

            for det_ab in dets_abiertos:
                plato = det_ab.id_plato
                if not plato:
                    continue

                cant_abierta = Decimal(str(det_ab.detped_cantidad or 0))
                if cant_abierta <= 0:
                    continue

                receta = Recetas.objects.filter(id_plato=plato).first()
                # Igual que en create: si el plato no usa receta, no reservamos insumos aquí
                if not receta:
                    continue

                detalles_receta = (
                    DetalleRecetas.objects
                    .select_related("id_insumo")
                    .filter(id_receta=receta)
                )

                for dr in detalles_receta:
                    insumo = dr.id_insumo
                    if not insumo:
                        continue

                    por_plato = Decimal(str(dr.detr_cant_unid))
                    if por_plato <= 0:
                        continue

                    total_necesario = por_plato * cant_abierta

                    entry = requeridos.setdefault(insumo.id_insumo, {
                        "nombre": insumo.ins_nombre,
                        "unidad": insumo.ins_unidad,
                        "total": Decimal("0"),
                    })
                    entry["total"] += total_necesario

        # 1) Insumos necesarios para el pedido EDITADO (solo el INCREMENTO)
        #    y de paso guardamos la info de incrementos para luego descontar
        incrementos = []  # lista de dicts por detalle

        for det in detalles:
            plato_id = det.get("id_plato")

            # Cantidad total que querés dejar en el detalle
            cantidad_total = Decimal(str(det.get("detped_cantidad", 0)))
            # Cantidad original que tenía el detalle (lo que YA estaba)
            cantidad_original = Decimal(str(det.get("_min_cant", 0)))

            if cantidad_total <= 0:
                return Response({"detail": "Cantidad inválida en un ítem."}, status=400)

            if cantidad_original < 0:
                cantidad_original = Decimal("0")

            # Solo nos importa el incremento (lo nuevo que agregás)
            incremento = cantidad_total - cantidad_original

            # Si no estás aumentando (bajás o dejás igual), no consume stock extra
            if incremento <= 0:
                continue

            plato = Platos.objects.filter(pk=plato_id).first()
            if not plato:
                return Response(
                    {"detail": f"El plato con ID {plato_id} no existe."},
                    status=400
                )

            # Stock del plato: primero usamos lo que ya hay preparado
            stock_plato = Decimal(str(plato.plt_stock or 0))
            desde_stock = min(stock_plato, incremento)
            faltante = incremento - desde_stock

            # Guardamos para posible descuento luego
            incrementos.append({
                "plato": plato,
                "incremento": incremento,
                "desde_stock": desde_stock,
                "faltante": faltante,
            })

            # Si NO falta (todo el incremento sale de stock del plato), no se necesitan insumos
            if faltante <= 0:
                continue

            # Si falta → se produciría usando RECETA => consume insumos
            # Si falta → se produciría usando RECETA => consume insumos
            receta = Recetas.objects.filter(id_plato=plato).first()
            if not receta:
                return Response(
                    {
                        "detail": (
                            f"El plato '{plato.plt_nombre}' no tiene receta para "
                            f"producir {faltante} unidad(es) extra."
                        )
                    },
                    status=400
                )

            detalles_receta_qs = (
                DetalleRecetas.objects
                .select_related("id_insumo")
                .filter(id_receta=receta)
            )

            # 🚫 Receta sin insumos asociados
            if not detalles_receta_qs.exists():
                return Response(
                    {
                        "detail": (
                            f"La receta del plato '{plato.plt_nombre}' no tiene insumos "
                            f"asociados. Debe tener al menos un insumo."
                        )
                    },
                    status=400
                )

            for dr in detalles_receta_qs:
                insumo = dr.id_insumo
                if not insumo:
                    continue

                por_plato = Decimal(str(dr.detr_cant_unid))
                if por_plato <= 0:
                    continue

                total_necesario = por_plato * faltante

                entry = requeridos.setdefault(insumo.id_insumo, {
                    "nombre": insumo.ins_nombre,
                    "unidad": insumo.ins_unidad,
                    "total": Decimal("0"),
                })
                entry["total"] += total_necesario


        # 2) VALIDAR STOCK DE INSUMOS (reservas + incremento del pedido)
        if requeridos:
            ids = list(requeridos.keys())
            for ins in Insumos.objects.filter(pk__in=ids):
                necesario = requeridos[ins.id_insumo]["total"]
                disponible = Decimal(str(ins.ins_stock_actual or 0))

                if disponible < necesario:
                    faltante = Decimal(str(necesario)) - Decimal(str(disponible))
                    if faltante < 0:
                        faltante = Decimal("0")

                    faltante_fmt = f"{faltante:.3f}"

                    msg_corto = (
                        f"Stock insuficiente: falta {faltante_fmt} {ins.ins_unidad} "
                        f"de {ins.ins_nombre}."
                    )

                    return Response({"detail": msg_corto}, status=400)

        # 3) Si el pedido está ENTREGADO -> descontar stock por el INCREMENTO
        pedido = self.get_object()
        if pedido.id_estado_pedido_id == ESTADO_PEDIDO["ENTREGADO"] and incrementos:
            with transaction.atomic():
                # 3.1) Descontar primero de stock de plato
                for item in incrementos:
                    plato = item["plato"]
                    desde_stock = item["desde_stock"]
                    faltante = item["faltante"]

                    # Descontar del stock del plato la parte que sale directamente del stock
                    if desde_stock > 0:
                        Platos.objects.filter(pk=plato.pk).update(
                            plt_stock=F("plt_stock") - desde_stock
                        )

                    # 3.2) Si hay faltante → se produce con receta y se descuentan insumos
                    if faltante > 0:
                        receta = Recetas.objects.filter(id_plato=plato).first()
                        if not receta:
                            # En teoría no debería pasar porque ya se validó arriba
                            return Response(
                                {
                                    "detail": (
                                        f"El plato '{plato.plt_nombre}' no tiene receta "
                                        f"para producir el faltante."
                                    )
                                },
                                status=400,
                            )

                        detrec_qs = (
                            DetalleRecetas.objects
                            .select_related("id_insumo")
                            .filter(id_receta=receta)
                        )

                        for dr in detrec_qs:
                            insumo = dr.id_insumo
                            if not insumo:
                                continue

                            por_plato = Decimal(str(dr.detr_cant_unid))
                            if por_plato <= 0:
                                continue

                            total_desc = por_plato * faltante
                            if total_desc <= 0:
                                continue

                            Insumos.objects.filter(pk=insumo.pk).update(
                                ins_stock_actual=F("ins_stock_actual") - total_desc
                            )

        # Si llega acá, el stock alcanza
        return Response({"ok": True}, status=200)


    # (acá siguen tus métodos existentes: descontar_insumos, generar_venta,
    #  cobrar_y_finalizar, create override, update, etc. tal cual los tenías)
    # ────────────────────────────────────────────────
    # Acción personalizada para descontar insumos
    # ────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="descontar_insumos")
    @transaction.atomic
    def descontar_insumos(self, request, pk=None):
        asegurar_caja_abierta()
        """
        Descuenta stock de platos e insumos SIN permitir que quede negativo.

        Lógica:
        1) Para cada detalle del pedido:
           - Se usa primero el stock del PLATO (Platos.plt_stock).
           - Si falta, se 'produce' el faltante usando la RECETA del plato
             (DetalleRecetas.detr_cant_unid) y se consumen INSUMOS.
        2) Antes de descontar, se calcula cuánto insumo total se necesitaría
           y se valida que alcanza el stock de cada insumo.
           Si NO alcanza, se devuelve 400 y NO se descuenta nada.
        """

        pedido = self.get_object()

        # Helpers acoplados a tu modelo real
        def get_cant_det_pedido(det_obj):
            # DetallePedidos.detped_cantidad
            return getattr(det_obj, "detped_cantidad", 0) or 0

        def get_cant_det_receta(dr_obj):
            # DetalleRecetas.detr_cant_unid
            return getattr(dr_obj, "detr_cant_unid", 0) or 0

        # Traemos los detalles del pedido con sus platos
        detalles = (
            DetallePedidos.objects
            .select_related("id_plato")
            .filter(id_pedido=pedido)
        )

        if not detalles.exists():
            return Response({"detail": "El pedido no tiene ítems."}, status=400)

        # ─────────────────────────────────────────────
        # 1) PRIMER PASO: calcular insumos necesarios
        # ─────────────────────────────────────────────
        from decimal import Decimal

        requeridos_por_insumo = {}  # {id_insumo: {"nombre": str, "total": Decimal}}
        for det in detalles:
            plato = getattr(det, "id_plato", None)
            if not plato:
                continue

            cant_pedida = Decimal(str(get_cant_det_pedido(det)))
            if cant_pedida <= 0:
                continue

            # Stock actual del plato
            stock_plato = Decimal(str(getattr(plato, "plt_stock", 0) or 0))
            consume_de_plato = min(stock_plato, cant_pedida)
            faltante = cant_pedida - consume_de_plato  # lo que hay que producir

            if faltante <= 0:
                # Todo sale del stock del plato, no necesito insumos
                continue

            # Necesito receta para producir el faltante
            receta = Recetas.objects.filter(id_plato=plato).first()
            if not receta:
                return Response(
                    {
                        "detail": (
                            f"El plato '{plato.plt_nombre}' no tiene receta "
                            f"definida para producir {faltante} unidad(es)."
                        )
                    },
                    status=400,
                )

            detrec_qs = (
                DetalleRecetas.objects
                .select_related("id_insumo")
                .filter(id_receta=receta)
            )

            for dr in detrec_qs:
                insumo = getattr(dr, "id_insumo", None)
                if not insumo:
                    continue

                qty_por_plato = Decimal(str(get_cant_det_receta(dr)))
                if qty_por_plato <= 0:
                    continue

                total_desc = qty_por_plato * faltante  # Decimal * Decimal
                if total_desc <= 0:
                    continue

                entry = requeridos_por_insumo.setdefault(
                    insumo.id_insumo,
                    {
                        "nombre": insumo.ins_nombre,
                        "total": Decimal("0"),
                    },
                )
                entry["total"] += total_desc

        # ─────────────────────────────────────────────
        # 2) Validar stock de insumos antes de descontar
        # ─────────────────────────────────────────────
        if requeridos_por_insumo:
            # Bloqueamos filas de insumos para evitar condiciones de carrera
            ids = list(requeridos_por_insumo.keys())
            for ins in Insumos.objects.select_for_update().filter(pk__in=ids):
                necesario = requeridos_por_insumo[ins.id_insumo]["total"]
                disponible = Decimal(str(ins.ins_stock_actual or 0))

                if disponible < necesario:
                    return Response(
                        {
                            "detail": (
                                f"Insumo insuficiente: {ins.ins_nombre}. "
                                f"Requiere {necesario} {ins.ins_unidad} "
                                f"y solo hay {disponible}."
                            )
                        },
                        status=400,
                    )

        # ─────────────────────────────────────────────
        # 3) SEGUNDO PASO: ahora sí, descontar de verdad
        # ─────────────────────────────────────────────
        movimientos = {"platos": [], "insumos": []}

        for det in detalles:
            plato = getattr(det, "id_plato", None)
            if not plato:
                continue

            cant_pedida = Decimal(str(get_cant_det_pedido(det)))
            if cant_pedida <= 0:
                continue

            # 3.1) Despachar desde stock del plato
            stock_plato = Decimal(str(getattr(plato, "plt_stock", 0) or 0))
            consume_de_plato = min(stock_plato, cant_pedida)
            faltante = cant_pedida - consume_de_plato

            if consume_de_plato > 0:
                Platos.objects.filter(pk=plato.pk).update(
                    plt_stock=F("plt_stock") - consume_de_plato
                )
                movimientos["platos"].append({
                    "plato_id": plato.pk,
                    "tipo": "despacho",
                    "delta": float(-consume_de_plato),
                    "campo": "plt_stock",
                })

            # 3.2) Si falta, consumir insumos según receta y trazar producción + despacho
            # 3.2) Si falta, consumir insumos según receta y trazar producción + despacho
            if faltante > 0:
                receta = Recetas.objects.filter(id_plato=plato).first()
                if not receta:
                    # Esto en teoría no debería pasar, ya se validó arriba
                    return Response(
                        {
                            "detail": (
                                f"El plato '{plato.plt_nombre}' no tiene receta "
                                f"para producir el faltante."
                            )
                        },
                        status=400,
                    )

                detrec_qs = (
                    DetalleRecetas.objects
                    .select_related("id_insumo")
                    .filter(id_receta=receta)
                )

                # 🚫 Receta sin insumos asociados
                if not detrec_qs.exists():
                    return Response(
                        {
                            "detail": (
                                f"La receta del plato '{plato.plt_nombre}' no tiene insumos "
                                f"asociados. Debe tener al menos un insumo."
                            )
                        },
                        status=400,
                    )

                # 3.2.a) Restar insumos por la producción del faltante
                for dr in detrec_qs:
                    insumo = getattr(dr, "id_insumo", None)
                    if not insumo:
                        continue

                    qty_por_plato = Decimal(str(get_cant_det_receta(dr)))
                    if qty_por_plato <= 0:
                        continue

                    total_desc = qty_por_plato * faltante
                    if total_desc <= 0:
                        continue

                    Insumos.objects.filter(pk=insumo.pk).update(
                        ins_stock_actual=F("ins_stock_actual") - total_desc
                    )
                    movimientos["insumos"].append({
                        "insumo_id": insumo.pk,
                        "delta": float(-total_desc),
                        "campo": "ins_stock_actual",
                    })


                # 3.2.b) Trazabilidad: producir (sumar) y despachar (restar) el faltante
                Platos.objects.filter(pk=plato.pk).update(
                    plt_stock=F("plt_stock") + faltante
                )
                movimientos["platos"].append({
                    "plato_id": plato.pk,
                    "tipo": "produccion",
                    "delta": float(+faltante),
                    "campo": "plt_stock",
                })

                Platos.objects.filter(pk=plato.pk).update(
                    plt_stock=F("plt_stock") - faltante
                )
                movimientos["platos"].append({
                    "plato_id": plato.pk,
                    "tipo": "despacho",
                    "delta": float(-faltante),
                    "campo": "plt_stock",
                })

        return Response({"ok": True, "movimientos": movimientos})

    
    @action(detail=True, methods=["post"], url_path="generar_venta")
    def generar_venta(self, request, pk=None):
        asegurar_caja_abierta()

    # 1) Pedido
        try:
            pedido = self.get_object()
        except Exception:
            return Response({"detail": "Pedido no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if not getattr(pedido, "id_cliente_id", None):
            return Response({"detail": "El pedido no tiene cliente asignado."}, status=status.HTTP_400_BAD_REQUEST)
        if not getattr(pedido, "id_empleado_id", None):
            return Response({"detail": "El pedido no tiene empleado asignado."}, status=status.HTTP_400_BAD_REQUEST)

        # 2) Detalles del pedido
        detalles = DetallePedidos.objects.filter(id_pedido_id=pedido.id_pedido)
        if not detalles.exists():
            return Response({"detail": "El pedido no tiene detalles."}, status=status.HTTP_400_BAD_REQUEST)

        # 3) Estado de venta Pendiente
        estado_pendiente, _ = EstadoVentas.objects.get_or_create(estven_nombre="Pendiente")

        # 4) Transacción
        with transaction.atomic():
            total = Decimal("0")
            items = []

            # Nota: evitamos select_for_update para compatibilidad y usamos d.id_plato_id directo
            for d in detalles:
                # plato y precio
                plato = None
                if hasattr(d, "id_plato") and d.id_plato is not None:
                    plato = d.id_plato  # FK ya cargada
                else:
                    plato = Platos.objects.get(pk=d.id_plato_id)

                precio = Decimal(str(plato.plt_precio or 0))
                cantidad = Decimal(str(d.detped_cantidad or 0))
                if cantidad <= 0:
                    return Response(
                        {"detail": f"Cantidad inválida en detalle {d.pk}: {cantidad}."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                subtotal = (precio * cantidad).quantize(Decimal("0.01"))
                total += subtotal

                # ⚠️ NO incluir detven_subtotal (lo calcula MySQL)
                items.append({
                    "id_plato_id": plato.id_plato,
                    "detven_precio_uni": precio,
                    "detven_cantidad": int(cantidad),  # IntegerField
                })

            # 5) Cabecera de venta
            venta = Ventas.objects.create(
                id_cliente_id=pedido.id_cliente_id,
                id_empleado_id=pedido.id_empleado_id,
                id_estado_venta_id=estado_pendiente.id_estado_venta,
                ven_fecha_hora=pedido.ped_fecha_hora_fin or pedido.ped_fecha_hora_ini or timezone.now(),
                ven_monto=total.quantize(Decimal("0.01")),
                ven_descripcion=f"Venta generada automáticamente del pedido #{pedido.id_pedido}",
            )

            # 6) Detalles de venta (sin detven_subtotal: lo genera MySQL)
            tabla = DetalleVentas._meta.db_table  # debería ser 'detalle_ventas'
            sql = f"""
                INSERT INTO {tabla} (id_venta, id_plato, detven_precio_uni, detven_cantidad)
                VALUES (%s, %s, %s, %s)
            """
            params = [
                (
                    venta.id_venta,
                    item["id_plato_id"],
                    item["detven_precio_uni"],
                    item["detven_cantidad"],
                )
                for item in items
            ]

            with connection.cursor() as cursor:
                cursor.executemany(sql, params)

            # Opcional: si querés devolver cabecera + detalles
            data = VentaSerializer(venta).data
            data["detalles"] = DetalleVentaSerializer(
            DetalleVentas.objects.filter(id_venta_id=venta.id_venta), many=True
                ).data

            return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="cobrar-y-finalizar")
    @transaction.atomic
    def cobrar_y_finalizar(self, request, pk=None):
        asegurar_caja_abierta()
        """
        Body: { "id_metodo_pago": <1|2|3> }
        - Cambia pedido a FINALIZADO
        - Genera la Venta con sus detalles (sin tocar columnas generadas)
        - Crea el Movimiento de Caja (Ingreso) con el monto total
        """
        from decimal import Decimal
        from django.db import connection
        from django.utils import timezone
        from pizzeria.models import (
            DetallePedidos, Platos, Ventas, DetalleVentas,
            MetodoDePago, EstadoVentas, MovimientosCaja
        )

        pedido = self.get_object()

        # Validaciones básicas
        if pedido.id_estado_pedido_id == ESTADO_PEDIDO["CANCELADO"]:
            return Response({"detail": "No se puede cobrar un pedido CANCELADO."}, status=400)

        id_metodo_pago = request.data.get("id_metodo_pago")
        if not id_metodo_pago or not MetodoDePago.objects.filter(pk=id_metodo_pago).exists():
            return Response({"detail": "Método de pago inválido."}, status=400)

        dets = (DetallePedidos.objects
                .select_related("id_plato")
                .filter(id_pedido=pedido.id_pedido))
        if not dets.exists():
            return Response({"detail": "El pedido no tiene ítems."}, status=400)

        # Total e items
        total = Decimal("0.00")
        items = []
        for det in dets:
            plato = det.id_plato
            if getattr(plato, "plt_precio", None) is None:
                return Response(
                    {"detail": f"El plato '{plato.plt_nombre}' no tiene precio definido."}, status=400
                )
            precio = Decimal(str(plato.plt_precio))
            cantidad = int(det.detped_cantidad or 0)
            if cantidad <= 0:
                return Response({"detail": "Cantidad inválida en un ítem."}, status=400)
            total += (precio * Decimal(cantidad))
            items.append((plato.id_plato, precio, cantidad))

        # Estado default de venta
        estven = EstadoVentas.objects.order_by("id_estado_venta").first()

        # Cerrar pedido
        pedido.id_estado_pedido_id = ESTADO_PEDIDO["FINALIZADO"]
        pedido.ped_fecha_hora_fin = timezone.now()
        pedido.save(update_fields=["id_estado_pedido", "ped_fecha_hora_fin"])

        # Cabecera de Venta
        venta = Ventas.objects.create(
            id_cliente_id=pedido.id_cliente_id,
            id_empleado_id=pedido.id_empleado_id,
            id_estado_venta_id=estven.id_estado_venta if estven else None,
            ven_fecha_hora=pedido.ped_fecha_hora_fin,
            ven_monto=total,
            ven_descripcion=f"Venta de pedido #{pedido.id_pedido}",
            id_metodo_pago_id=id_metodo_pago,  # FK ya agregada por tus migraciones
        )

        # Detalles (sin detven_subtotal si es columna generada por MySQL)
        tabla = DetalleVentas._meta.db_table
        sql = f"INSERT INTO {tabla} (id_venta, id_plato, detven_precio_uni, detven_cantidad) VALUES (%s, %s, %s, %s)"
        params = [(venta.id_venta, pid, precio, cant) for (pid, precio, cant) in items]
        with connection.cursor() as cur:
            cur.executemany(sql, params)

        # Movimiento de Caja (Ingreso)
        tipo_ingreso = _tipo_movimiento("Ingreso")
        MovimientosCaja.objects.create(
            id_empleado_id=pedido.id_empleado_id,
            id_metodo_pago_id=id_metodo_pago,
            id_tipo_movimiento_caja_id=tipo_ingreso.id_tipo_movimiento_caja,
            id_venta_id=venta.id_venta,
            mv_monto=venta.ven_monto,
            mv_descripcion=f"Ingreso por venta #{venta.id_venta}",
        )

        from .serializers import VentaSerializer, DetalleVentaSerializer
        data = VentaSerializer(venta).data
        detqs = DetalleVentas.objects.filter(id_venta=venta.id_venta)
        data["detalles"] = DetalleVentaSerializer(detqs, many=True).data
        return Response(data, status=201)
        # ── Bloqueo general de escritura ────────────────────────────
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Valida stock teniendo en cuenta:
        - El pedido NUEVO
        - TODAS las reservas de pedidos EN PROCESO

        Lógica:
        - Primero suma insumos necesarios para TODOS los pedidos en proceso (reservados).
        - Después suma insumos necesarios para el nuevo pedido.
        - Si la suma total > stock de insumos -> 400 y NO crea el pedido.
        """
        asegurar_caja_abierta()

        from decimal import Decimal

        data = request.data
        detalles = data.get("detalles", [])

        if not detalles:
            return Response({"detail": "El pedido no contiene ítems."}, status=400)

        # Acumulador de insumos necesarios:
        # { id_insumo: {"nombre":..., "unidad":..., "total": Decimal} }
        requeridos = {}

        # ─────────────────────────────────────────────
        # 0) Reservas por pedidos EN PROCESO (stock "reservado")
        # ─────────────────────────────────────────────
        pedidos_abiertos = Pedidos.objects.filter(
            id_estado_pedido_id=ESTADO_PEDIDO["EN_PROCESO"]
        )

        if pedidos_abiertos.exists():
            dets_abiertos = (
                DetallePedidos.objects
                .select_related("id_plato")
                .filter(id_pedido__in=pedidos_abiertos)
            )

            for det_ab in dets_abiertos:
                plato = det_ab.id_plato
                if not plato:
                    continue

                cant_abierta = Decimal(str(det_ab.detped_cantidad or 0))
                if cant_abierta <= 0:
                    continue

                # Usamos RECETA para ver cuántos insumos va a consumir este pedido abierto
                receta = Recetas.objects.filter(id_plato=plato).first()
                if not receta:
                    # Si querés, podés dejar pasar estos pedidos sin receta:
                    # continue
                    return Response(
                        {
                            "detail": (
                                f"El plato '{plato.plt_nombre}' no tiene receta "
                                f"para producir {cant_abierta} unidad(es)."
                            )
                        },
                        status=400
                    )

                detalles_receta_qs = (
                    DetalleRecetas.objects
                    .select_related("id_insumo")
                    .filter(id_receta=receta)
                )

                # 🚫 Receta sin insumos asociados
                if not detalles_receta_qs.exists():
                    return Response(
                        {
                            "detail": (
                                f"La receta del plato '{plato.plt_nombre}' no tiene insumos "
                                f"asociados. Debe tener al menos un insumo."
                            )
                        },
                        status=400
                    )

                for dr in detalles_receta_qs:
                    insumo = dr.id_insumo
                    if not insumo:
                        continue

                    por_plato = Decimal(str(dr.detr_cant_unid))
                    if por_plato <= 0:
                        continue

                    # acá usamos cant_abierta, no 'faltante'
                    total_necesario = por_plato * cant_abierta

                    entry = requeridos.setdefault(insumo.id_insumo, {
                        "nombre": insumo.ins_nombre,
                        "unidad": insumo.ins_unidad,
                        "total": Decimal("0"),
                    })
                    entry["total"] += total_necesario



        # ─────────────────────────────────────────────
        # 1) Insumos necesarios para el NUEVO pedido
        #     (reutilizamos "requeridos" como base)
        # ─────────────────────────────────────────────
        for det in detalles:
            plato_id = det.get("id_plato")
            cantidad = Decimal(str(det.get("detped_cantidad", 0)))

            if cantidad <= 0:
                return Response({"detail": "Cantidad inválida en un ítem."}, status=400)

            plato = Platos.objects.filter(pk=plato_id).first()
            if not plato:
                return Response(
                    {"detail": f"El plato con ID {plato_id} no existe."},
                    status=400
                )

            # Stock del plato: primero usamos lo que ya hay preparado
            stock_plato = Decimal(str(plato.plt_stock or 0))
            desde_stock = min(stock_plato, cantidad)
            faltante = cantidad - desde_stock

            # Si NO falta (todo sale de stock del plato), no se necesitan insumos
            if faltante <= 0:
                continue

            # Si falta → se produciría usando RECETA => consume insumos
            receta = Recetas.objects.filter(id_plato=plato).first()
            if not receta:
                return Response(
                    {
                        "detail": (
                            f"El plato '{plato.plt_nombre}' no tiene receta para "
                            f"producir {faltante} unidad(es)."
                        )
                    },
                    status=400
                )

            detalles_receta = (
                DetalleRecetas.objects
                .select_related("id_insumo")
                .filter(id_receta=receta)
            )

            for dr in detalles_receta:
                insumo = dr.id_insumo
                if not insumo:
                    continue

                por_plato = Decimal(str(dr.detr_cant_unid))
                if por_plato <= 0:
                    continue

                total_necesario = por_plato * faltante

                entry = requeridos.setdefault(insumo.id_insumo, {
                    "nombre": insumo.ins_nombre,
                    "unidad": insumo.ins_unidad,
                    "total": Decimal("0"),
                })
                entry["total"] += total_necesario

        # ─────────────────────────────────────────────
        # 2) VALIDAR STOCK DE INSUMOS (reservas + nuevo pedido)
        # ─────────────────────────────────────────────
        if requeridos:
            ids = list(requeridos.keys())
            for ins in Insumos.objects.filter(pk__in=ids):
                necesario = requeridos[ins.id_insumo]["total"]
                disponible = Decimal(str(ins.ins_stock_actual or 0))

                if disponible < necesario:
                    faltante = Decimal(str(necesario)) - Decimal(str(disponible))

                    # Normalizar para que no dé negativos
                    if faltante < 0:
                        faltante = Decimal("0")

                    # Limpiar el formato: siempre mostrar con 3 decimales
                    faltante_fmt = f"{faltante:.3f}"

                    msg_corto = (
                        f"Stock insuficiente: falta {faltante_fmt} {ins.ins_unidad} "
                        f"de {ins.ins_nombre}."
                    )

                    return Response({"detail": msg_corto}, status=400)


        # ─────────────────────────────────────────────
        # 3) Si todo OK → CREAR EL PEDIDO NORMALMENTE
        # ─────────────────────────────────────────────
        return super().create(request, *args, **kwargs)



    def update(self, request, *args, **kwargs):
        asegurar_caja_abierta()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        asegurar_caja_abierta()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        asegurar_caja_abierta()
        return super().destroy(request, *args, **kwargs)


# Estados de venta (catálogo)
class EstadoVentaViewSet(ReadOnlyModelViewSet):
    queryset = EstadoVentas.objects.all().order_by("id_estado_venta")
    serializer_class = EstadoVentaSerializer
    permission_classes = [IsAuthenticated]


class VentaViewSet(RoleProtectedViewSet):
    queryset = Ventas.objects.all().order_by("-id_venta")
    serializer_class = VentaSerializer
    
    # ------------------------------------------------------------------
    # /api/ventas/<id>/comprobante-pdf/
    # Genera un comprobante PDF (NO válido como factura)
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get"], url_path="comprobante-pdf")
    def comprobante_pdf(self, request, pk=None):
        from reportlab.pdfgen import canvas
        from io import BytesIO
        from django.http import HttpResponse

        venta = self.get_object()
        detalles = DetalleVentas.objects.filter(id_venta=venta.id_venta).select_related("id_plato")

        # Crear PDF en memoria
        buffer = BytesIO()
        p = canvas.Canvas(buffer)

        # Encabezado
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, 800, "Pizzería Rex")
        p.setFont("Helvetica", 10)
        p.drawString(50, 785, "COMPROBANTE DE VENTA (NO VÁLIDO COMO FACTURA)")

        y = 760
        p.setFont("Helvetica", 11)

        # Datos de la venta
        p.drawString(50, y, f"Venta Nº: {venta.id_venta}")
        y -= 15
        p.drawString(50, y, f"Fecha: {venta.ven_fecha_hora}")
        y -= 15
        p.drawString(50, y, f"Cliente: {venta.id_cliente.cli_nombre if venta.id_cliente else '-'}")
        y -= 15
        p.drawString(50, y, f"Empleado: {venta.id_empleado.emp_nombre if venta.id_empleado else '-'}")
        y -= 25

        # Tabla
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "Plato")
        p.drawString(280, y, "Cant.")
        p.drawString(330, y, "P.Unit.")
        p.drawString(400, y, "Subtotal")
        p.setFont("Helvetica", 10)
        y -= 15

        total = 0

        for det in detalles:
            plato = det.id_plato.plt_nombre
            cant = det.detven_cantidad
            pu = float(det.detven_precio_uni)
            sub = cant * pu
            total += sub

            p.drawString(50, y, plato[:35])
            p.drawRightString(310, y, str(cant))
            p.drawRightString(360, y, f"${pu:.2f}")
            p.drawRightString(480, y, f"${sub:.2f}")
            y -= 15

            if y < 80:  # salto de página
                p.showPage()
                y = 800

        # Total
        p.setFont("Helvetica-Bold", 12)
        p.drawRightString(480, y - 10, f"TOTAL: ${total:.2f}")

        p.showPage()
        p.save()
        buffer.seek(0)

        filename = f"comprobante_venta_{venta.id_venta}.pdf"
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    # ── Bloqueo general de escritura ────────────────────────────
    def create(self, request, *args, **kwargs):
        asegurar_caja_abierta()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        asegurar_caja_abierta()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        asegurar_caja_abierta()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        asegurar_caja_abierta()
        return super().destroy(request, *args, **kwargs)

# Detalle de venta
class DetalleVentaViewSet(RoleProtectedViewSet):
    queryset = (
        DetalleVentas.objects
        .select_related("id_venta", "id_plato")
        .all()
        .order_by("-id_detalle_venta")
    )
    serializer_class = DetalleVentaSerializer
    

    # Permitir ?id_venta=<id> para listar/editar por cabecera
    def get_queryset(self):
        qs = super().get_queryset()
        id_venta = self.request.query_params.get("id_venta")
        if id_venta:
            qs = qs.filter(id_venta_id=id_venta)
        return qs


class MovimientoCajaViewSet(RoleProtectedViewSet):
    queryset = MovimientosCaja.objects.all().order_by("-id_movimiento_caja")
    serializer_class = MovimientoCajaSerializer
    

    # POST /api/movimientos-caja/abrir  { "monto_inicial": 1000.00 }
    @action(detail=False, methods=["post"], url_path="abrir")
    @transaction.atomic
    def abrir(self, request):
        from decimal import Decimal
        monto_inicial = Decimal(str(request.data.get("monto_inicial", "0")))
        if monto_inicial < 0:
            return Response({"detail": "monto_inicial inválido."}, status=400)

        tipo = _tipo_movimiento("Apertura")
        mov = MovimientosCaja.objects.create(
            id_empleado_id=getattr(getattr(request.user, "empleados", None), "id_empleado", None),
            id_tipo_movimiento_caja_id=tipo.id_tipo_movimiento_caja,
            mv_monto=monto_inicial,
            mv_descripcion="Apertura de caja",
        )
        return Response(self.get_serializer(mov).data, status=201)

    # POST /api/movimientos-caja/cerrar  { "observacion": "..." }
    @action(detail=False, methods=["post"], url_path="cerrar")
    @transaction.atomic
    def cerrar(self, request):
        tipo = _tipo_movimiento("Cierre")
        mov = MovimientosCaja.objects.create(
            id_empleado_id=getattr(getattr(request.user, "empleados", None), "id_empleado", None),
            id_tipo_movimiento_caja_id=tipo.id_tipo_movimiento_caja,
            mv_monto=0,
            mv_descripcion=request.data.get("observacion") or "Cierre de caja",
        )
        return Response(self.get_serializer(mov).data, status=201)

    # GET /api/movimientos-caja/resumen?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
    @action(detail=False, methods=["get"], url_path="resumen")
    def resumen(self, request):
        desde, hasta = _rango_desde_hasta(request)
        qs = MovimientosCaja.objects.all()
        if desde:
            qs = qs.filter(mv_fecha_hora__gte=desde)
        if hasta:
            qs = qs.filter(mv_fecha_hora__lte=hasta)

        total = qs.aggregate(total=Sum("mv_monto"))["total"] or 0
        return Response({"total": total}, status=200)

    # GET /api/movimientos-caja/arqueo?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
    # Devuelve totales por método de pago y total general
    @action(detail=False, methods=["get"], url_path="arqueo")
    def arqueo(self, request):
        desde, hasta = _rango_desde_hasta(request)
        qs = (MovimientosCaja.objects
              .select_related("id_metodo_pago")
              .filter(id_tipo_movimiento_caja__tmovc_nombre__iexact="Ingreso"))
        if desde:
            qs = qs.filter(mv_fecha_hora__gte=desde)
        if hasta:
            qs = qs.filter(mv_fecha_hora__lte=hasta)

        por_mp = (qs.values("id_metodo_pago__metpag_nombre")
                    .annotate(monto=Sum("mv_monto"))
                    .order_by("id_metodo_pago__metpag_nombre"))

        total = qs.aggregate(total=Sum("mv_monto"))["total"] or 0

        data = {
            "metodos": [
                {"metodo": r["id_metodo_pago__metpag_nombre"] or "Sin método", "monto": r["monto"] or 0}
                for r in por_mp
            ],
            "total": total,
        }
        return Response(data, status=200)

class TipoPedidoViewSet(RoleProtectedViewSet):
    queryset = TipoPedidos.objects.all().order_by("-id_tipo_pedido")
    serializer_class = TipoPedidoSerializer
    

class EstadoPedidoViewSet(RoleProtectedViewSet):
    queryset = EstadoPedidos.objects.all().order_by("-id_estado_pedido")
    serializer_class = EstadoPedidoSerializer
    

class MetodoPagoViewSet(RoleProtectedViewSet):
    queryset = MetodoDePago.objects.all().order_by("-id_metodo_pago")
    serializer_class = MetodoPagoSerializer
    

class RecetaViewSet(RoleProtectedViewSet):
    queryset = (
        Recetas.objects
        .select_related("id_plato", "id_estado_receta")
        .prefetch_related("detallerecetas_set__id_insumo")
        .all()
        .order_by("-id_receta")
    )
    serializer_class = RecetaSerializer
    

    def get_queryset(self):
        qs = super().get_queryset()
        plato_id = self.request.query_params.get("id_plato")
        if plato_id:
            qs = qs.filter(id_plato_id=plato_id)
        return qs

    def _forzar_campos_fijos(self, instance, data_mutable):
        """
        Fuerza:
        - rec_nombre = nombre del plato
        - id_plato = el mismo plato que ya tiene
        - id_estado_receta = el mismo estado que ya tiene
        """
        plato = instance.id_plato
        nombre_plato = (
            getattr(plato, "pla_nombre", None)
            or getattr(plato, "plt_nombre", None)
            or getattr(plato, "nombre", None)
            or data_mutable.get("rec_nombre")
        )
        data_mutable["rec_nombre"] = nombre_plato
        data_mutable["id_plato"] = instance.id_plato_id
        if hasattr(instance, "id_estado_receta_id"):
            data_mutable["id_estado_receta"] = instance.id_estado_receta_id

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        data = request.data.copy()

        # Forzamos nombre / plato / estado
        self._forzar_campos_fijos(instance, data)

        serializer = self.get_serializer(
            instance,
            data=data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


class DetalleRecetaViewSet(RoleProtectedViewSet):
    queryset = (
        DetalleRecetas.objects
        .select_related("id_receta", "id_insumo")
        .all()
        .order_by("-id_detalle_receta")
    )
    serializer_class = DetalleRecetaSerializer
    

    def get_queryset(self):
        qs = super().get_queryset()
        rec_id = self.request.query_params.get("id_receta")
        ins_id = self.request.query_params.get("id_insumo")

        if rec_id:
            qs = qs.filter(id_receta_id=rec_id)
        if ins_id:
            qs = qs.filter(id_insumo_id=ins_id)

        return qs



class CategoriaPlatoViewSet(RoleProtectedViewSet):
    queryset = CategoriaPlatos.objects.all().order_by("-id_categoria_plato")
    serializer_class = CategoriaPlatoSerializer
    

class EstadoRecetaViewSet(RoleProtectedViewSet):
    queryset = EstadoReceta.objects.all().order_by("id_estado_receta")
    serializer_class = EstadoRecetaSerializer
    

class DetallePedidoViewSet(RoleProtectedViewSet):
    queryset = (
        DetallePedidos.objects
        .select_related("id_pedido", "id_plato")
        .all()
        .order_by("-id_detalle_pedido")
    )
    serializer_class = DetallePedidoSerializer
    

class EstadoMesasViewSet(ReadOnlyModelViewSet):
    queryset = EstadoMesas.objects.all().order_by("id_estado_mesa")
    serializer_class = EstadoMesasSerializer
    permission_classes = [IsAuthenticated]

class MesasViewSet(RoleProtectedViewSet):
    queryset = Mesas.objects.all().order_by("-id_mesa")
    serializer_class = MesasSerializer
    

class EstadoCompraViewSet(ReadOnlyModelViewSet):
    queryset = EstadoCompra.objects.all().order_by("id_estado_compra")
    serializer_class = EstadoCompraSerializer
    permission_classes = [IsAuthenticated]


class CompraViewSet(RoleProtectedViewSet):
    queryset = (
        Compras.objects
        .select_related("id_empleado", "id_estado_compra", "id_proveedor")
        .all()
        .order_by("-id_compra")
    )
    serializer_class = CompraSerializer
    

    def get_queryset(self):
        """
        Permite filtrar por proveedor desde el front:
        /api/compras/?id_proveedor=<id>
        (lo usás en ProveedorInsumos.jsx para ver compras de un proveedor)
        """
        qs = super().get_queryset()
        id_proveedor = self.request.query_params.get("id_proveedor")
        if id_proveedor:
            qs = qs.filter(id_proveedor_id=id_proveedor)
        return qs


class DetalleCompraViewSet(RoleProtectedViewSet):
    queryset = (
        DetalleCompra.objects
        .select_related("id_compra", "id_insumo")
        .all()
        .order_by("-id_detalle_compra")
    )
    serializer_class = DetalleCompraSerializer
    

    def get_queryset(self):
        qs = super().get_queryset()
        id_compra = self.request.query_params.get("id_compra")
        if id_compra:
            qs = qs.filter(id_compra=id_compra)
        return qs

    # ================================================================
    # HELPERS
    # ================================================================
    def _estado_ids_en_proceso(self):
        ids = []
        for est in EstadoCompra.objects.all():
            nombre = (est.estcom_nombre or "").strip().lower().replace("_", " ")
            if nombre == "en proceso":
                ids.append(est.id_estado_compra)
        return ids

    def _reservado_en_proceso(self, insumo, excluir_compra=None):
        """
        Calcula stock reservado para ESTE insumo por compras EN PROCESO.
        Cada compra en proceso aporta:
            detcom_cantidad * ins_capacidad
        """
        from decimal import Decimal

        estado_ids = self._estado_ids_en_proceso()
        if not estado_ids:
            return Decimal("0")

        compras = Compras.objects.filter(id_estado_compra_id__in=estado_ids)

        if excluir_compra:
            compras = compras.exclude(id_compra=excluir_compra)

        dets = DetalleCompra.objects.filter(
            id_compra__in=compras,
            id_insumo=insumo
        )

        total_envases = Decimal("0")
        for d in dets:
            total_envases += Decimal(str(d.detcom_cantidad or 0))

        cap = Decimal(str(insumo.ins_capacidad or 0))
        return total_envases * cap

    # ================================================================
    # CREATE — incluye validación para REGISTRAR + EDITAR
    # ================================================================
    def create(self, request, *args, **kwargs):
        """
        Valida tanto registrar compra como editar compra.

        Fórmula:
            ocupado_total = stock_actual + reservado + nuevo_ingreso
        Debe cumplir:
            ocupado_total <= stock_max

        Donde:
            stock_max = ins_stock_max   (atributo del insumo)
            nuevo_ingreso = detcom_cantidad * ins_capacidad
        """
        from decimal import Decimal, InvalidOperation

        data = request.data
        id_compra = data.get("id_compra")
        id_insumo = data.get("id_insumo")
        cant_raw = data.get("detcom_cantidad")

        # ---------------- Validaciones básicas ----------------
        if not id_insumo:
            return Response({"detail": "Debe indicar un insumo."}, status=400)

        if cant_raw in (None, ""):
            return Response({"detail": "Debe indicar cantidad."}, status=400)

        try:
            cantidad = Decimal(str(cant_raw))
        except InvalidOperation:
            return Response({"detail": "Cantidad inválida."}, status=400)

        if cantidad <= 0:
            return Response({"detail": "La cantidad debe ser mayor que 0."}, status=400)

        if cantidad != cantidad.to_integral_value():
            return Response({"detail": "La cantidad debe ser un número entero."}, status=400)

        # ---------------- Obtener insumo ----------------
        try:
            insumo = Insumos.objects.get(pk=id_insumo)
        except Insumos.DoesNotExist:
            return Response({"detail": "Insumo no encontrado."}, status=400)

        cap = Decimal(str(insumo.ins_capacidad or 0))
        if cap <= 0:
            return Response(
                {"detail": f"El insumo '{insumo.ins_nombre}' no tiene capacidad configurada."},
                status=400,
            )

        stock_actual = Decimal(str(insumo.ins_stock_actual or 0))
        stock_max = Decimal(str(insumo.ins_stock_max or 0))  # ⭐ STOCK MAX REAL

        # ---------------- Reservado por otras compras en proceso ----------------
        reservado = self._reservado_en_proceso(
            insumo,
            excluir_compra=id_compra  # ⭐ si estás editando, no sumamos esta compra anterior
        )

        # ---------------- Cálculo de nuevo ingreso ----------------
        nuevo_ingreso = cantidad * cap

        ocupado_total = stock_actual + reservado + nuevo_ingreso

        if stock_max > 0 and ocupado_total > stock_max:
            return Response(
                {
                    "detail": (
                        "No se puede registrar la compra porque supera el stock máximo.\n"
                        f"• Stock actual: {stock_actual:.3f}\n"
                        f"• Reservado (otras compras en proceso): {reservado:.3f}\n"
                        f"• Nuevo ingreso: {nuevo_ingreso:.3f}\n"
                        f"• Stock máximo permitido: {stock_max:.3f}"
                    )
                },
                status=400,
            )

        # Si todo está OK → continuar
        return super().create(request, *args, **kwargs)




class ProveedorInsumoViewSet(RoleProtectedViewSet):
    """
    /api/proveedores-insumos/
      GET  ?id_proveedor=<id>  -> lista vínculos de un proveedor
           ?id_insumo=<id>     -> lista vínculos por insumo
      POST {id_proveedor, id_insumo}
      DELETE /api/proveedores-insumos/<id_prov_x_ins>/
    """
    serializer_class = ProveedorInsumoSerializer
    

    def get_queryset(self):
        qs = ProveedoresXInsumos.objects.select_related("id_proveedor", "id_insumo").order_by("-id_prov_x_ins")
        pid = self.request.query_params.get("id_proveedor")
        iid = self.request.query_params.get("id_insumo")
        if pid:
            qs = qs.filter(id_proveedor_id=pid)
        if iid:
            qs = qs.filter(id_insumo_id=iid)
        return qs

# ──────────────────────────────────────────────────────────────────────────────
# ESTADO DE CAJA (corrige nombres de campos y serializer)
# ──────────────────────────────────────────────────────────────────────────────
# ──────────────────────────────────────────────────────────────────────────────
# ESTADO DE CAJA
# ──────────────────────────────────────────────────────────────────────────────
# ──────────────────────────────────────────────────────────────────────────────
# ESTADO DE CAJA
# ──────────────────────────────────────────────────────────────────────────────
class CajaEstadoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Devuelve el estado de la CAJA de HOY.

        - Detecta la última APERTURA de hoy.
        - Considera solo los movimientos DESDE esa apertura (caja actual).
        - Calcula:
            * apertura_monto: monto inicial de esa apertura
            * hoy_saldo: ingresos - egresos (todos los métodos)
            * efectivo_disponible:
                  apertura_monto
                + ingresos en EFECTIVO (solo de esta caja)
                - egresos en EFECTIVO (solo de esta caja)
            * totales_metodo:
                - ingresos  (solo INGRESO)
                - egresos   (solo EGRESO)
                - total = ingresos - egresos
        """
        from decimal import Decimal

        hoy = timezone.localdate()
        inicio = timezone.make_aware(
            timezone.datetime.combine(hoy, timezone.datetime.min.time())
        )
        fin = timezone.make_aware(
            timezone.datetime.combine(hoy, timezone.datetime.max.time())
        )

        # Todos los movimientos de HOY
        movs_hoy = (
            MovimientosCaja.objects
            .filter(mv_fecha_hora__range=(inicio, fin))
            .order_by("mv_fecha_hora")
        )

        apertura_fecha = None
        apertura_empleado_nombre = "-"

        if not movs_hoy.exists():
            # No hubo movimientos hoy → caja cerrada
            return Response({
                "abierta": False,
                "mensaje": "La caja no fue abierta hoy.",
                "apertura_monto": "0.00",
                "hoy_saldo": "0.00",
                "efectivo_disponible": "0.00",
                "totales_metodo": [],
                "apertura_fecha": apertura_fecha,
                "apertura_empleado_nombre": apertura_empleado_nombre,
            })

        # ¿La caja está abierta? (último movimiento NO es CIERRE)
        ultimo = movs_hoy.last()
        abierta = ultimo.id_tipo_movimiento_caja_id != TIPO_MOV_CAJA["CIERRE"]

        # Última APERTURA de hoy (define la caja ACTUAL)
        apertura = (
            movs_hoy
            .filter(id_tipo_movimiento_caja_id=TIPO_MOV_CAJA["APERTURA"])
            .last()
        )

        if not apertura:
            # No hay apertura hoy → tratamos como cerrada
            return Response({
                "abierta": False,
                "mensaje": "No se encontró movimiento de apertura hoy.",
                "apertura_monto": "0.00",
                "hoy_saldo": "0.00",
                "efectivo_disponible": "0.00",
                "totales_metodo": [],
                "apertura_fecha": apertura_fecha,
                "apertura_empleado_nombre": apertura_empleado_nombre,
            })

        # Datos de apertura (fecha/hora y empleado)
        apertura_fecha = apertura.mv_fecha_hora

        try:
            emp = getattr(apertura, "id_empleado", None)
            if emp:
                nom = (getattr(emp, "emp_nombre", "") or "").strip()
                ape = (getattr(emp, "emp_apellido", "") or "").strip()
                full = f"{nom} {ape}".strip()
                if full:
                    apertura_empleado_nombre = full
        except Exception:
            apertura_empleado_nombre = "-"

        # Movimientos SOLO de la caja actual (desde la última apertura)
        movs_rango = movs_hoy.filter(mv_fecha_hora__gte=apertura.mv_fecha_hora)

        ingresos_qs = movs_rango.filter(
            id_tipo_movimiento_caja_id=TIPO_MOV_CAJA["INGRESO"]
        )
        egresos_qs = movs_rango.filter(
            id_tipo_movimiento_caja_id=TIPO_MOV_CAJA["EGRESO"]
        )

        # Totales generales (todos los métodos)
        total_ingresos = ingresos_qs.aggregate(t=Sum("mv_monto"))["t"] or Decimal("0")
        total_egresos = egresos_qs.aggregate(t=Sum("mv_monto"))["t"] or Decimal("0")
        hoy_saldo = total_ingresos - total_egresos

        # 🔹 Totales por método: separamos ingresos y egresos
        totales_metodo_qs = (
            movs_rango
            .values("id_metodo_pago", "id_metodo_pago__metpag_nombre")
            .annotate(
                ingresos=Sum(
                    Case(
                        When(id_tipo_movimiento_caja_id=TIPO_MOV_CAJA["INGRESO"], then="mv_monto"),
                        default=Value(0),
                        output_field=DecimalField(),
                    )
                ),
                egresos=Sum(
                    Case(
                        When(id_tipo_movimiento_caja_id=TIPO_MOV_CAJA["EGRESO"], then="mv_monto"),
                        default=Value(0),
                        output_field=DecimalField(),
                    )
                ),
            )
        )

        totales_metodo = []
        for fila in totales_metodo_qs:
            ing = fila["ingresos"] or Decimal("0")
            egr = fila["egresos"] or Decimal("0")
            totales_metodo.append({
                "id_metodo_pago": fila["id_metodo_pago"],
                "nombre": fila["id_metodo_pago__metpag_nombre"] or "Sin método",
                "ingresos": float(ing),
                "egresos": float(egr),
                "total": float(ing - egr),
            })

        # EFECTIVO disponible = apertura + ingresos efectivo - egresos efectivo (de esta caja)
        ingresos_efectivo = ingresos_qs.filter(
            id_metodo_pago_id=METODO_PAGO["EFECTIVO"]
        ).aggregate(t=Sum("mv_monto"))["t"] or Decimal("0")

        egresos_efectivo = egresos_qs.filter(
            id_metodo_pago_id=METODO_PAGO["EFECTIVO"]
        ).aggregate(t=Sum("mv_monto"))["t"] or Decimal("0")

        apertura_monto = Decimal(str(apertura.mv_monto or 0))
        efectivo_disponible = apertura_monto + ingresos_efectivo - egresos_efectivo

        return Response({
            "abierta": abierta,
            "apertura_monto": f"{apertura_monto:.2f}",
            "hoy_saldo": f"{hoy_saldo:.2f}",
            "efectivo_disponible": f"{efectivo_disponible:.2f}",
            "totales_metodo": totales_metodo,
            "apertura_fecha": apertura_fecha.isoformat() if apertura_fecha else None,
            "apertura_empleado_nombre": apertura_empleado_nombre,
        })






class CajaIngresosSemanalesView(APIView):
    """
    GET /api/caja/ingresos-semanales/

    Devuelve ingresos por día para los últimos 7 días
    ANTERIORES A HOY (incluyendo hoy) sin contar domingos.

    Formato:
    {
      "dias": [
        {"fecha": "2025-11-12", "label": "Mié", "ingresos": "3800.00"},
        ...
      ]
    }
    """
    def get(self, request):
        from datetime import datetime, timedelta

        hoy = timezone.localdate()

        # Recolectar 7 días (no domingos), contando hoy hacia atrás
        dias = []
        current = hoy
        while len(dias) < 7:
            # weekday(): 0=Lun ... 6=Dom → descartamos 6
            if current.weekday() != 6:
                dias.append(current)
            current = current - timedelta(days=1)

        dias = list(reversed(dias))  # ordenar de más viejo → hoy

        ID_INGRESO = 2  # ajustá si tu ID de "ingreso" es otro

        nombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        salida = []

        for d in dias:
            inicio = timezone.make_aware(
                datetime.combine(d, datetime.min.time())
            )
            fin = timezone.make_aware(
                datetime.combine(d, datetime.max.time())
            )

            total = (
                MovimientosCaja.objects.filter(
                    mv_fecha_hora__range=(inicio, fin),
                    id_tipo_movimiento_caja_id=ID_INGRESO,
                ).aggregate(s=Sum("mv_monto"))["s"] or Decimal("0.00")
            )

            salida.append({
                "fecha": d.isoformat(),
                "label": nombres[d.weekday()],
                "ingresos": f"{total:.2f}",
            })

        return Response({"dias": salida})





# ──────────────────────────────────────────────────────────────────────────────
# MOVIMIENTOS DE CAJA (corrige select_related, campos, empleado=usuario)
# ──────────────────────────────────────────────────────────────────────────────
class MovimientosCajaViewSet(RoleProtectedViewSet):
    queryset = (
        MovimientosCaja.objects
        .select_related("id_empleado", "id_tipo_movimiento_caja", "id_metodo_pago", "id_venta")
        .all()
        .order_by("-mv_fecha_hora")
    )

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return MovimientosCajaCreateSerializer
        return MovimientoCajaSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        # ── Empleado vinculado al usuario logueado ─────────────────────
        empleado = Empleados.objects.filter(usuario=request.user).first()
        if not empleado:
            return Response(
                {"detail": "No se encontró el empleado vinculado al usuario."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Normalizar tipo de movimiento ─────────────────────────────
        tipo_id = int(
            data.get("id_tipo_movimiento_caja")
            or data.get("id_tipo_movimiento")
            or data.get("id_tipo_mov")
            or 0
        )
        data["id_tipo_movimiento_caja"] = tipo_id

        ID_APERTURA = 1
        ID_INGRESO  = 2
        ID_EGRESO   = 3
        ID_CIERRE   = 4

        # ── Rango del día ─────────────────────────────────────────────
        hoy = timezone.localdate()
        inicio_dia = timezone.make_aware(
            timezone.datetime.combine(hoy, timezone.datetime.min.time())
        )
        fin_dia = timezone.make_aware(
            timezone.datetime.combine(hoy, timezone.datetime.max.time())
        )

        qs_hoy = MovimientosCaja.objects.filter(mv_fecha_hora__range=(inicio_dia, fin_dia))

        # ── Estado de caja HOY según el ÚLTIMO movimiento ─────────────
        ultimo = qs_hoy.order_by("mv_fecha_hora").last()
        caja_abierta = bool(ultimo and ultimo.id_tipo_movimiento_caja_id != ID_CIERRE)

        # ── No permitir abrir/cerrar dos veces seguidas ───────────────
        if tipo_id == ID_APERTURA and caja_abierta:
            return Response(
                {"detail": "La caja ya está abierta. No se puede abrir dos veces seguidas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if tipo_id == ID_CIERRE and not caja_abierta:
            return Response(
                {"detail": "La caja ya está cerrada. No se puede cerrar dos veces seguidas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Reglas según el tipo de movimiento ────────────────────────
        if tipo_id == ID_APERTURA:
            # Apertura: sin venta, método de pago = Efectivo si existe
            data["id_venta"] = None
            try:
                efectivo = MetodoDePago.objects.get(metpag_nombre__iexact="Efectivo")
                data["id_metodo_pago"] = efectivo.id_metodo_pago
            except MetodoDePago.DoesNotExist:
                data["id_metodo_pago"] = None
            # mv_monto lo manda el front (monto inicial)

        elif tipo_id == ID_INGRESO:
            # Ingreso: requiere venta y método de pago
            if not data.get("id_venta"):
                return Response(
                    {"id_venta": ["Requerido para ingresos (cobros)."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not data.get("id_metodo_pago"):
                return Response(
                    {"id_metodo_pago": ["Requerido para ingresos (cobros)."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # mv_monto lo debe mandar el front (> 0)

        elif tipo_id == ID_EGRESO:
            # Egreso: sin venta ni método de pago
            data["id_venta"] = None

            # mv_monto lo debe mandar el front (> 0)

        elif tipo_id == ID_CIERRE:
            # ────────────────────────────────────────────────────────────
            # CIERRE: tomar SOLO lo que pasó desde la ÚLTIMA APERTURA
            # ────────────────────────────────────────────────────────────

            # Última apertura del día (después de cualquier cierre anterior)
            ultima_apertura = (
                qs_hoy.filter(id_tipo_movimiento_caja_id=ID_APERTURA)
                .order_by("-mv_fecha_hora")
                .first()
            )

            if not ultima_apertura:
                return Response(
                    {"detail": "No hay una apertura registrada hoy para calcular el cierre."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            inicio_ciclo = ultima_apertura.mv_fecha_hora
            ahora = timezone.now()

            movimientos_ciclo = qs_hoy.filter(
                mv_fecha_hora__gte=inicio_ciclo,
                mv_fecha_hora__lte=ahora,
            )

            monto_apertura = ultima_apertura.mv_monto or 0
            ingresos = (
                movimientos_ciclo.filter(id_tipo_movimiento_caja_id=ID_INGRESO)
                .aggregate(s=Sum("mv_monto"))["s"] or 0
            )
            egresos = (
                movimientos_ciclo.filter(id_tipo_movimiento_caja_id=ID_EGRESO)
                .aggregate(s=Sum("mv_monto"))["s"] or 0
            )

            # saldo final de este ciclo: APERTURA (última) + INGRESOS - EGRESOS
            saldo_final = Decimal(str(monto_apertura)) + Decimal(str(ingresos)) - Decimal(str(egresos))

            # ⚠ Para no violar el CHECK (mv_monto >= 0) nunca guardamos negativo
            if saldo_final < 0:
                data["mv_monto"] = Decimal("0.00")
            else:
                data["mv_monto"] = saldo_final

            data["id_venta"] = None
            data["id_metodo_pago"] = None


        # ── Validar y crear ───────────────────────────────────────────
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        ahora = timezone.now()
        instancia = serializer.save(
            id_empleado=empleado,
            mv_fecha_hora=ahora,
        )

        read_serializer = MovimientoCajaSerializer(instancia)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="arqueo")
    def arqueo_caja(self, request):
        """
        Devuelve totales de ingresos, egresos y neto agrupados por método de pago.
        Filtra por fecha YYYY-MM-DD (desde - hasta).
        """
        fecha_desde = request.query_params.get("desde")
        fecha_hasta = request.query_params.get("hasta")

        movimientos = MovimientosCaja.objects.all()

        if fecha_desde:
            movimientos = movimientos.filter(mv_fecha_hora__date__gte=fecha_desde)
        if fecha_hasta:
            movimientos = movimientos.filter(mv_fecha_hora__date__lte=fecha_hasta)

        # Agrupar por método de pago
        agrupado = (
            movimientos.values("id_metodo_pago__metpag_nombre", "id_metodo_pago")
            .annotate(
                ingresos=Sum(
                    Case(
                        When(id_tipo_movimiento_caja=2, then="mv_monto"),
                        default=Value(0),
                        output_field=DecimalField(),
                    )
                ),
                egresos=Sum(
                    Case(
                        When(id_tipo_movimiento_caja=3, then="mv_monto"),
                        default=Value(0),
                        output_field=DecimalField(),
                    )
                ),
            )
        )

        # Convertir formato para el front
        detalle = []
        total_ingresos = 0
        total_egresos = 0

        for fila in agrupado:
            ingreso = fila["ingresos"] or 0
            egreso = fila["egresos"] or 0
            detalle.append({
                "id_metodo_pago": fila["id_metodo_pago"],
                "metodo_pago": fila["id_metodo_pago__metpag_nombre"] or "Sin método",
                "ingresos": ingreso,
                "egresos": egreso,
                "neto": ingreso - egreso,
            })
            total_ingresos += ingreso
            total_egresos += egreso

        return Response({
            "por_metodo": detalle,
            "total_ingresos": total_ingresos,
            "total_egresos": total_egresos,
            "total_neto": total_ingresos - total_egresos,
        })
    # ── Helper: ¿la caja está abierta hoy? ──────────────────────────────────────
    def caja_esta_abierta_hoy():
        """
        Devuelve True si, para el día de hoy, el ÚLTIMO movimiento de caja
        NO es un cierre. Si no hay movimientos, se considera cerrada.
        """
        hoy = timezone.localdate()
        inicio = timezone.make_aware(
            timezone.datetime.combine(hoy, timezone.datetime.min.time())
        )
        fin = timezone.make_aware(
            timezone.datetime.combine(hoy, timezone.datetime.max.time())
        )

        qs_hoy = MovimientosCaja.objects.filter(mv_fecha_hora__range=(inicio, fin))

        ultimo = qs_hoy.order_by("mv_fecha_hora").last()
        if not ultimo:
            # Nunca se abrió hoy → cerrada
            return False

        # Si el último movimiento del día es CIERRE → cerrada
        return ultimo.id_tipo_movimiento_caja_id != TIPO_MOV_CAJA["CIERRE"]

# ── Helper: ¿la caja está abierta hoy? ──────────────────────────────────────
def caja_esta_abierta_hoy():
    """
    Devuelve True si, para el día de hoy, el ÚLTIMO movimiento de caja
    NO es un cierre. Si no hay movimientos, se considera cerrada.
    """
    hoy = timezone.localdate()
    inicio = timezone.make_aware(
        timezone.datetime.combine(hoy, timezone.datetime.min.time())
    )
    fin = timezone.make_aware(
        timezone.datetime.combine(hoy, timezone.datetime.max.time())
    )

    qs_hoy = MovimientosCaja.objects.filter(mv_fecha_hora__range=(inicio, fin))

    ultimo = qs_hoy.order_by("mv_fecha_hora").last()
    if not ultimo:
        # Nunca se abrió hoy → cerrada
        return False

    # Si el último movimiento del día es CIERRE → cerrada
    return ultimo.id_tipo_movimiento_caja_id != TIPO_MOV_CAJA["CIERRE"]


    
# ──────────────────────────────────────────────────────────────────────────────
# HISTORIAL DE CAJA (un arqueo por cada cierre)
# ──────────────────────────────────────────────────────────────────────────────
class CajaHistorialView(APIView):
    """
    GET /api/caja/historial/

    Devuelve una lista de cierres, cada uno con:
    - fecha y hora del cierre
    - apertura correspondiente
    - total del ciclo (apertura + ingresos - egresos)
    - ingresos por método de pago
    - egresos por método de pago
    - empleado que hizo la apertura y el cierre
    """
    def get(self, request):

        ID_APERTURA = 1
        ID_INGRESO  = 2
        ID_EGRESO   = 3
        ID_CIERRE   = 4

        cierres = (
            MovimientosCaja.objects
            .filter(id_tipo_movimiento_caja_id=ID_CIERRE)
            .order_by("-mv_fecha_hora")
        )

        historial = []

        for cierre in cierres:
            # Buscar apertura anterior
            apertura = (
                MovimientosCaja.objects
                .filter(
                    id_tipo_movimiento_caja_id=ID_APERTURA,
                    mv_fecha_hora__lte=cierre.mv_fecha_hora
                )
                .order_by("-mv_fecha_hora")
                .first()
            )

            if not apertura:
                continue

            # Ciclo entre apertura y cierre
            movimientos = MovimientosCaja.objects.filter(
                mv_fecha_hora__gte=apertura.mv_fecha_hora,
                mv_fecha_hora__lte=cierre.mv_fecha_hora
            )

            # Agrupar ingresos / egresos por método
            ingresos_qs = (
                movimientos.filter(id_tipo_movimiento_caja_id=ID_INGRESO)
                .values("id_metodo_pago__metpag_nombre")
                .annotate(total=Sum("mv_monto"))
                .order_by("id_metodo_pago__metpag_nombre")
            )

            egresos_qs = (
                movimientos.filter(id_tipo_movimiento_caja_id=ID_EGRESO)
                .values("id_metodo_pago__metpag_nombre")
                .annotate(total=Sum("mv_monto"))
                .order_by("id_metodo_pago__metpag_nombre")
            )

            # Pasar a listas mutables
            ingresos_por_mp = list(ingresos_qs)
            egresos_por_mp = list(egresos_qs)

            # ───────── INCLUIR LA APERTURA EN EL MÉTODO EFECTIVO ─────────
            # Solo para el resumen por método, NO para los totales generales.
            monto_apertura = apertura.mv_monto or 0
            nombre_efectivo = None
            try:
                if apertura.id_metodo_pago:
                    nombre_efectivo = apertura.id_metodo_pago.metpag_nombre
            except Exception:
                nombre_efectivo = None

            if monto_apertura and nombre_efectivo:
                encontrado = False
                for fila in ingresos_por_mp:
                    if fila["id_metodo_pago__metpag_nombre"] == nombre_efectivo:
                        fila["total"] = (fila["total"] or 0) + monto_apertura
                        encontrado = True
                        break
                if not encontrado:
                    ingresos_por_mp.append({
                        "id_metodo_pago__metpag_nombre": nombre_efectivo,
                        "total": monto_apertura,
                    })

            # Totales GENERALES (sin contar la apertura como ingreso)
            total_ing = sum([(r["total"] or 0) for r in ingresos_qs])
            total_egr = sum([(r["total"] or 0) for r in egresos_qs])

            total_final = (apertura.mv_monto or 0) + total_ing - total_egr

            # Empleado apertura / cierre
            def nombre_empleado(mov):
                try:
                    emp = mov.id_empleado
                    if not emp:
                        return None
                    nombre = (emp.emp_nombre or "").strip()
                    apellido = (emp.emp_apellido or "").strip()
                    full = f"{nombre} {apellido}".strip()
                    return full or None
                except Exception:
                    return None

            apertura_emp = nombre_empleado(apertura)
            cierre_emp = nombre_empleado(cierre)

            historial.append({
                "id_cierre": cierre.id_movimiento_caja,  # ← NUEVO
                "cierre_fecha": cierre.mv_fecha_hora,
                "apertura_fecha": apertura.mv_fecha_hora,
                "monto_apertura": float(apertura.mv_monto or 0),
                "ingresos": float(total_ing),
                "egresos": float(total_egr),
                "total_final": float(total_final),
                "apertura_empleado_nombre": apertura_emp or "-",
                "cierre_empleado_nombre": cierre_emp or "-",
                "por_metodo_ingresos": [
                    {
                        "metodo": i["id_metodo_pago__metpag_nombre"],
                        "monto": float(i["total"] or 0),
                    }
                    for i in ingresos_por_mp
                ],
                "por_metodo_egresos": [
                    {
                        "metodo": e["id_metodo_pago__metpag_nombre"],
                        "monto": float(e["total"] or 0),
                    }
                    for e in egresos_por_mp
                ],
            })


        return Response(historial, status=200)

class CajaHistorialDetalleView(APIView):
    """
    GET /api/caja/historial/<cierre_id>/

    Devuelve un solo ciclo de caja (apertura → cierre)
    con el mismo resumen que el historial + el detalle
    de TODOS los movimientos entre esas fechas.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, cierre_id):
        ID_APERTURA = TIPO_MOV_CAJA["APERTURA"]  # 1
        ID_INGRESO  = TIPO_MOV_CAJA["INGRESO"]   # 2
        ID_EGRESO   = TIPO_MOV_CAJA["EGRESO"]    # 3
        ID_CIERRE   = TIPO_MOV_CAJA["CIERRE"]    # 4

        # 1) Buscar el movimiento de CIERRE
        cierre = (
            MovimientosCaja.objects
            .select_related("id_empleado", "id_metodo_pago", "id_tipo_movimiento_caja")
            .filter(
                id_tipo_movimiento_caja_id=ID_CIERRE,
                id_movimiento_caja=cierre_id,
            )
            .first()
        )
        if not cierre:
            return Response(
                {"detail": "Cierre no encontrado para ese ID."},
                status=404,
            )

        # 2) Buscar la APERTURA inmediatamente anterior a ese cierre
        apertura = (
            MovimientosCaja.objects
            .select_related("id_empleado", "id_metodo_pago", "id_tipo_movimiento_caja")
            .filter(
                id_tipo_movimiento_caja_id=ID_APERTURA,
                mv_fecha_hora__lte=cierre.mv_fecha_hora,
            )
            .order_by("-mv_fecha_hora")
            .first()
        )
        if not apertura:
            return Response(
                {"detail": "No se encontró una apertura asociada a ese cierre."},
                status=404,
            )

        # 3) Movimientos entre apertura y cierre (INCLUIDOS)
        movimientos = (
            MovimientosCaja.objects
            .select_related(
                "id_empleado",
                "id_metodo_pago",
                "id_tipo_movimiento_caja",
                "id_venta",
            )
            .filter(
                mv_fecha_hora__gte=apertura.mv_fecha_hora,
                mv_fecha_hora__lte=cierre.mv_fecha_hora,
            )
            .order_by("mv_fecha_hora")
        )

        # 4) Agregados por método de pago (igual que en CajaHistorialView)
        ingresos_qs = (
            movimientos.filter(id_tipo_movimiento_caja_id=ID_INGRESO)
            .values("id_metodo_pago__metpag_nombre")
            .annotate(total=Sum("mv_monto"))
            .order_by("id_metodo_pago__metpag_nombre")
        )
        egresos_qs = (
            movimientos.filter(id_tipo_movimiento_caja_id=ID_EGRESO)
            .values("id_metodo_pago__metpag_nombre")
            .annotate(total=Sum("mv_monto"))
            .order_by("id_metodo_pago__metpag_nombre")
        )

        from decimal import Decimal  # asegurate de tenerlo importado arriba del archivo

        ingresos_por_mp = list(ingresos_qs)
        egresos_por_mp = list(egresos_qs)

        # Sumar la apertura al método EFECTIVO dentro de los ingresos
        monto_apertura = apertura.mv_monto or Decimal("0")
        nombre_efectivo = getattr(apertura.id_metodo_pago, "metpag_nombre", "Efectivo")

        if monto_apertura > 0:
            idx_existente = None
            for i, r in enumerate(ingresos_por_mp):
                if (r["id_metodo_pago__metpag_nombre"] or "Sin método") == nombre_efectivo:
                    idx_existente = i
                    break

            if idx_existente is not None:
                base_total = ingresos_por_mp[idx_existente]["total"] or Decimal("0")
                ingresos_por_mp[idx_existente]["total"] = base_total + monto_apertura
            else:
                ingresos_por_mp.append({
                    "id_metodo_pago__metpag_nombre": nombre_efectivo,
                    "total": monto_apertura,
                })


        # Totales generales (sin contar la apertura como ingreso)
        total_ing = sum((r["total"] or 0) for r in ingresos_qs)
        total_egr = sum((r["total"] or 0) for r in egresos_qs)
        total_final = (apertura.mv_monto or 0) + total_ing - total_egr

        # Helpers para nombre de empleado
        def nombre_empleado(mov):
            try:
                emp = mov.id_empleado
                if not emp:
                    return None
                nombre = (emp.emp_nombre or "").strip()
                apellido = (emp.emp_apellido or "").strip()
                full = f"{nombre} {apellido}".strip()
                return full or None
            except Exception:
                return None

        apertura_emp = nombre_empleado(apertura)
        cierre_emp = nombre_empleado(cierre)

        # 5) Serializar movimientos individuales
        movs_serializados = []
        for m in movimientos:
            tipo_nombre = ""
            try:
                tipo_nombre = m.id_tipo_movimiento_caja.tmovc_nombre
            except Exception:
                # fallback rápido
                if m.id_tipo_movimiento_caja_id == ID_APERTURA:
                    tipo_nombre = "Apertura"
                elif m.id_tipo_movimiento_caja_id == ID_INGRESO:
                    tipo_nombre = "Ingreso"
                elif m.id_tipo_movimiento_caja_id == ID_EGRESO:
                    tipo_nombre = "Egreso"
                elif m.id_tipo_movimiento_caja_id == ID_CIERRE:
                    tipo_nombre = "Cierre"

            metodo_nombre = ""
            try:
                metodo_nombre = m.id_metodo_pago.metpag_nombre
            except Exception:
                metodo_nombre = ""

            movs_serializados.append({
                "id": m.id_movimiento_caja,
                "fecha": m.mv_fecha_hora,
                "tipo": tipo_nombre,
                "metodo": metodo_nombre,
                "monto": float(m.mv_monto or 0),
                "observacion": getattr(m, "mv_descripcion", "") or "",
            })

        # 6) Armar respuesta
        data = {
            "id_cierre": cierre.id_movimiento_caja,
            "cierre_fecha": cierre.mv_fecha_hora,
            "apertura_fecha": apertura.mv_fecha_hora,
            "monto_apertura": float(apertura.mv_monto or 0),
            "ingresos": float(total_ing),
            "egresos": float(total_egr),
            "total_final": float(total_final),
            "apertura_empleado_nombre": apertura_emp or "-",
            "cierre_empleado_nombre": cierre_emp or "-",
            "por_metodo_ingresos": [
                {
                    "metodo": i["id_metodo_pago__metpag_nombre"],
                    "monto": float(i["total"] or 0),
                }
                for i in ingresos_por_mp
            ],
            "por_metodo_egresos": [
                {
                    "metodo": e["id_metodo_pago__metpag_nombre"],
                    "monto": float(e["total"] or 0),
                }
                for e in egresos_por_mp
            ],
            "movimientos": movs_serializados,
        }

        return Response(data, status=200)

class CategoriaProveedorViewSet(RoleProtectedViewSet): # <--- LA SOLUCIÓN
    queryset = CategoriaProveedores.objects.all().order_by("id_categoria_prov")
    serializer_class = CategoriaProveedorSerializer
    

class CajaIngresosRangoView(APIView):
    def get(self, request):
        from decimal import Decimal
        inicio = request.GET.get("inicio")
        fin = request.GET.get("fin")

        if not inicio or not fin:
            return Response({"detail": "Parámetros requeridos: inicio, fin"}, status=400)

        qs = (
            MovimientosCaja.objects
            .filter(
                mv_fecha_hora__date__range=(inicio, fin),
                id_tipo_movimiento_caja_id=TIPO_MOV_CAJA["INGRESO"]
            )
            .values("mv_fecha_hora__date")
            .annotate(total=Sum("mv_monto"))
            .order_by("mv_fecha_hora__date")
        )

        data = [
            {
                "fecha": str(f["mv_fecha_hora__date"]),
                "ingresos": float(f["total"] or Decimal("0"))
            }
            for f in qs
        ]

        return Response({"dias": data})

class IngresosHistoricos(APIView):
    """
    Devuelve TODOS los ingresos históricos agrupados por día,
    incluyendo días sin ingresos (como 0).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from decimal import Decimal
        from datetime import timedelta

        # 1) Traemos todos los ingresos
        movs = (
            MovimientosCaja.objects
            .filter(id_tipo_movimiento_caja_id=TIPO_MOV_CAJA["INGRESO"])
            .exclude(mv_fecha_hora__isnull=True)
            .order_by("mv_fecha_hora")
        )

        if not movs.exists():
            return Response({"dias": []})

        # 2) Rango desde la primera fecha hasta la última
        fecha_inicio = movs.first().mv_fecha_hora.date()
        fecha_fin = movs.last().mv_fecha_hora.date()

        # 3) Sumamos ingresos por fecha
        tot_por_dia = {}
        for m in movs:
            fecha = m.mv_fecha_hora.date()
            tot_por_dia[fecha] = tot_por_dia.get(fecha, Decimal("0")) + (m.mv_monto or Decimal("0"))

        # 4) Generamos todas las fechas del rango
        dias = []
        actual = fecha_inicio
        while actual <= fecha_fin:
            total = float(tot_por_dia.get(actual, Decimal("0")))
            dias.append({
                "fecha": actual.isoformat(),
                "ingresos": total,
            })
            actual += timedelta(days=1)

        return Response({"dias": dias})






class IngresosSemanaActual(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoy = timezone.localdate()
        # lunes de esta semana
        lunes = hoy - timedelta(days=hoy.weekday())

        qs = (
            MovimientosCaja.objects
            .filter(
                id_tipo_movimiento_caja_id=2,  # Ingreso
                mv_fecha_hora__date__gte=lunes,
                mv_fecha_hora__date__lte=hoy,
            )
            .annotate(fecha=TruncDate("mv_fecha_hora"))
            .values("fecha")
            .annotate(total=Sum("mv_monto"))
            .order_by("fecha")
        )

        dias = [
            {
                "fecha": item["fecha"].isoformat(),
                "ingresos": float(item["total"] or 0.0),
            }
            for item in qs
        ]

        return Response({"dias": dias})

class IngresosMesActualPorSemana(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from decimal import Decimal
        from datetime import timedelta

        hoy = timezone.localdate()
        año = hoy.year
        mes = hoy.month

        # ─────────────────────────────────────────────
        # 1) Traer todos los INGRESOS del mes actual
        # ─────────────────────────────────────────────
        movs = (
            MovimientosCaja.objects
            .filter(
                id_tipo_movimiento_caja_id=TIPO_MOV_CAJA["INGRESO"],
                mv_fecha_hora__year=año,
                mv_fecha_hora__month=mes,
            )
            .exclude(mv_fecha_hora__isnull=True)
            .order_by("mv_fecha_hora")
        )

        # 2) Sumar por día (YYYY-MM-DD)
        tot_por_dia = {}  # { date(): Decimal }
        for m in movs:
            fecha = m.mv_fecha_hora.date()
            tot_por_dia[fecha] = tot_por_dia.get(fecha, Decimal("0")) + (m.mv_monto or Decimal("0"))

        # 3) Generar todos los días del mes (del 1 hasta HOY)
        dias = []
        inicio_mes = hoy.replace(day=1)
        actual = inicio_mes
        while actual <= hoy:
            total = float(tot_por_dia.get(actual, Decimal("0")))
            dias.append({
                "fecha": actual.isoformat(),   # "2025-11-01", "2025-11-02", ...
                "ingresos": total,
            })
            actual += timedelta(days=1)

        # 4) (Opcional) seguir devolviendo también por semana del mes
        #    Semana 1: días 1–7, Semana 2: 8–14, etc.
        grupos_semana = {}  # { semanaMes: Decimal }
        for item in dias:
            # fecha ya viene como string YYYY-MM-DD
            f_str = item["fecha"]
            year, month, day = map(int, f_str.split("-"))
            semana_mes = (day - 1) // 7 + 1   # 1..5
            grupos_semana[semana_mes] = grupos_semana.get(semana_mes, 0.0) + item["ingresos"]

        semanas = [
            {
                "semana": int(num),
                "ingresos": float(total),
            }
            for num, total in sorted(grupos_semana.items(), key=lambda x: x[0])
        ]

        # Ahora devolvemos ambos:
        # - "dias": para que puedas graficar día a día el mes (lo que me pediste)
        # - "semanas": por si algo viejo seguía usando el formato anterior
        return Response({
            "dias": dias,
            "semanas": semanas,
        })


class IngresosAnioActualPorMes(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        año = timezone.localdate().year

        qs = (
            MovimientosCaja.objects
            .filter(
                id_tipo_movimiento_caja_id=2,
                mv_fecha_hora__year=año,
            )
            .annotate(mes=TruncMonth("mv_fecha_hora"))
            .values("mes")
            .annotate(total=Sum("mv_monto"))
            .order_by("mes")
        )

        meses = [
            {
                "mes": item["mes"].isoformat(),             # 2025-11-01
                "ingresos": float(item["total"] or 0.0),
            }
            for item in qs
        ]

        return Response({"meses": meses})

class IngresosPorAnio(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            MovimientosCaja.objects
            .filter(id_tipo_movimiento_caja_id=2)
            .annotate(anio=ExtractYear("mv_fecha_hora"))
            .values("anio")
            .annotate(total=Sum("mv_monto"))
            .order_by("anio")
        )

        años = [
            {
                "anio": int(item["anio"]),
                "ingresos": float(item["total"] or 0.0),
            }
            for item in qs
        ]

        return Response({"años": años})

class IngresosRango(APIView):
    """
    GET /api/caja/ingresos-rango/?start=2025-01-01&end=2025-03-31
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start = request.GET.get("start")
        end = request.GET.get("end")

        if not start or not end:
            return Response(
                {"detail": "Debe enviar parámetros 'start' y 'end' en formato YYYY-MM-DD"},
                status=400,
            )

        qs = (
            MovimientosCaja.objects
            .filter(
                id_tipo_movimiento_caja_id=2,
                mv_fecha_hora__date__range=[start, end],
            )
            .annotate(fecha=TruncDate("mv_fecha_hora"))
            .values("fecha")
            .annotate(total=Sum("mv_monto"))
            .order_by("fecha")
        )

        dias = [
            {
                "fecha": item["fecha"].isoformat(),
                "ingresos": float(item["total"] or 0.0),
            }
            for item in qs
        ]

        return Response({"dias": dias})
