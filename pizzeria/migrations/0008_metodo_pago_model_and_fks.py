from django.db import migrations, models, connection
import django.db.models.deletion

def ensure_metodo_de_pago_table_and_column(apps, schema_editor):
    with connection.cursor() as cur:
        # 1) Crear tabla si no existe
        cur.execute("""
            CREATE TABLE IF NOT EXISTS metodo_de_pago (
                id_metodo_pago INT UNSIGNED NOT NULL AUTO_INCREMENT,
                PRIMARY KEY (id_metodo_pago)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

        # 2) Ver columnas existentes
        cur.execute("""
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'metodo_de_pago';
        """)
        cols = {row[0] for row in cur.fetchall()}

        has_metpag = 'metpag_nombre' in cols
        has_metp = 'metp_nombre' in cols  # por si quedó de una versión anterior

        # 3) Si existe metp_nombre lo renombramos a metpag_nombre
        if not has_metpag and has_metp:
            cur.execute("""
                ALTER TABLE metodo_de_pago
                CHANGE metp_nombre metpag_nombre VARCHAR(80) NOT NULL UNIQUE;
            """)
            has_metpag = True

        # 4) Si no existe ninguna, la agregamos
        if not has_metpag:
            cur.execute("""
                ALTER TABLE metodo_de_pago
                ADD COLUMN metpag_nombre VARCHAR(80) NOT NULL UNIQUE;
            """)

        # 5) Insertar registros por defecto si no existen
        for name in ('Efectivo', 'Tarjeta', 'Transferencia'):
            cur.execute("""
                INSERT INTO metodo_de_pago (metpag_nombre)
                SELECT %s FROM DUAL
                WHERE NOT EXISTS (
                    SELECT 1 FROM metodo_de_pago WHERE metpag_nombre = %s
                )
            """, [name, name])

class Migration(migrations.Migration):

    dependencies = [
        ('pizzeria', '0007_keep_estado_mesas'),
    ]

    operations = [
        migrations.RunPython(ensure_metodo_de_pago_table_and_column, migrations.RunPython.noop),

        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='MetodoDePago',
                    fields=[
                        ('id_metodo_pago', models.AutoField(primary_key=True, serialize=False)),
                        ('metpag_nombre', models.CharField(max_length=80, unique=True)),
                    ],
                    options={
                        'db_table': 'metodo_de_pago',
                        'managed': False,
                    },
                ),
            ],
        ),

        migrations.AddField(
            model_name='ventas',
            name='id_metodo_pago',
            field=models.ForeignKey(
                to='pizzeria.MetodoDePago',
                on_delete=django.db.models.deletion.SET_NULL,
                null=True, blank=True,
                db_column='id_metodo_pago',
                related_name='ventas_metodo_pago',
            ),
        ),

        migrations.AddField(
            model_name='compras',
            name='id_metodo_pago',
            field=models.ForeignKey(
                to='pizzeria.MetodoDePago',
                on_delete=django.db.models.deletion.SET_NULL,
                null=True, blank=True,
                db_column='id_metodo_pago',
                related_name='compras_metodo_pago',
            ),
        ),
    ]

