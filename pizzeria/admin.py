# pizzeria/admin.py
from django.contrib import admin
from django.apps import apps

class EditableAdmin(admin.ModelAdmin):
    """
    Admin editable (por defecto). No vuelve los campos readonly.
    Si querés proteger algo puntual, usá readonly_fields o
    sobreescribí has_add/delete/change_permission de forma fina.
    """
    pass

# Registrar automáticamente todos los modelos de la app pizzeria con admin editable
app_config = apps.get_app_config('pizzeria')
for model in app_config.get_models():
    try:
        admin.site.register(model, EditableAdmin)
    except admin.sites.AlreadyRegistered:
        pass

