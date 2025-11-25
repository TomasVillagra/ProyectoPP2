# api/permissions.py  (ajustá la ruta según tu app)

from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model
from pizzeria.models import Empleados

User = get_user_model()


def _get_empleado_de_user(user):
    """
    Devuelve el registro Empleados vinculado al user (o None).
    """
    if not user or not user.is_authenticated:
        return None

    # 1) Relación OneToOne por related_name (si existe)
    try:
        emp = getattr(user, "empleados", None)
    except Exception:
        emp = None

    # 2) Fallback por FK usuario
    if not emp:
        emp = Empleados.objects.filter(usuario=user).first()

    return emp


def _es_mozo(user):
    """
    Devuelve True si el usuario tiene cargo Mozo,
    ya sea por Group o por el cargo del empleado.
    """
    if not user or not user.is_authenticated:
        return False

    # Por grupo de Django
    if user.groups.filter(name__iexact="mozo").exists():
        return True

    # Por cargo del empleado vinculado
    emp = _get_empleado_de_user(user)
    if not emp or not getattr(emp, "id_cargo_emp", None):
        return False

    nombre_cargo = (emp.id_cargo_emp.carg_nombre or "").strip().lower()
    return nombre_cargo == "mozo"


def _es_cajero(user):
    """
    Devuelve True si el usuario tiene cargo Cajero,
    ya sea por Group o por el cargo del empleado.
    """
    if not user or not user.is_authenticated:
        return False

    # Por grupo de Django
    if user.groups.filter(name__iexact="cajero").exists():
        return True

    # Por cargo del empleado vinculado
    emp = _get_empleado_de_user(user)
    if not emp or not getattr(emp, "id_cargo_emp", None):
        return False

    nombre_cargo = (emp.id_cargo_emp.carg_nombre or "").strip().lower()
    return nombre_cargo == "cajero"


class RolePermission(BasePermission):
    """
    - Admin / staff: pueden todo.

    - Mozo:
        Puede usar TODO lo necesario para trabajar con PEDIDOS:
          * /api/empleados/me/              (para saber quién es)
          * /api/pedidos/...
          * /api/pedido/...
          * /api/detalle-pedidos/...
          * /api/tipos-pedido/...
          * /api/estados-pedido/...
          * /api/clientes/...
          * /api/mesas/...
          * /api/estado-mesas/, /api/estados-mesa/...
          * /api/platos/...
          * /api/recetas/..., /api/receta/...
          * /api/recetas-detalle/..., /api/detalle-recetas/...
          * /api/insumos/..., /api/insumo/...

    - Cajero:
        Puede hacer TODO lo anterior (Mozo) + Caja/Ventas/Compras/Cobros:
          * /api/caja/...
          * /api/movimientos-caja/...
          * /api/metodos-pago/...
          * /api/ventas/, /api/detalle-ventas/...
          * /api/estado-ventas/..., etc.
          * /api/compras/, /api/detalle-compras/...
          * /api/cobros/ (si lo usás)
    """

    def has_permission(self, request, view):
        user = request.user

        # Debe estar autenticado
        if not user or not user.is_authenticated:
            return False

        # Admin / staff siempre pasan (Administrador puede hacer TODO)
        if user.is_superuser or user.is_staff:
            return True

        es_mozo = _es_mozo(user)
        es_cajero = _es_cajero(user)

        # Si no es mozo ni cajero -> de momento sin restricciones extra
        if not es_mozo and not es_cajero:
            return True

        path = (request.path or request.path_info or "").lower()

        # =======================
        # Prefijos que usa el MOZO
        # =======================
        mozo_prefixes = [
            # Info del propio empleado
            "/api/empleados/me",

            # Pedidos y detalle de pedidos
            "/api/pedidos",
            "/api/pedido",
            "/api/detalle-pedidos",

            # Catálogos de tipo/estado de pedido
            "/api/tipos-pedido",
            "/api/estados-pedido",

            # Clientes
            "/api/clientes",

            # Mesas y estados de mesa
            "/api/mesas",
            "/api/estado-mesas",
            "/api/estados-mesa",

            # Platos (para armar el pedido)
            "/api/platos",

            # Recetas (para validación de stock por receta)
            "/api/recetas",
            "/api/receta",
            "/api/recetas-detalle",
            "/api/detalle-recetas",

            # Insumos (para validar stock de insumos)
            "/api/insumos",
            "/api/insumo",
        ]

        # ==============
        # Lógica MOZO puro
        # ==============
        if es_mozo and not es_cajero:
            for pref in mozo_prefixes:
                if path.startswith(pref):
                    return True
            # Cualquier otro endpoint -> bloqueado para mozo
            return False

        # =====================
        # Lógica CAJERO (Mozo + Caja/Ventas/Compras)
        # =====================
        if es_cajero:
            cajero_extra_prefixes = [
                # Caja (estado, abrir, cerrar, historial, ingresos, etc.)
                "/api/caja",

                # Movimientos de caja
                "/api/movimientos-caja",
                "/api/movimientos_caja",

                # Métodos de pago
                "/api/metodos-pago",
                "/api/metodo-pago",

                # Ventas y detalle de ventas
                "/api/ventas",
                "/api/venta",
                "/api/detalle-ventas",
                "/api/detalles-venta",

                # Estados de venta (distintas variantes)
                "/api/estado-ventas",
                "/api/estado_ventas",
                "/api/estados-venta",
                "/api/estadosventa",

                # Compras (para cobros de compras)
                "/api/compras",
                "/api/compra",
                "/api/detalle-compras",
                "/api/detalles-compra",

                # Cobros (si en algún momento definís endpoints específicos)
                "/api/cobros",
                "/api/cobro",
            ]

            allowed_prefixes = mozo_prefixes + cajero_extra_prefixes

            for pref in allowed_prefixes:
                if path.startswith(pref):
                    return True

            # Si no matchea con ninguno, se bloquea para cajero
            return False

        # Caso raro de seguridad: si llegamos aquí, bloqueamos
        return False


