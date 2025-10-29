# pizzeria/migrations/0003_estado_mesas_state_only.py
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('pizzeria', '0002_estado_mesas_alter_mesas_options'),  # ← poné tu 0002 real
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                # 👇 NO HACEMOS NADA EN LA BD
            ],
            state_operations=[
                # 👇 SOLO registramos el modelo en el "estado" de Django
                migrations.CreateModel(
                    name='EstadoMesas',
                    fields=[
                        ('id_estado_mesa', models.AutoField(primary_key=True, serialize=False)),
                        ('estms_nombre', models.CharField(max_length=50, unique=True)),
                    ],
                    options={
                        'db_table': 'estado_mesas',  # misma tabla física
                        'managed': False,
                    },
                ),
            ],
        ),
    ]
