from django.db import migrations, models
from django.core.validators import MinValueValidator

class Migration(migrations.Migration):

    dependencies = [
        # 👇 Ajustá este nombre a la última migración APLICADA de pizzeria
        ("pizzeria", "0003_estado_mesas_state_only"),
    ]

    operations = [
        migrations.AddField(
            model_name="proveedoresxinsumos",   # <-- nombre EXACTO del modelo
            name="precio_unitario",
            field=models.DecimalField(
                max_digits=12,
                decimal_places=2,
                null=True, blank=True,
                validators=[MinValueValidator(0)],
                help_text="Precio unitario acordado para este proveedor-insumo."
            ),
        ),
    ]
