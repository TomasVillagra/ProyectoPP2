from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F

from pizzeria.models import (
    Empleados, Clientes, Insumos, Platos, Pedidos,
    Ventas, MovimientosCaja, TipoPedidos, EstadoPedidos, MetodoDePago,
    CargoEmpleados, EstadoEmpleados,
    Proveedores, EstadoProveedores, CategoriaProveedores,
    Recetas, DetalleRecetas, CategoriaPlatos, EstadoReceta,
    DetallePedidos, Mesas, EstadoCompra, DetalleCompra, Compras,ProveedoresXInsumos,EstadoMesas
)

from .serializers import (
    EmpleadosSerializer, ClienteSerializer, InsumoSerializer, PlatoSerializer,
    PedidoSerializer, VentaSerializer, MovimientoCajaSerializer, TipoPedidoSerializer,
    EstadoPedidoSerializer, MetodoPagoSerializer,
    CargoSerializer, EstadoEmpleadoSerializer,
    ProveedorSerializer, EstadoProveedorSerializer, CategoriaProveedorSerializer,
    RecetaSerializer, DetalleRecetaSerializer, CategoriaPlatoSerializer,
    EstadoRecetaSerializer, DetallePedidoSerializer,EstadoCompraSerializer,
    CompraSerializer,DetalleCompraSerializer,ProveedorInsumoSerializer,MesasSerializer,
    EstadoMesasSerializer,

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
class EmpleadosViewSet(ModelViewSet):
    queryset = Empleados.objects.all().order_by("-id_empleado")
    serializer_class = EmpleadosSerializer
    permission_classes = [IsAuthenticated]

    # GET /api/empleados/me/
    @action(detail=False, methods=["get"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user
        emp = None

        # Intentos de vinculación comunes (ajustá si tu modelo usa otra FK)
        try_fk_fields = ["usuario", "user", "id_usuario", "id_user", "emp_usuario"]
        field_names = {f.name for f in Empleados._meta.get_fields()}

        for fname in try_fk_fields:
            if fname in field_names:
                try:
                    emp = Empleados.objects.filter(**{fname: user}).first()
                except Exception:
                    emp = None
                if emp:
                    break

        # Fallback por email/username si no hay FK directa
        if not emp:
            u_email = getattr(user, "email", None)
            u_username = getattr(user, "username", None)
            if u_email and "emp_email" in field_names:
                emp = Empleados.objects.filter(emp_email__iexact=u_email).first()
            if not emp and u_email and "emp_correo" in field_names:
                emp = Empleados.objects.filter(emp_correo__iexact=u_email).first()
            if not emp and u_username and "emp_nombre" in field_names:
                emp = Empleados.objects.filter(emp_nombre__iexact=u_username).first()

        if not emp:
            return Response(
                {"detail": "No se encontró empleado asociado al usuario actual."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(EmpleadosSerializer(emp).data)


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
# Clientes, Insumos, Platos, Pedidos, etc.
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
    permission_classes = [IsAuthenticated]

    # ────────────────────────────────────────────────
    # Acción personalizada para descontar insumos
    # ────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="descontar_insumos")
    @transaction.atomic
    def descontar_insumos(self, request, pk=None):
        """
        Lógica con trazabilidad:
        1) Despacha primero desde el stock del PLATO (Platos.plt_stock).
        2) Si no alcanza, descuenta INSUMOS (DetalleRecetas.detr_cant_unid) para 'producir' el faltante.
        3) Traza producción (suma a plt_stock) y despacho (resta lo producido).
        """
        pedido = self.get_object()

        # Helpers acoplados a tu modelo real
        def get_cant_det_pedido(det_obj):
            # DetallePedidos.detped_cantidad
            return getattr(det_obj, "detped_cantidad", 0) or 0

        def get_cant_det_receta(dr_obj):
            # DetalleRecetas.detr_cant_unid
            return getattr(dr_obj, "detr_cant_unid", 0) or 0

        detalles = (
            DetallePedidos.objects
            .select_related("id_plato")
            .filter(id_pedido=pedido)
        )

        movimientos = {"platos": [], "insumos": []}

        for det in detalles:
            plato = getattr(det, "id_plato", None)
            if not plato:
                continue

            cant_pedida = get_cant_det_pedido(det)
            if cant_pedida <= 0:
                continue

            # 1) Despachar desde stock del plato
            stock_plato = getattr(plato, "plt_stock", 0) or 0
            consume_de_plato = min(stock_plato, cant_pedida)
            faltante = max(cant_pedida - consume_de_plato, 0)

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

            # 2) Si falta, consumir insumos según receta y trazar producción+despacho
            if faltante > 0:
                receta = Recetas.objects.filter(id_plato=plato).first()
                if receta:
                    detrec_qs = (
                        DetalleRecetas.objects
                        .select_related("id_insumo")
                        .filter(id_receta=receta)
                    )
                    # 2.a) Restar insumos por la producción del faltante
                    for dr in detrec_qs:
                        insumo = getattr(dr, "id_insumo", None)
                        if not insumo:
                            continue
                        qty_por_plato = get_cant_det_receta(dr)
                        if qty_por_plato <= 0:
                            continue

                        total_desc = qty_por_plato * faltante  # Decimal * int
                        Insumos.objects.filter(pk=insumo.pk).update(
                            ins_stock_actual=F("ins_stock_actual") - total_desc
                        )
                        movimientos["insumos"].append({
                            "insumo_id": insumo.pk,
                            "delta": float(-total_desc),
                            "campo": "ins_stock_actual",
                        })

                    # 2.b) Trazabilidad: producir (sumar) y despachar (restar) el faltante
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

class RecetaViewSet(ModelViewSet):
    queryset = (
        Recetas.objects
        .select_related("id_plato")
        .prefetch_related("detallerecetas_set__id_insumo")
        .all()
        .order_by("-id_receta")
    )
    serializer_class = RecetaSerializer
    permission_classes = [IsAuthenticated]

class DetalleRecetaViewSet(ModelViewSet):
    queryset = (
        DetalleRecetas.objects
        .select_related("id_receta", "id_insumo")
        .all()
        .order_by("-id_detalle_receta")
    )
    serializer_class = DetalleRecetaSerializer
    permission_classes = [IsAuthenticated]

class CategoriaPlatoViewSet(ModelViewSet):
    queryset = CategoriaPlatos.objects.all().order_by("-id_categoria_plato")
    serializer_class = CategoriaPlatoSerializer
    permission_classes = [IsAuthenticated]

class EstadoRecetaViewSet(ModelViewSet):
    queryset = EstadoReceta.objects.all().order_by("id_estado_receta")
    serializer_class = EstadoRecetaSerializer
    permission_classes = [IsAuthenticated]

class DetallePedidoViewSet(ModelViewSet):
    queryset = (
        DetallePedidos.objects
        .select_related("id_pedido", "id_plato")
        .all()
        .order_by("-id_detalle_pedido")
    )
    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated]

class EstadoMesasViewSet(ReadOnlyModelViewSet):
    queryset = EstadoMesas.objects.all().order_by("id_estado_mesa")
    serializer_class = EstadoMesasSerializer
    permission_classes = [IsAuthenticated]

class MesasViewSet(ModelViewSet):
    queryset = Mesas.objects.all().order_by("-id_mesa")
    serializer_class = MesasSerializer
    permission_classes = [IsAuthenticated]

class EstadoCompraViewSet(ReadOnlyModelViewSet):
    queryset = EstadoCompra.objects.all().order_by("id_estado_compra")
    serializer_class = EstadoCompraSerializer
    permission_classes = [IsAuthenticated]


class CompraViewSet(ModelViewSet):
    queryset = (
        Compras.objects
        .select_related("id_empleado", "id_estado_compra", "id_proveedor")
        .all()
        .order_by("-id_compra")
    )
    serializer_class = CompraSerializer
    permission_classes = [IsAuthenticated]


class DetalleCompraViewSet(ModelViewSet):
    queryset = (
        DetalleCompra.objects
        .select_related("id_compra", "id_insumo")
        .all()
        .order_by("-id_detalle_compra")
    )
    serializer_class = DetalleCompraSerializer
    permission_classes = [IsAuthenticated]

    # Permitir filtro por ?id_compra=<id> para editar
    def get_queryset(self):
        qs = super().get_queryset()
        id_compra = self.request.query_params.get("id_compra")
        if id_compra:
            qs = qs.filter(id_compra=id_compra)
        return qs

class ProveedorInsumoViewSet(ModelViewSet):
    """
    /api/proveedores-insumos/
      GET  ?id_proveedor=<id>  -> lista vínculos de un proveedor
           ?id_insumo=<id>     -> lista vínculos por insumo
      POST {id_proveedor, id_insumo}
      DELETE /api/proveedores-insumos/<id_prov_x_ins>/
    """
    serializer_class = ProveedorInsumoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ProveedoresXInsumos.objects.select_related("id_proveedor", "id_insumo").order_by("-id_prov_x_ins")
        pid = self.request.query_params.get("id_proveedor")
        iid = self.request.query_params.get("id_insumo")
        if pid:
            qs = qs.filter(id_proveedor_id=pid)
        if iid:
            qs = qs.filter(id_insumo_id=iid)
        return qs